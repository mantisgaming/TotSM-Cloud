
import express from "express";
import expressWs from "express-ws";
import morgan from "morgan";
import { WebSocket } from "ws";
import { Relay } from "./Relay";
import { CodeGenerator } from "./CodeGenerator";
import { getCurrentTime } from "./util";

export class RelayServer {

    private app: expressWs.Application;
    private relays: Map<string, Relay> = new Map<string, Relay>();
    private codeGenerator: CodeGenerator;
	private lastCleanup: number;
    private cleanupInterval: number;
    private replyTimeout: number;

    constructor(route: string = "/", codeLength: number = 4, cleanupInterval: number = 5, replyTimeout: number = 5000) {
        var { app } = expressWs(express());
        this.app = app;
        this.codeGenerator = new CodeGenerator(codeLength);
        this.lastCleanup = getCurrentTime();
        this.cleanupInterval = cleanupInterval;
        this.replyTimeout = replyTimeout;
        
        if (route.endsWith("/")) {
            route = route.substring(0, route.length - 2);
        }

        app.use(morgan("common"))

        app.use(() => {
            this.cleanup();
        });

        app.ws(`${route}/create`, (ws) => {
            this.onCreate(ws);
        });
        
        app.ws(`${route}/join/:gameID`, (ws, req) => {
            this.onJoin(ws, req.params.gameID as string);
        });

        app.use((req, res) => {
            res.sendStatus(404);
        })

        app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error(err.message);
            console.error(err.stack);
        });
    }

    listen(port: number): void {
        this.app.listen(port);
    }

    cleanup(): void {
        if (getCurrentTime() < this.lastCleanup + this.cleanupInterval)
            return;

        this.lastCleanup = getCurrentTime();
        console.log("Cleaning relays...");

        var removals: string[] = [];

        this.relays.forEach((relay, code) => {
            relay.cleanup();
            if (relay.isClosed())
                removals.push(code);
        });

        removals.forEach((code) => {
            console.log(`Deleting entry: ${code}`);
            this.relays.delete(code);
        });

        console.log("Cleaning complete");
    }

    private onCreate(ws: WebSocket): void {
        var code: string;

        do {
            code = this.codeGenerator.generateCode();
        } while (this.relays.has(code));

        this.relays.set(code, new Relay(ws, code, this.replyTimeout));
    }

    private onJoin(ws: WebSocket, code: string): void {

        // Remove case sensitivity
        code = code.toUpperCase();

        if (code.length != this.codeGenerator.getCodeLength())

        // Check for only letter characters
        for (var i = 0; i < code.length; i++) {
            if (code.charCodeAt(i) <= 64 || code.charCodeAt(i) >= 91) {
                ws.close(1007);
                return;
            }
        }

        // Check that the server exists
        if (!this.relays.has(code)) {
            ws.close(1007);
        }

        var relay: Relay = this.relays.get(code) as Relay;

        if (relay.isOpen())
            relay.connect(ws);
    }
}