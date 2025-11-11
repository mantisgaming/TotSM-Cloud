import { WebSocket } from "ws";
import { getCurrentTime } from "./util";
import { RelayMessage } from "./RelayMessage";

export class Relay {
    private code: string;
	private ttl: number;
	private lastMessage: number;
	private replyTimeout: number;

	private clients: Map<number, WebSocket> = new Map<number, WebSocket>();

	
	private get server(): WebSocket {
		return this.clients.get(1) as WebSocket;
	};

	constructor (ws: WebSocket, code: string, replyTimeout: number = 5000, ttl: number = 60) {
		this.clients.set(1, ws);
		this.code = code;
		this.ttl = ttl;
		this.lastMessage = getCurrentTime();
		this.replyTimeout = replyTimeout;

		console.log(`Relay "${this.code}": created`);

		ws.on("ping", () => this.lastMessage = getCurrentTime());
		ws.on("message", () => this.lastMessage = getCurrentTime());
		ws.on("error", this.onServerError.bind(this));

		ws.send(RelayMessage.serialize({
			type: RelayMessage.Type.CODE,
			direction: RelayMessage.Direction.RELAY_TO_SERVER,
			code: this.code
		}));
		
		ws.on("close", this.onServerClose.bind(this));
		ws.on("message", this.onServerMessage.bind(this));

		// TODO: Add websocket callbacks for server
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
		this.clients.forEach((client) => {
			client.close(code);
		});
	}

	public async connect(ws: WebSocket): Promise<void> {
		console.log(`Client: Attempting to connect to relay "${this.code}"`);

		// var ID: number;

		// try {
		// 	ID = await this.RequestID();
		// } catch {
		// 	console.log(`Client connection failed for server "${this.code}". ID not received.`);
		// 	ws.close();
		// 	return;
		// }

		// this.clients.set(ID, ws);
		// // TODO: Tell server the client has connected

		// ws.on("ping", () => this.lastMessage = getCurrentTime());
		// ws.on("message", () => this.lastMessage = getCurrentTime());
		
		// ws.on("close", () => this.onClientClose(ID).bind(this));
		// ws.on("message", () => this.onClientMessage(ID).bind(this));
		// ws.on("error", () => this.onClientError(ID).bind(this));
	}

	private onServerClose(): void {
		console.log(`Relay "${this.code}": Server disconnected`);
		this.close();
	}

	private onServerMessage(ws: WebSocket, data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean): void {
		// TODO: Relay message to client
	}

	private onServerError(ws: WebSocket, error: Error): void {
		console.warn(`Server "${this.code}" web socket error: ${error.message}\nStack: ${error.stack}`);
	}

	private onClientClose(ID: number): (ws: WebSocket, code: number, reason: Buffer) => void {
		console.log(`Client ${ID} disconnected from ${this.code}`);
		return (ws: WebSocket, code: number, reason: Buffer) => {
			// TODO: Remove client from list and send disconnect messages
		};
	}

	private onClientMessage(ID: number): (ws: WebSocket, data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => void {
		return (ws: WebSocket, data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => {
			// TODO: Relay message to server
		};
	}

	private onClientError(ID: number): (ws: WebSocket, error: Error) => void {
		return (ws: WebSocket, error: Error) => {
			console.warn(`Client "${ID}" on relay "${this.code}": Web socket error: ${error.message}\nStack: ${error.stack}`);
		}
	}
}