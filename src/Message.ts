
export class Message {
    


}

export namespace Message {
    enum Type {
        UNDEFINED = -1,
        DEBUG,
        ERROR,
        DATA,
        CONNECT,
        DISCONNECT,
        SERVER_CODE,
        ASSIGN_ID
    }
}