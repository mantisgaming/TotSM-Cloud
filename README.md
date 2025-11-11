# Treasure of the Sierra Madre Cloud Server
Created by Max Allen

## Paths
|Path|Description|
|-|-|
|`/create`|Connecting a websocket to this path will create a new relay as a server|
|`/join/:code`|Connecting a websocket to this path will connect to an existing relay as a client|

## Environment
|Variable|Description|
|-|-|
|`NODE_PORT`|The port on which the server will accept connections|
|`ROOT_ROUTE`|The root path for the server address|

## Websocket Messages
|Name|Type ID|Description|
|-|-|-|
|[DATA](#data)|0|Send a Godot data packet|
|[CONNECT](#connect)|1|Signal that a client has connected|
|[DISCONNECT](#disconnect)|2|Request or signal a client disconnect|
|[CODE](#server_code)|3|Request or send the server code|
|[ID](#ID)|4|Request or send a new client ID|

### DATA

- #### Server to Relay or Client to Relay
    Recieve data to relay to a connection

    |Bytes|Datatype|Description|
    |-|-|-|
    |0|uint8|Message type ID|
    |1-4|int32|Destination client ID|
    |5-n|blob|Data|

- #### Relay to Server or Relay to Client

    Data being sent to a connection

    |Bytes|Datatype|Description|
    |-|-|-|
    |0|uint8|Message type ID|
    |1-4|int32|Source client ID|
    |5-n|blob|Data|

### CONNECT

- #### Relay to Server or Relay to Client

    Inform a connection that another client has connected

    |Bytes|Datatype|Description|
    |-|-|-|
    |0|uint8|Message type ID|
    |1-4|int32|New client ID|

### DISCONNECT

- #### Relay to Server or Relay to Client

    Inform a connection that another client has disconnected

    |Bytes|Datatype|Description|
    |-|-|-|
    |0|uint8|Message type ID|
    |1-4|int32|Dropped client ID|

- #### Server to Relay

    Forcefully disconnect a client

    |Bytes|Datatype|Description|
    |-|-|-|
    |0|uint8|Message type ID|
    |1-4|int32|Dropped client ID|

### CODE

- #### Relay to Server

    Send the server connection code and accept connection

    |Bytes|Datatype|Description|
    |-|-|-|
    |0|uint8|Message type ID|
    |1-n|string|Server code|

### ID

- #### Relay To Server

    Request a new client ID

    |Bytes|Datatype|Description|
    |-|-|-|
    |0|uint8|Message type ID|

- #### Server To Relay

    Provide a new client ID

    |Bytes|Datatype|Description|
    |-|-|-|
    |0|uint8|Message type ID|
    |1-4|int32|New client ID|
