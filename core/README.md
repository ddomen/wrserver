# WRServer/Core
[![License](https://img.shields.io/badge/License-MIT-1a237e.svg)](./LICENSE)
[![Email](https://img.shields.io/badge/Contact-email-00897b.svg)](mailto:daniele.domenichelli.5+ddomen@gmail.com)
[![Donate](https://img.shields.io/badge/Donate-PayPal-4caf50.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=6QCNG6UMSRCPC&lc=GB&item_name=ddomen&item_number=aoop&no_note=0&cn=Add%20a%20message%3a&no_shipping=2&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)
[![Donate](https://img.shields.io/badge/Donate-bitcoin-4caf50.svg)](https://blockchain.info/payment_request?address=1FTkcYbdwsHEbJBS3c1xD62KKCKskT14AE&amount_local=5&currency=EUR&nosavecurrency=true&message=ddomen%20software)

[@wrserver](https://github.com/ddomen/wrserver) core module that define the basic concepts of the WRS.

### Installing
Install this library is easy by cloning the repo.
You can install trhought npm too:

Local installation
```
npm install @wrserver/core
```
Global installation
```
npm install -g @wrserver/core
```
We recomend to use the entire base package (core, crypt, data, auth, mail)

## WRServer Concepts
##### Elements
The WRServer is built up on this elements:
* **Module** - is a container usefull to pack everything a part of your server needs
* **Controller** - enstabilish the reachable paths and the sort of responses the server builds
* **Model** - represent the object on the server, that could be sent as response to the clients
* **Service** - an intermodule process that allow internal server comunication
* **Component** - everything the server need to process particular information or run tasks
* **Connection** - the client representation on the server side
* **Message** - the client message representation on the server side

##### Incoming Message Format
```ts
//Incoming Message - from Core > Connection
interface IConnectionIncomingParsed {
    target: string,
    section: string,
    page: string,
    option: string,
    id: number,
    data: any
}
```

##### Outcoming Message Format
```ts
//Outcoming Message - from Core > Connection
interface IConnectionOutcome {
    id?: number,
    bad: boolean
    code: string,
    class: string,
    data: any,
    message: string,
}
```

##### WRServer usual procedures
**Start-up**
The Server instanciate once every module disposed at the creation time and search for needs of every module. Then it instanciate every service once and inject them on modules that needs them. The Server is now ready to communicate.
**Connection**
A Client want to connect to the server, it make handshacke and the connection is approved. When Server and Client are connected the Server send a lookup table of codes to enstabilish the correct communication.
**Message**
Client send a message on the websocket connection. The Server try to parse the message as a *well-formatted* **Message**, if it fails reply with a *bad-formatted* CODE. After the formattation success Server route the **Message** to the instanciated **Module** that match name with the message *target*, check if module can create a **Controller** named as the message *section*. If success it create a **Controller** and try to call the message *page* method with the **Message** as argument to generate a response. If not page found try to check if *default* method is provided else generate a bad response. Anyway if no response is generated the Server provide a bad response as fallback.
**Broadcast**
The Server can send a message to every connection that satisfy a filter clause.

## How To
### Create a custom Module
```ts
import { Module, Controller, Service, ModelBase, ControllerType } from "<core>";

//This are just suggested for typing your controller
export type MyControllerServices = { <ServiceName>: <ServiceType> };
export type MyControllerModels = { <ModelName>: <ModelType> };

export class MyModule extends Module {
    protected controllers: ControllerType[] = [ ... Controllers needed ... ];
    protected models: ModelType[] = [ ... Models needed ... ];
    public services: ServiceType[] = [ ... Services needed ... ];
    public dependencies: ModuleType[] = [ ... Other Modules needed ... ];
    public codes: string[] = [ ... Response Codes needed ... ];
}
```

### Create a custom Controller
```ts
import { Controller, Connection, IConnectionIncomingParsed, IConnectionOutcome } from "<core>";
import { MyControllerServices, MyControllerModels } from "<my.module>";

export class MyController extends Controller {
    protected services: MyControllerServices;
    protected models: MyControllerModels;

    //optional
    constructor(connection: Connection, services: { [name: string]: any }, models: { [name: string]: any }){
        super(connection, services, models);
        //... code ...
    }

    // PAGES
    protected <PageName>(message: IConnectionIncomingParsed): IConnectionOutcome {
        //... code...
        if(BAD){
            return this.bad(<code>);
        }
        if(GOOD){
            return this.ok(<class>, <response>)
        }
    }
    public static section: string = <SectionName>;
}
```

### Create a custom Model
*NOTE:* [@wrserver/data](https://github.com/ddomen/wrserver/tree/master/data) gives a new model representation for db-like usage.
```ts
import { Model, ModelBase } from '<core>';

@Model
export class MyModel extends ModelBase {
   // PROPERTIES

    public sendable(): any{ return <object cleaned for response>; }
}
```

### Create a custom Service
```ts
import { Service, Emitter, Connection } from "<core>";

/** Auth Service for simple manage of User Account with WS Connections */
export class MyService extends Service {
    constructor(eventEmitter: Emitter){
        super(eventEmitter);
        //... code ...
        //REMEBRE to call ready method after the service has started up
        this.ready();
    }
}
```

## Usage
### TS
```ts
import { WRServer } from '@wrserver/core';

let options = {
    path: <path>,
    port: <port>,
    modules: [ ... Modules ... ],
    root: <static root>
}

let wrserver = new WRServer(options.path, options.port, options.modules).withRoot(options.root);
```

###JS
```js
const { WRServer } = require('@wrserver/core');
let options = {
    path: <path>,
    port: <port>,
    modules: [ ... Modules ... ],
    root: <static root>
};

let wrserver = new WRServer(options.path, options.port, options.modules).withRoot(options.root);
```

## Contacts
If you like the project feel free to contact me on my [![Email](https://img.shields.io/badge/Contact-email-00897b.svg)](mailto:daniele.domenichelli.5+ddomen@gmail.com).

Something gone wrong? Feel free to rise an issue!

Did you like this project and it was usefull? Help me improve my work:

[![Donate](https://img.shields.io/badge/Donate-PayPal-4caf50.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=6QCNG6UMSRCPC&lc=GB&item_name=ddomen&item_number=aoop&no_note=0&cn=Add%20a%20message%3a&no_shipping=2&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)
[![Donate](https://img.shields.io/badge/Donate-bitcoin-4caf50.svg)](https://blockchain.info/payment_request?address=1FTkcYbdwsHEbJBS3c1xD62KKCKskT14AE&amount_local=5&currency=EUR&nosavecurrency=true&message=ddomen%20software)