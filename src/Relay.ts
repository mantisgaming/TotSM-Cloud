import { WebSocket } from "ws";
import { getCurrentTime } from "./util";
import { RelayMessage } from "./RelayMessage";

export class Relay {
    private code: string;
	private ttl: number;
	private lastMessage: number;
	private replyTimeout: number;

	private clientQueue: WebSocket[] = [];

	private peers: Map<number, WebSocket> = new Map<number, WebSocket>();

	
	private get server(): WebSocket {
		return this.peers.get(1) as WebSocket;
	};

	constructor (ws: WebSocket, code: string, replyTimeout: number = 5000, ttl: number = 60) {
		this.peers.set(1, ws);
		this.code = code;
		this.ttl = ttl;
		this.lastMessage = getCurrentTime();
		this.replyTimeout = replyTimeout;

		console.log(`Relay "${this.code}": created`);

		ws.on("ping", () => this.lastMessage = getCurrentTime());
		ws.on("message", () => this.lastMessage = getCurrentTime());
		
		ws.on("error", this.onServerError.bind(this));
		ws.on("close", this.onServerClose.bind(this));
		ws.on("message", this.onServerMessage.bind(this));

		ws.send(RelayMessage.serialize({
			type: RelayMessage.Type.CODE,
			direction: RelayMessage.Direction.RELAY_TO_SERVER,
			code: this.code
		}));
	}

	public getCode(): string {
		return this.code;
	}

	public cleanup(): void {
		if (this.server.readyState == global.WebSocket.CLOSED) {
			this.close();
			console.log(`Relay "${this.code}": disconnected`);
		} else if (this.hasTimedOut()) {
			this.close(3008);
			console.log(`Relay "${this.code}": timed out`);
		}
	}

	private hasTimedOut(): boolean {
		return getCurrentTime() >= this.lastMessage + this.ttl;
	}

	public isClosed(): boolean {
		return this.server.readyState == global.WebSocket.CLOSED;
	}

	public isOpen(): boolean {
		return this.server.readyState == global.WebSocket.OPEN;
	}

	public close(code?: number): void {
		this.server.close(code);
		this.peers.forEach((client) => {
			client.close(code);
		});
	}

	public connect(ws: WebSocket): void {
		console.log(`Client: Attempting to connect to relay "${this.code}"`);

		this.clientQueue.push(ws);

		var message: RelayMessage.RequestID = {
			direction: RelayMessage.Direction.RELAY_TO_SERVER,
			type: RelayMessage.Type.ID
		};

		this.server.send(RelayMessage.serialize(message));

		ws.on("ping", () => this.lastMessage = getCurrentTime());
		ws.on("message", () => this.lastMessage = getCurrentTime());
	}

	private onServerClose(): void {
		console.log(`Relay "${this.code}": Server disconnected`);
		this.close();
	}

	private onServerMessage(data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean): void {
		if (data == undefined)
			return;
		
		var message = RelayMessage.deserialize(data as Uint8Array, RelayMessage.Direction.SERVER_TO_RELAY);

		switch (message.type) {
			case RelayMessage.Type.ID:
				message = message as RelayMessage.SendID;
				if (this.clientQueue.length > 0) {
					let ws: WebSocket = this.clientQueue.pop() as WebSocket;
					let ID: number = message.id;

					// TODO: Refactor into new function
					this.peers.set(ID, ws);
		
					ws.on("close", () => this.onClientClose(ID).bind(this));
					ws.on("message", () => this.onClientMessage(ID).bind(this));
					ws.on("error", () => this.onClientError(ID).bind(this));

					let msg: RelayMessage.InformConnect = {
						direction: RelayMessage.Direction.RELAY_TO_CLIENT,
						type: RelayMessage.Type.CONNECT,
						id: message.id
					};
					
					let bytes = RelayMessage.serialize(msg);

					// TODO: Only send 0 to client and numeber to server
					this.peers.forEach((ws) => {
						ws.send(bytes);
					});

					console.log(`Relay ${this.code}: Client ${message.id} joined`);
				}
				break;

			case RelayMessage.Type.DATA:
				this.forwardDataTo(message, RelayMessage.Direction.RELAY_TO_CLIENT, 1);
				break;

			case RelayMessage.Type.DISCONNECT:
				{
					// TODO: Refactor into new function
					let ws: WebSocket | undefined = this.peers.get(message.id);
					
					if (ws == undefined) {
						console.warn(`Cannot kick client "${message.id}" from "${this.code}". They do not exist.`);
						break;
					}

					ws.close(1001);
					this.peers.delete(message.id);

					let msg: RelayMessage.InformDisconnect = {
						direction: RelayMessage.Direction.RELAY_TO_CLIENT,
						type: RelayMessage.Type.DISCONNECT,
						id: message.id
					};

					let bytes = RelayMessage.serialize(msg);

					this.peers.forEach((ws) => {
						ws.send(bytes);
					});
				}
				break;
			
			case RelayMessage.Type.PING:
				break;

			default:
				console.warn(`Unexpected message type from server: ${(data as Uint8Array)[0]}`)
		}
	}

	private onServerError(error: Error): void {
		console.warn(`Server "${this.code}" web socket error: ${error.message}\nStack: ${error.stack}`);
	}

	private onClientClose(ID: number): (ws: WebSocket, code: number, reason: Buffer) => void {
		return (ws: WebSocket, code: number, reason: Buffer) => {
			console.log(`Client ${ID} disconnected from ${this.code}`);
			// TODO: Remove client from list and send disconnect messages
		};
	}

	private onClientMessage(ID: number): (ws: WebSocket, data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => void {
		return (ws: WebSocket, data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => {
			if (data == undefined)
				return;
			
			var message = RelayMessage.deserialize(data as Uint8Array, RelayMessage.Direction.CLIENT_TO_RELAY);

			if (message.type != RelayMessage.Type.DATA) {
				console.warn(`Unexpected message type from client: ${message.type}`);
				return;
			}

			this.forwardDataTo(message, RelayMessage.Direction.RELAY_TO_SERVER, ID);
		};
	}

	private onClientError(ID: number): (ws: WebSocket, error: Error) => void {
		return (ws: WebSocket, error: Error) => {
			console.warn(`Client "${ID}" on relay "${this.code}": Web socket error: ${error.message}\nStack: ${error.stack}`);
		}
	}

	private forwardDataTo(message: RelayMessage.SendData, direction: RelayMessage.Direction, source: number): void {
		message.direction = direction;
		var destination: number = message.id;
		message.id = source;

		var ws = this.peers.get(destination);

		if (ws == undefined) {
			console.warn(`Relay "${this.code}": Invalid peer ID "${destination}"`);
			return;
		}

		ws.send(RelayMessage.serialize(message));
	}
}