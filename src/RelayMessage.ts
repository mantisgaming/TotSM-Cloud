
export namespace RelayMessage {
    export enum Type {
        UNDEFINED = -1,
        DEBUG,
        ERROR,
        DATA,
        CONNECT,
        DISCONNECT,
        SERVER_CODE,
        ASSIGN_ID,
        
        MAXIMUM
    }

    export function deserialize(data: Uint8Array): RelayMessage {

        if (data.length == 0)
            return { type: Type.UNDEFINED };

        var messageType: Type = Type.UNDEFINED;

        if (data[0] as number < Type.MAXIMUM.valueOf())
            messageType = data[0] as number;
        
        switch(messageType) {
            case Type.DEBUG:
            case Type.ERROR:
                return {
                    type: messageType,
                    message: data.subarray(1).toString()
                }
            case Type.DATA:
                return {
                    type: messageType,
                    clientID: 
                    data: data.subarray(1)
                }
        }

        return {
            type: Type.UNDEFINED
        };
    }

    export function serialize(data: RelayMessage): Uint8Array {
        var result = new Uint8Array();

        return result;
    }
}

export type RelayMessage = {
   sourceID: number 
} &
(
    {
        type: RelayMessage.Type.UNDEFINED
    } | {
        type: RelayMessage.Type.DEBUG | RelayMessage.Type.ERROR,
        message: string
    } | {
        type: RelayMessage.Type.DATA,
        destinationID: number,
        data: Uint8Array
    } | {
        type: RelayMessage.Type.CONNECT,
        destinationID: number
    } | {
        type: RelayMessage.Type.DISCONNECT,
        destinationID: number
    } | {
        type: RelayMessage.Type.SERVER_CODE,
        code: string
    } | {
        type: RelayMessage.Type.ASSIGN_ID,
        clientID?: number
    }
)