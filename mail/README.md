# WRServer/Mail
[![License](https://img.shields.io/badge/License-MIT-1a237e.svg)](./LICENSE)
[![Email](https://img.shields.io/badge/Contact-email-00897b.svg)](mailto:daniele.domenichelli.5+ddomen@gmail.com)
[![Donate](https://img.shields.io/badge/Donate-PayPal-4caf50.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=6QCNG6UMSRCPC&lc=GB&item_name=ddomen&item_number=aoop&no_note=0&cn=Add%20a%20message%3a&no_shipping=2&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)
[![Donate](https://img.shields.io/badge/Donate-bitcoin-4caf50.svg)](https://blockchain.info/payment_request?address=1FTkcYbdwsHEbJBS3c1xD62KKCKskT14AE&amount_local=5&currency=EUR&nosavecurrency=true&message=ddomen%20software)

[@wrserver](https://github.com/ddomen/wrserver) mail module to send email to users.

### Installing
Install this library is easy by cloning the repo.
You can install trhought npm too:

Local installation
```
npm install @wrserver/mail
```
Global installation
```
npm install -g @wrserver/mail
```
We recomend to use the entire base package (core, crypt, data, auth, mail)

## Mail Service
This module add the MailService to the WRServer Set of elements. It provides a configuration to send email with nodemail library.

## Include MailService
At Module defition
```ts
import { MailService, MailModule } from '@wrserver/mail';

export class MyModule extends Module {
    //... controller, models, etc. ...
    public services: ServiceType[] = [ MailService, ... Other Services ... ];
    public dependencies: ModuleType[] = [ MailModule, ... Other Modules ... ];
    //... rest of code ...
}
```
## MailService Configuration
At Server definition (settings)
```ts
import { WRServer }from '@wrserver/core';
import { MailModule } from '@wrserver/data';

//REMEMBER: don't use this static methods inside module definitions
DataModule.withService(<service: email@gmail.com>).withUser(<username>).withPass(<password>)

//Server definition
let server: WRServer = new WRServer(...)
```

## Contacts
If you like the project feel free to contact me on my [![Email](https://img.shields.io/badge/Contact-email-00897b.svg)](mailto:daniele.domenichelli.5+ddomen@gmail.com).

Something gone wrong? Feel free to rise an issue!

Did you like this project and it was usefull? Help me improve my work:

[![Donate](https://img.shields.io/badge/Donate-PayPal-4caf50.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=6QCNG6UMSRCPC&lc=GB&item_name=ddomen&item_number=aoop&no_note=0&cn=Add%20a%20message%3a&no_shipping=2&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)
[![Donate](https://img.shields.io/badge/Donate-bitcoin-4caf50.svg)](https://blockchain.info/payment_request?address=1FTkcYbdwsHEbJBS3c1xD62KKCKskT14AE&amount_local=5&currency=EUR&nosavecurrency=true&message=ddomen%20software)