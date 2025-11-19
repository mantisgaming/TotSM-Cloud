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

	constructor(ws: WebSocket, code: string, replyTimeout: number = 5000, ttl: number = 60) {
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
		console.log(`Relay "${this.code}": Client connecting to relay`);

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

					this.finalizeClientConnection(ws, ID);
					console.log(`Relay "${this.code}": Client "${ID}" joined`);
				}
				break;

			case RelayMessage.Type.DATA:
				this.forwardDataTo(message, RelayMessage.Direction.RELAY_TO_CLIENT, 1);
				break;

			case RelayMessage.Type.DISCONNECT:
				{
					this.kickClient(message.id)

				}
				break;

			case RelayMessage.Type.PING:
				this.server.send(RelayMessage.serialize({ type: RelayMessage.Type.PING, direction: RelayMessage.Direction.RELAY_TO_SERVER }));
				break;

			default:
				console.warn(`Relay "${this.code}": Unexpected message type from server: ${(data as Uint8Array)[0]}`)
		}
	}

	private finalizeClientConnection(ws: WebSocket, ID: number): void {
		this.peers.set(ID, ws);

		ws.on("close", this.onClientClose(ID).bind(this));
		ws.on("message", this.onClientMessage(ID).bind(this));
		ws.on("error", this.onClientError(ID).bind(this));

		let msg: RelayMessage.InformConnect | RelayMessage.AssignID = {
			direction: RelayMessage.Direction.RELAY_TO_CLIENT,
			type: RelayMessage.Type.ID,
			id: ID
		}

		ws.send(RelayMessage.serialize(msg));

		msg = {
			direction: RelayMessage.Direction.RELAY_TO_SERVER,
			type: RelayMessage.Type.CONNECT,
			id: ID
		};

		this.server.send(RelayMessage.serialize(msg));

		msg.id = 1;

		ws.send(RelayMessage.serialize(msg));
	}

	private kickClient(ID: number): void {
		// TODO: Refactor into new function
		let ws: WebSocket | undefined = this.peers.get(ID);

		if (ws == undefined) {
			console.warn(`Relay "${this.code}": Cannot kick client "${ID}" They do not exist.`);
			return;
		}

		ws.close(1001);
		this.peers.delete(ID);

		let msg: RelayMessage.InformDisconnect = {
			direction: RelayMessage.Direction.RELAY_TO_CLIENT,
			type: RelayMessage.Type.DISCONNECT,
			id: ID
		};

		this.server.send(RelayMessage.serialize(msg))

		msg.id = 1;

		ws.send(RelayMessage.serialize(msg));
	}

	private onServerError(error: Error): void {
		console.warn(`Relay "${this.code}": Server web socket error: ${error.message}\nStack: ${error.stack}`);
	}

	private onClientClose(ID: number): (wcode: number, reason: Buffer) => void {
		return (code: number, reason: Buffer) => {
			console.log(`Relay "${this.code}": Client "${ID}" disconnected`);

			let msg: RelayMessage.InformDisconnect = {
				direction: RelayMessage.Direction.RELAY_TO_CLIENT,
				type: RelayMessage.Type.DISCONNECT,
				id: ID
			};

			this.server.send(RelayMessage.serialize(msg));

			this.peers.delete(ID);
		};
	}

	private onClientMessage(ID: number): (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => void {
		return (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => {
			if (data == undefined)
				return;

			var message = RelayMessage.deserialize(data as Uint8Array, RelayMessage.Direction.CLIENT_TO_RELAY);

			switch (message.type) {
				case RelayMessage.Type.DATA:
					this.forwardDataTo(message, RelayMessage.Direction.RELAY_TO_SERVER, ID);
					return;
				case RelayMessage.Type.PING:
					this.server.send(RelayMessage.serialize({ type: RelayMessage.Type.PING, direction: RelayMessage.Direction.RELAY_TO_CLIENT }));
					return;
				default:
					console.warn(`Relay "${this.code}": Unexpected message type from client: ${(data as Uint8Array)[0]}`);
					return;
			}
		};
	}

	private onClientError(ID: number): (error: Error) => void {
		return (error: Error) => {
			console.warn(`Relay "${this.code}": Client "${ID}" web socket error: ${error.message}\nStack: ${error.stack}`);
		}
	}

	private forwardDataTo(message: RelayMessage.SendData, direction: RelayMessage.Direction, source: number): void {
		message.direction = direction;
		var destination: number = message.id;
		message.id = source;

		var ws = this.peers.get(destination);

		if (ws == undefined) {
			console.warn(`Relay "${this.code}": Cannot send data to invalid peer ID "${destination}"`);
			return;
		}

		ws.send(RelayMessage.serialize(message));
	}
}