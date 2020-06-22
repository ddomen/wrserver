import EXPRESS from 'express';
import * as WS from 'websocket';
import * as BODYPARSER from 'body-parser';
import * as HTTP from 'http';
import * as PATH from 'path';

import { Connection, Emitter, Console, IConnectionOutcome, filter, InterceptorCollection } from './component';
import { Service, ServiceType } from './service';
import { Module } from './module';
import { Codes } from './component';
import { ModelBase } from './models';
import { Event } from './events';

/** Abstract Class for type inference */
export abstract class AbstractTypeClass{}
/** Type of a prototyped object */
export type Prototyped = { prototype: object, [key: string]: any };
/** Abstract Class type */
export type Abstract = Function & Prototyped;
/** Type of an object with a constructor method */
export type Constructor<T = any> = { new (...args: any[]): T, [key: string]: any };
/** Abstract Class type built from another type */
export type AbstractOf<T = any> = Abstract & Constructor<T>;
/** Class type */
export type Class<T = any> = Abstract | Constructor<T>;
/** Class type built from another type */
export type ClassOf<T = any> = Class & Constructor<T>;
/** Instanciable Class type */
export type InstanciableClass<T = any> = Constructor & T;
/** An "any" Instance of a specified class */
export type Instance<U = any, T extends U = any> = T;
/** Outcome message for broadcasting (added filter function) */
export type IBroadcastOutcome = IConnectionOutcome & { filter?: filter };

/**
 * WRServer - Websocket Rest Server
 * 
 * directory - base directory of the server
 * 
 * port - serving port
 * 
 * modules - array of Modules used in the server
 * 
 * wsprotocol - string of the choosen protocol for ws accept
 */
export class WRServer {
    protected app: any = EXPRESS();
    protected server: HTTP.Server = HTTP.createServer(this.app);
    protected wsserver: WS.server = new WS.server({ httpServer: this.server, autoAcceptConnections: false });

    protected events: Emitter = new Emitter();
    protected console: Console;
    protected connections: Connection[] = [];
    protected services: Service[] = [];
    protected modules: Module[] = [];
    protected interceptors: InterceptorCollection = new InterceptorCollection();
    protected models: (typeof ModelBase)[] = [];
    protected codes: string[] = Codes;

    constructor(
        protected directory: string,
        protected port: number,
        modules: typeof Module[] = [],
        protected wsprotocol: string = 'wrs_prtc'
    ){
        if(!PATH.isAbsolute(this.directory)){ this.directory = PATH.join(process.cwd(), this.directory);  }

        this.console = new Console('WRS', this.directory);

        let srv: typeof Service[] = [],
            mods: typeof Module[] = modules.slice()
        this.console.node('version', process.version)
        this.console.info('starting WRS at port', port);
        this.initModules(mods, srv)
            .initServices(srv)
            .injectModules()
            .injectServices();
        
        this.events.once<Event.Service.AllReady.Type>(Event.Service.AllReady.Name, () => {
            this.console.service('all services initialized');
            this.start();
        })
        this.events.on<Event.Server.Broadcast.Type>(Event.Server.Broadcast.Name,
            event => { this.broadcast(event.data); });

        this.wsprotocol = this.wsprotocol.toLowerCase();
    }
    
    /** Initialize modules compiled in the server */
    protected initModules(modules: typeof Module[], services: typeof Service[], dependencies: Module = null): this{
        this.console.module('initializing ' + (dependencies ? dependencies.constructor.name + ' dependencies' : 'modules') + ':', modules.map(x => x.name));
        if(modules.length){
            modules.forEach(mod => {
                if(!this.modules.find(m => m.constructor == mod)){
                    let nmod: Module = new (mod as any)(this.events, new Console(mod.name, this.directory));
                    this.modules.push(nmod);
                    services.push(...nmod.services);
                    this.codes.push(...nmod.codes.filter(code => !this.codes.includes(code)));
                    this.initModules(nmod.dependencies, services, nmod);
                    this.interceptors.push(...nmod.interceptors);
                }
            })
        }
        else{ this.events.fire<Event.Service.AllReady.Type>(Event.Service.AllReady.Name); }
        return this;
    }

