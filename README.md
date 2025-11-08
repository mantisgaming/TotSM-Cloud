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

## Websocket Messages
|Name|Type ID|Description|
|-|-|-|
|[UNDEFINED](#undefined)|-1|No functionality|
|[DEBUG](#debug)|0|Send a debug message|
|[ERROR](#error)|1|Send an error message|
|[DATA](#data)|2|Send a Godot data packet|
|[CONNECT](#connect)|3|Signal that a client has connected|
|[DISCONNECT](#disconnect)|4|Request or signal a client disconnect|
|[SERVER_CODE](#server_code)|5|Request or send the server code|
|[ASSIGN_ID](#assign_id)|6|Request or send a new client ID|

### UNDEFINED

### DEBUG

### ERROR

### DATA

### CONNECT

### DISCONNECT

### SERVER_CODE

### ASSIGN_ID