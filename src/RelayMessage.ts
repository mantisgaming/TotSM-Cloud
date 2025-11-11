
export namespace RelayMessage {
    export enum Type {
        UNDEFINED = -1,
        DATA,
        CONNECT,
        DISCONNECT,
        CODE,
        ID,
        
        MAXIMUM
    }

    export enum Direction {
        SERVER_TO_RELAY,
        RELAY_TO_SERVER,
        CLIENT_TO_RELAY,
        RELAY_TO_CLIENT
    }

    export type RELAY_TO_ANY =
        Direction.RELAY_TO_CLIENT |
        Direction.RELAY_TO_SERVER;

    export type ANY_TO_RELAY =
        Direction.CLIENT_TO_RELAY |
        Direction.SERVER_TO_RELAY;

    export type Undefined = {
        type: Type.UNDEFINED,
        direction: Direction
    }

    export type SendCode = {
        type: Type.CODE,
        direction: Direction.RELAY_TO_SERVER,
        code: String
    }

    export type RequestID = {
        type: Type.ID,
        direction: Direction.RELAY_TO_SERVER
    }

    export type SendID = {
        type: Type.ID,
        direction: Direction.SERVER_TO_RELAY,
        id: number
    }

    export type AssignID = {
        type: Type.ID,
        direction: Direction.RELAY_TO_CLIENT,
        id: number
    }

    export type InformConnect = {
        type: Type.CONNECT,
        direction: RELAY_TO_ANY,
        id: number
    }

    export type SendData = {
        type: Type.DATA,
        direction: Direction,
        id: number,
        data: Uint8Array
    }

    export type KickClient = {
        type: Type.DISCONNECT,
        direction: Direction.SERVER_TO_RELAY,
        id: number
    }

    export type InformClientDisconnect = {
        type: Type.DISCONNECT,
        direction: RELAY_TO_ANY,
        id: number
    }

    export function deserialize(data: Uint8Array, direction: Direction): RelayMessage {
        var undef: Undefined = {
            direction: direction,
            type: Type.UNDEFINED
        }

        if (data.length == 0)
            return undef;

        var messageType: Type = Type.UNDEFINED;

        if (data[0] as number < Type.MAXIMUM.valueOf())
            messageType = data[0] as number;
        
        switch(messageType) {
            case Type.DATA:
                return {
                    type: messageType,
                    direction: direction,
                    id: parseS32(data.subarray(1,5)),
                    data: data.subarray(5)
                };

            case Type.CONNECT:
                if (direction == Direction.CLIENT_TO_RELAY || direction == Direction.SERVER_TO_RELAY)
                    return undef;
                
                return {
                    type: messageType,
                    direction: direction,
                    id: parseS32(data.subarray(1,5))
                };

            case Type.DISCONNECT:
                if (direction == Direction.CLIENT_TO_RELAY)
                    return undef;

                return {
                    type: messageType,
                    direction: direction,
                    id: parseS32(data.subarray(1,5))
                };

            case Type.CODE:
                if (direction == Direction.RELAY_TO_SERVER)
                    return {
                        type: messageType,
                        direction: direction,
                        code: new TextDecoder().decode(data.subarray(1))
                    };

                return undef;
                
            case Type.ID:
                if (direction == Direction.CLIENT_TO_RELAY)
                    return undef;

                if (direction == Direction.RELAY_TO_SERVER)
                    return {
                        type: messageType,
                        direction: direction
                    };
                
                return {
                    type: messageType,
                    direction: direction,
                    id: parseS32(data.subarray(1,5))
                };
        }

        return {
            direction: direction as ANY_TO_RELAY,
            type: Type.UNDEFINED
        };
    }

    function parseS32(data: Uint8Array): number {
        if (data.length < 4)
            throw Error("Cannot parse int 32 from less than 4 bytes");

        var n1 = data[0] as number;
        var n2 = data[1] as number;
        var n3 = data[2] as number;
        var n4 = data[3] as number;

        return n1 << 24 + n2 << 16 + n3 << 8 + n4;
    }

    export function serialize(data: RelayMessage): Uint8Array {
        var result = new Uint8Array();

        return result;
    }
}

export type RelayMessage =
    RelayMessage.Undefined |
    RelayMessage.SendCode |
    RelayMessage.RequestID |
    RelayMessage.SendID |
    RelayMessage.AssignID |
    RelayMessage.InformConnect |
    RelayMessage.SendData |
    RelayMessage.KickClient |
    RelayMessage.InformClientDisconnect;