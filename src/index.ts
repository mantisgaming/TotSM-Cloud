import { RelayServer } from "./RelayServer";

const server: RelayServer = new RelayServer(process.env.ROOT_ROUTE ?? "/");

server.listen(parseInt(process.env.NODE_PORT ?? "8080"));