    /** Initialize services used by all the server applications (server, modules, controllers) */
    protected initServices(services: ServiceType[]): this{
        let uniqueServices: ({ service: Service, type: ServiceType })[] = 
                services.filter((v, i, a) => a.indexOf(v) == i).map(service => ({ service: null, type: service }));
        this.console.service('initializing services:', uniqueServices.map(x => x.type.name));
        uniqueServices.forEach(x => {
            this.events.once<Event.Service.Ready.Type>(Event.Service.Ready.Name, ()=>{
                this.console.service('service', x.type.name, 'ready')
                
                uniqueServices
                    .filter(y => y.service && y.service.dependencies && y.service.dependencies.includes(x.type))
                    .filter(y => y.service.dependencies.every(z => { let type = uniqueServices.find(u => u.type == z); return type && !!type.service}))
                    .forEach(y => y.service.init(...y.service.dependencies.map(d => uniqueServices.find(u => u.type == d).service)));

                if(!uniqueServices.some(x => !x.service)){ this.events.fire<Event.Service.AllReady.Type>(Event.Service.AllReady.Name); }
            }, x.type.name);
            x.service = new (x.type as any)(this.directory, this.events, new Console(x.type.name, this.directory));
            this.services.push(x.service);
            this.interceptors.inject(x.service);
            if(!x.service.dependencies.length){ x.service.init(); }
        })
        return this;
    }

    /** Inject services in all the used modules */    
    protected injectModules(): this{
        this.modules.forEach(mod => {
            mod.inject(this.services)
            this.console.module('module', mod.constructor.name, 'initialized');
        });
        return this;
    }

    /** Inject Interceptors to services */
    protected injectServices(): this{
        this.services.forEach(srv => {
            srv.inject(this.interceptors)
            this.console.service('service', srv.constructor.name, 'injected');
        })
        return this;
    }
    
    /** Initialize the Http Express Server for accepting WS protocol and rejecting all methods (get excluded) */
    protected initHttp(): this{
        let staticPath = PATH.join(this.directory, WRServer.root);
        this.console.info('serving client from', PATH.resolve(staticPath))
        this.app.use(EXPRESS.static(staticPath));
        this.app.use(BODYPARSER.json());
        this.app.use((err: Error, req: EXPRESS.Request, res: EXPRESS.Response, next: EXPRESS.NextFunction) => { this.error(err, req.url, res); });

        this.app.get('*', (req: EXPRESS.Request, res: EXPRESS.Response) => { this.get(req, res); });
        this.app.post('*', (req: EXPRESS.Request, res: EXPRESS.Response) => { this.badMethod(req, res); });
        this.app.delete('*', (req: EXPRESS.Request, res: EXPRESS.Response) => { this.badMethod(req, res); });
        this.app.purge('*', (req: EXPRESS.Request, res: EXPRESS.Response) => { this.badMethod(req, res); });
        this.app.put('*', (req: EXPRESS.Request, res: EXPRESS.Response) => { this.badMethod(req, res); });
        this.app.options('*', (req: EXPRESS.Request, res: EXPRESS.Response) => { this.badMethod(req, res); });
        this.app.options('*', (req: EXPRESS.Request, res: EXPRESS.Response) => { this.badMethod(req, res); });

        return this;
    }

    /** Initialize websocket for accepting ws protocol request */
    protected initWS(): this{
        this.wsserver.on('request', req => { this.wsrequest(req); });
        return this;
    }

    /** Start server listening */
    protected initServer(): this{
        this.server.listen(this.port, () => {
            this.console.info('server started');
            this.events.emit<Event.Server.Ready.Type>(Event.Server.Ready.Name, null);
        });
        return this;
    }

