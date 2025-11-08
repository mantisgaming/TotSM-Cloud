import { RelayServer } from "./RelayServer";

const server: RelayServer = new RelayServer();

server.listen(parseInt(process.env.NODE_PORT ?? "8080"));