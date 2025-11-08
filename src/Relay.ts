import { WebSocket } from "ws";
import { getCurrentTime } from "./util";

enum Message {
	UNDEFINED = -1,
	DEBUG,
	ERROR,
	DATA,
	CONNECT,
	DISCONNECT,
	SERVER_CODE,
	ASSIGN_ID
}

export class Relay {
	private server: WebSocket;
    private code: string;
	private ttl: number;
	private lastMessage: number;

	private clients: Map<number, WebSocket> = new Map<number, WebSocket>();

	constructor (ws: WebSocket, code: string, ttl: number = 60) {
		this.server = ws;
		this.code = code;
		this.ttl = ttl;
		this.lastMessage = getCurrentTime();

		console.log(`Relay created with code ${this.code}`)

		ws.on("close", () => {
			console.log(`Server hosting ${this.code} disconnected`);
		});

		// TODO: Add websocket callbacks for server
	}

	public getCode(): string {
		return this.code;
	}

	public cleanup(): void {
		if (this.hasTimedOut()) {
			this.close(3008);
		} else if (this.server.readyState == WebSocket.CLOSED) {
			this.close(1001)
		}
	}

	private hasTimedOut(): boolean {
		return getCurrentTime() >= this.lastMessage + this.ttl;
	}

	public isClosed(): boolean {
		return this.server.readyState == WebSocket.CLOSED;
	}

	public isOpen(): boolean {
		return this.server.readyState == WebSocket.OPEN;
	}

	public close(code?: number): void {
		this.server.close(code);
		this.clients.forEach((client) => {
			client.close(code);
		});
	}

	public async connect(ws: WebSocket): Promise<void> {
		// TODO: Request id from server
		// TODO: Add to client list
		// TODO: Add websocket callbacks for client
	}
}