    /** Send Server Internal Error to Http Response */
    protected error(error: Error, url: string, res: EXPRESS.Response): this{
        this.console.error('Error on path %s\n%s\n', url, error.stack);
        this.events.emit<Event.Server.Error.Type>(Event.Server.Error.Name, error);
        res.status(500).send((process.env.NODE_ENV == 'production') ? 'Internal Server Error' : error.stack.replace(/(?:\r\n|\r|\n)/g, '<br />'));
        return this;
    }

    /** Get method callback (allowed for ws handshake) */
    protected get(req: EXPRESS.Request, res: EXPRESS.Response): this{
        this.console.connection('http connection accepted from', req.headers['x-forwarded-for'] || req.connection.remoteAddress)
        this.events.emit<Event.Server.Url.Type>(Event.Server.Url.Name, req);
        res.sendFile(PATH.resolve(PATH.join(this.directory, WRServer.root, 'index.html')));
        return this;
    }

    /** Send Bad Method to Http Response */
    protected badMethod(req: EXPRESS.Request, res: EXPRESS.Response): this{
        this.events.emit<Event.Server.BadMethod.Type>(Event.Server.BadMethod.Name, req);
        Connection.HttpBad(res, 405, 'bad method', this.codes);
        return this;
    }

    /** Elaborate websoket request */
    protected wsrequest(req: WS.request): this{
        if(!this.protocolAllowed(req.requestedProtocols) || !this.originIsAllowed(req.origin)) {
            req.reject(); let ip = '???';
            try{ ip = (req as any).connection.remoteAddress; } catch(e){}
            this.console.connection('ws connection rejected from', ip);
            this.events.emit<Event.Websocket.Reject.Type>(Event.Websocket.Reject.Name, req);
        }
        else{
            try{
                let conn = new Connection(req.accept(this.wsprotocol, req.origin), this.events, this.codes, this.modules, this.interceptors)
                this.connections.push(conn);
                this.events.emit<Event.Websocket.Accept.Type>(Event.Websocket.Accept.Name, conn);
            }
            catch(e){ this.console.error(e); try{ req.reject(); } catch(e){ this.console.error(e); } }
        }
        return this;
    }
    /** Origin Allow callback for ws requests */
    protected originIsAllowed(origin: string): boolean{ return true; }
    /** Protocol Allow callback for ws requests */
    protected protocolAllowed(protocols: string[]): boolean{ return Array.isArray(protocols) && protocols.length && protocols.includes(this.wsprotocol); }

    /** Send a structured ok message to all the filtered connections */
    public broadcast(message: IConnectionOutcome, filter?: filter): this{
        let connections = this.connections;
        if(typeof filter == 'function'){ connections = connections.filter(filter); }
        connections.forEach(connection => { connection.send(message); })
        return this;
    }

    /** Close sockets for an initialized server */
    public close(cb?: Function){ this.wsserver.shutDown(); this.server.close(cb); return this; }

    /** Start sockets for an initialized server */
    public start(){ return this.initHttp().initWS().initServer(); }

    /** Restart sockets for an initialized server */
    public restart(cb?: Function){ return this.close(()=>{ this.start(); if(typeof cb == 'function'){ cb.call(this); } }); }

    /** Set dinamically reload of server modules */
    public static debug(): typeof WRServer{ this.debugMode = true; return this; }
    /** Enstabilish the static root for the server */
    public static withRoot(directory: string): typeof WRServer{ this.root = directory; return this; }
    /** Switch automatical server startup */
    public static withStartup(automatic: boolean): typeof WRServer{ this.startup = automatic; return this; }
    /** Root for static http responses */
    protected static root: string = 'client';
    /** Debug flag for dinamical reload of the server modules */
    protected static debugMode: boolean = false;
    /** Automatic server startup */
    protected static startup: boolean = true;
}
