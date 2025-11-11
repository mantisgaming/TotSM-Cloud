import { RelayMessage } from "../RelayMessage";

describe("Relay Message", () => {
    test("Fail to serialize undefined", () => {
        var msg: RelayMessage.Undefined = {
            direction: RelayMessage.Direction.RELAY_TO_CLIENT,
            type: RelayMessage.Type.UNDEFINED
        };

        expect(() => RelayMessage.serialize(msg)).toThrow(Error);
    });

    test("Deserialize empty", () => {
        var result = RelayMessage.deserialize(
            new Uint8Array([]),
            RelayMessage.Direction.CLIENT_TO_RELAY
        );

        expect(result.type).toBe(RelayMessage.Type.UNDEFINED);
        expect(result.direction).toBe(RelayMessage.Direction.CLIENT_TO_RELAY);
    });

    test("Serialize data", () => {
        var msg: RelayMessage.SendData = {
            direction: RelayMessage.Direction.CLIENT_TO_RELAY,
            data: new Uint8Array([5, 1, 3, 2]),
            id: 5,
            type: RelayMessage.Type.DATA
        };

        var serialized = RelayMessage.serialize(msg);

        expect(serialized.length).toBe(9);
        expect(serialized[0]).toBe(0);
        expect(serialized[1]).toBe(0);
        expect(serialized[2]).toBe(0);
        expect(serialized[3]).toBe(0);
        expect(serialized[4]).toBe(5);
        expect(serialized[5]).toBe(5);
        expect(serialized[6]).toBe(1);
        expect(serialized[7]).toBe(3);
        expect(serialized[8]).toBe(2);
    });

    test("Deserialize data", () => {

        var result = RelayMessage.deserialize(
            new Uint8Array([0, 0, 0, 0, 5, 5, 1, 3, 2]),
            RelayMessage.Direction.CLIENT_TO_RELAY
        );

        expect(result.type).toBe(RelayMessage.Type.DATA);
        result = result as RelayMessage.SendData;

        expect(result.id).toBe(5);
        expect(result.direction).toBe(RelayMessage.Direction.CLIENT_TO_RELAY);
        expect(result.data[0]).toBe(5);
        expect(result.data[1]).toBe(1);
        expect(result.data[2]).toBe(3);
        expect(result.data[3]).toBe(2);
    });

    test("Serialize connect", () => {
        var msg: RelayMessage.InformConnect = {
            direction: RelayMessage.Direction.RELAY_TO_CLIENT,
            id: 512,
            type: RelayMessage.Type.CONNECT
        };

        var serialized = RelayMessage.serialize(msg);

        expect(serialized.length).toBe(5);
        expect(serialized[0]).toBe(1);
        expect(serialized[1]).toBe(0);
        expect(serialized[2]).toBe(0);
        expect(serialized[3]).toBe(2);
        expect(serialized[4]).toBe(0);
    });

    test("Deserialize connect", () => {

        var result = RelayMessage.deserialize(
            new Uint8Array([1, 0, 0, 2, 0]),
            RelayMessage.Direction.RELAY_TO_CLIENT
        );

        expect(result.type).toBe(RelayMessage.Type.CONNECT);
        result = result as RelayMessage.InformConnect;

        expect(result.id).toBe(512);
        expect(result.direction).toBe(RelayMessage.Direction.RELAY_TO_CLIENT);
    });

    test("Serialize disconnect", () => {
        var msg: RelayMessage.InformDisconnect = {
            direction: RelayMessage.Direction.RELAY_TO_CLIENT,
            id: 515,
            type: RelayMessage.Type.DISCONNECT
        };

        var serialized = RelayMessage.serialize(msg);

        expect(serialized.length).toBe(5);
        expect(serialized[0]).toBe(2);
        expect(serialized[1]).toBe(0);
        expect(serialized[2]).toBe(0);
        expect(serialized[3]).toBe(2);
        expect(serialized[4]).toBe(3);
    });

    test("Deserialize disconnect", () => {

        var result = RelayMessage.deserialize(
            new Uint8Array([2, 0, 0, 2, 3]),
            RelayMessage.Direction.RELAY_TO_CLIENT
        );

        expect(result.type).toBe(RelayMessage.Type.DISCONNECT);
        result = result as RelayMessage.InformDisconnect;

        expect(result.id).toBe(515);
        expect(result.direction).toBe(RelayMessage.Direction.RELAY_TO_CLIENT);
    });

    test("Serialize code", () => {
        var msg: RelayMessage.SendCode = {
            direction: RelayMessage.Direction.RELAY_TO_SERVER,
            type: RelayMessage.Type.CODE,
            code: "ABCD"
        };

        var serialized = RelayMessage.serialize(msg);

        expect(serialized.length).toBe(5);
        expect(serialized[0]).toBe(3);
        expect(serialized[1]).toBe(0x41);
        expect(serialized[2]).toBe(0x42);
        expect(serialized[3]).toBe(0x43);
        expect(serialized[4]).toBe(0x44);
    });

    test("Deserialize code", () => {

        var result = RelayMessage.deserialize(
            new Uint8Array([3, 0x41, 0x42, 0x43, 0x44]),
            RelayMessage.Direction.RELAY_TO_SERVER
        );

        expect(result.type).toBe(RelayMessage.Type.CODE);
        result = result as RelayMessage.SendCode;

        expect(result.code).toBe("ABCD");
        expect(result.direction).toBe(RelayMessage.Direction.RELAY_TO_SERVER);
    });

    test("Serialize request ID", () => {
        var msg: RelayMessage.RequestID = {
            direction: RelayMessage.Direction.RELAY_TO_SERVER,
            type: RelayMessage.Type.ID
        };

        var serialized = RelayMessage.serialize(msg);

        expect(serialized.length).toBe(1);
        expect(serialized[0]).toBe(4);
    });

    test("Deserialize request ID", () => {

        var result = RelayMessage.deserialize(
            new Uint8Array([4]),
            RelayMessage.Direction.RELAY_TO_SERVER
        );

        expect(result.type).toBe(RelayMessage.Type.ID);
        result = result as RelayMessage.SendID | RelayMessage.SendID;

        expect(result.id).toBeUndefined();
        expect(result.direction).toBe(RelayMessage.Direction.RELAY_TO_SERVER);
    });

    test("Serialize send ID", () => {
        var msg: RelayMessage.SendID = {
            direction: RelayMessage.Direction.SERVER_TO_RELAY,
            type: RelayMessage.Type.ID,
            id: 128
        };

        var serialized = RelayMessage.serialize(msg);

        expect(serialized.length).toBe(5);
        expect(serialized[0]).toBe(4);
        expect(serialized[1]).toBe(0);
        expect(serialized[2]).toBe(0);
        expect(serialized[3]).toBe(0);
        expect(serialized[4]).toBe(128);
    });

    test("Deserialize send ID", () => {

        var result = RelayMessage.deserialize(
            new Uint8Array([4, 0, 0, 0, 128]),
            RelayMessage.Direction.SERVER_TO_RELAY
        );

        expect(result.type).toBe(RelayMessage.Type.ID);
        result = result as RelayMessage.SendID | RelayMessage.SendID;

        expect(result.id).toBe(128);
        expect(result.direction).toBe(RelayMessage.Direction.SERVER_TO_RELAY);
    });
});