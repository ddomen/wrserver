# WRServer/Data
[![License](https://img.shields.io/badge/License-MIT-1a237e.svg)](./LICENSE)
[![Email](https://img.shields.io/badge/Contact-email-00897b.svg)](mailto:daniele.domenichelli.5+ddomen@gmail.com)
[![Donate](https://img.shields.io/badge/Donate-PayPal-4caf50.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=6QCNG6UMSRCPC&lc=GB&item_name=ddomen&item_number=aoop&no_note=0&cn=Add%20a%20message%3a&no_shipping=2&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)
[![Donate](https://img.shields.io/badge/Donate-bitcoin-4caf50.svg)](https://blockchain.info/payment_request?address=1FTkcYbdwsHEbJBS3c1xD62KKCKskT14AE&amount_local=5&currency=EUR&nosavecurrency=true&message=ddomen%20software)

[@wrserver](https://github.com/ddomen/wrserver) data module, holding a new concept of Model as a Table, to interface json file as a db-like model.

### Installing
Install this library is easy by cloning the repo.
You can install trhought npm too:

Local installation
```
npm install @wrserver/data
```
Global installation
```
npm install -g @wrserver/data
```
We recomend to use the entire base package (core, crypt, data, auth, mail)

## Data Model
This module add the DataModel to the WRServer Set of elements. The DataModel is usefull to manage files throught the DataService that allow to load/save json (encrypted or not) files.

## Create a custom DataModel
```ts
import { Model, Column, Connection } from '@wrserver/core';
import { DataService, DataModel } from '@wrserver/data';

@Model
export class MyModel extends DataModel {
    //Use @Column.<TYPE>(defaultValue) for define a Db Column
    //Care that the defaultValue is evaluated once.
    //If it is an object reference every model will inherith the same reference.
    @Column.ID()
    public id: number;
    @Column.String()
    public stringType: string;
    @Column.Number(1)
    public numberType: number;
    @Column.Boolean(true)
    public booleanType: boolean;
    @Column.Array(()=>[0,1,2])
    public arrayType: number[];
    @Column.Date(()=>new Date())
    public dateType: Date;
    @Column.Model(MyModel2, () => new MyModel2(... params ...))
    public modelType: MyModel2;

    //NOT MAPPED PARAMETERS
    public otherParam1: boolean;
    public otherParam2: Date;

    public sendable(): any{ return { id: this.id, name: this.name, email: this.email, role: this.role }; }
}
```

## DataService Usage
At Module defition
```ts
import { DataService, DataModule } from '@wrserver/data';

export class MyModule extends Module {
    //... controller, models, etc. ...
    public services: ServiceType[] = [ DataService, ... Other Services ... ];
    public dependencies: ModuleType[] = [ DataModule, ... Other Modules ... ];
    //... rest of code ...
}
```
At Server definition (settings)
```ts
import { WRServer }from '@wrserver/core';
import { DataModule } from '@wrserver/data';

//REMEMBER: don't use this static methods inside module definitions
DataModule.withDir(<directory>).withEncrypt(true|false)
            .withAlgorithm(<algorithm>).withCadence(<seconds autosave>)
            
//Server definition
let server: WRServer = new WRServer(...)
```

## Contacts
If you like the project feel free to contact me on my [![Email](https://img.shields.io/badge/Contact-email-00897b.svg)](mailto:daniele.domenichelli.5+ddomen@gmail.com).

Something gone wrong? Feel free to rise an issue!

Did you like this project and it was usefull? Help me improve my work:

[![Donate](https://img.shields.io/badge/Donate-PayPal-4caf50.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=6QCNG6UMSRCPC&lc=GB&item_name=ddomen&item_number=aoop&no_note=0&cn=Add%20a%20message%3a&no_shipping=2&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)
[![Donate](https://img.shields.io/badge/Donate-bitcoin-4caf50.svg)](https://blockchain.info/payment_request?address=1FTkcYbdwsHEbJBS3c1xD62KKCKskT14AE&amount_local=5&currency=EUR&nosavecurrency=true&message=ddomen%20software)