
import express from "express";
import { createProxy } from "http-proxy";

const app = express();
const proxy = createProxy();

app.get("/api/game/create", (req, res) => {
    // TODO: create a game code and associate with the requester's IP
});

app.get("/api/game/heartbeat/:gameID", (req, res) => {
    // TODO: keep gameID alive
    // req.params.gameID
});

app.get("/api/game/connect/:gameID", (req, res) => {
    // TODO: connect a websocket to a server
    // req.params.gameID
});

app.listen(8080);
