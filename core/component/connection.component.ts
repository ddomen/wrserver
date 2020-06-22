import * as FS from 'fs';
import * as WS from 'websocket';
import { Emitter } from './emitter.component';
import { Codes } from './code.component';
import { Module } from '../module';
import { Controller } from '../controller';
import { Event } from '../events';
import { InterceptorCollection } from './interceptor.component';

/** Incoming not parsed message (raw utf8 - buffered) */
export interface IConnectionIncomingMessage { type: 'utf8' | 'binary', utf8Data: string }
/** Incoming parsed message */
export interface IConnectionIncomingParsed<T = any> { target: string, section: string, page: string, option: string, id: number, data: T }
/** Outcoming structured ok message */
export type IConnectionIncomingParsedNull = IConnectionIncomingParsed<null>;
/** Incoming parsed null data message */
export interface IConnectionOutcomeMessage{ class: string, data: any, id?: number }
/** Outcoming structured bad message */
export interface IConnectionOutcomeBadMessage { code: string, message: string, bad: boolean }
/** Outcoming helper for Controller returns */
export type IConnectionOutcome = ConnectionResponse | IConnectionOutcomeMessage | IConnectionOutcomeBadMessage | Symbol | string ;
/** Filter function for connection broadcast */
export type filter = (connection: Connection, index: number, array: Connection[]) => boolean

/** A Connection wrapper for ws.connection */
export class Connection{
    protected data: any = { wsid: 0 };

    constructor(
        protected socket: WS.connection,
        protected events: Emitter,
        protected codes: string[],
        protected modules: Module[],
        protected interceptors: InterceptorCollection
    ){ this.init(); }

    /** Retrive current ws.message id */
    public get wsid(): number{ return this.get('wsid', 0); }

    /** Try to retrive ip of ws.connection */
    public get ip(){ return this.socket.remoteAddress; }

    /** Initialize callbacks for the socket */
    protected init(): this{
        this.onRise();
        this.socket.on('error', (err: Error) => this.onError(err));
        this.socket.on('close', (code: number, reason: string) => this.onClose(code, reason));
        this.socket.on('message', (message: WS.IMessage) => this.onMessage(message as IConnectionIncomingMessage));

        return this;
    }

    /** Event of initializing */
    protected onRise(): this{
        this.events.emit<Event.Connection.Rise.Type>(Event.Connection.Rise.Name, this)
        this.interceptors.intercept(Event.Connection.Rise.Name, [],
            { type: 'string', callback: (int: string) => { this.bad('', int); } },
            { type: 'any', callback: () => { this.ok('codes', this.codes, -1); } }
        )
        return this;
    }

    /** Event of dropping connection (fired when closed in any way - accidentally or not) */
    protected onDrop(): this{
        this.events.emit<Event.Connection.Drop.Type>(Event.Connection.Drop.Name, this);
        this.interceptors.intercept(Event.Connection.Drop.Name, []);
        return this;
    }

    /** Event of closing connection (fired when not accidentally closed) */
    protected onClose(code: number, reason: string): this{
        this.events.emit<Event.Connection.Close.Type>(Event.Connection.Close.Name, this);
        this.interceptors.intercept(Event.Connection.Close.Name, []);
        this.onDrop();
        return this;
    }

    /** Event of error in connection */
    protected onError(error: Error): this{
        this.events.emit<Event.Connection.Error.Type>(Event.Connection.Error.Name, error);
        this.interceptors.intercept(Event.Connection.Error.Name, []);
        this.onDrop();
        return this;
    }

    /** Event when pinging the socket (ping - pong messages) */
    protected onPing(): this{
        this.events.emit<Event.Connection.Ping.Type>(Event.Connection.Ping.Name, this);
        this.set('lastPing', new Date());
        this.interceptors.intercept(Event.Connection.Ping.Name, []);
        return this.pong();
    }

    /** Event fired when reciving message (still not parsed) */
    protected onMessage(message: IConnectionIncomingMessage): this{
        this.events.emit<Event.Connection.Message.Type>(Event.Connection.Message.Name, message);
        this.set('lastMessage', new Date());
        this.interceptors.intercept(Event.Connection.Message.Name, []);
        if(message.type == 'utf8'){
            if(message.utf8Data == 'ping'){ this.onPing() }
            else{
                let msgdata: IConnectionIncomingParsed;
                try{ msgdata = JSON.parse(message.utf8Data);  }
                catch(e){ this.bad('bad format'); }
                try{ this.onParsed(msgdata); }
                catch(e){ this.bad('server error', e.stack.split('\n'))  }
            }
        }
        else if(message.type === 'binary'){ this.bad('bad format'); }
        return this;
    }

    /** Event fired when receiving a parsed message */
    protected onParsed(message: IConnectionIncomingParsed): this{
        this.events.emit<Event.Connection.ParsedMessage.Type>(Event.Connection.ParsedMessage.Name, message);
        this.interceptors.intercept(Event.Connection.ParsedMessage.Name, []);
        if(message.id){ this.set('wsid', message.id); }
        if(!message.target){ return this.bad('bad target'); }
        let mod = this.modules.find(m => m.constructor.name.toLowerCase() == message.target.toLowerCase()+'module');
        if(mod){
            this.events.emit<Event.Connection.Digest.Type>(Event.Connection.Digest.Name, mod);
            this.interceptors.intercept(mod.constructor, [ message ],
                { type: 'function', callback: (int: Function) => int.call(this) },
                { type: 'false', callback: () => null },
                { type: 'any', callback: () => this.digest(mod, message) }
            );
        }
        else{ return this.bad('bad target'); }
    }

    protected digest(mod: Module, message: IConnectionIncomingParsed): this{
        let digest = mod.digest(this, message);
        if(!digest){ return this.bad('bad section'); }
        else if(digest == Controller.NotDig){ return this.bad('bad page'); }
        else if(digest == Controller.BadDig){ return this.bad('bad request'); }
        else if(typeof digest == 'string'){ return this.bad(digest); }
        else if(typeof digest == 'object' && (digest as IConnectionOutcomeBadMessage).bad){
            let response = digest as IConnectionOutcomeBadMessage; return this.bad(response.code, response.message);
        }
        else{ let response = digest as IConnectionOutcomeMessage; return this.ok(response.class, response.data, response.id); }
    }

    /** Get a connection custom data */
    public get<T = any>(name: string, def?: T): T{ if(!this.data){ this.data = {}; } return this.data[name] == undefined ? def : this.data[name]; }
    /** Set a connection custom data (default overwrite? = true) */
    public set<T = any>(name: string, value: T, overwrite: boolean = true): this{
        if(!this.data){ this.data = {}; }
        if(overwrite || this.data[name] == undefined){ this.data[name] = value; }
        return this;
    }

    /** Send simple message (not structured) to the socket */
    public send(message:  IConnectionOutcome, json: boolean = true, binary: boolean = false) : this{
        this.events.emit<Event.Connection.Send.Type>(Event.Connection.Send.Name, message);
        (this.socket[binary ? 'sendBytes' : 'sendUTF'] as any)(json ? JSON.stringify(message) : message);
        return this;
    }

    /** Make a pong response to ping request */
    public pong(): this{
        this.events.emit<Event.Connection.Pong.Type>(Event.Connection.Pong.Name, this);
        return this.send('pong', false, false);
    }

    /** Send a bad (structured) response to the socket by numeric code [pref use 'bad' method] */
    public badResponse(code: number = 1, message: any = '', id: number = this.wsid): this{ return this.send(new ConnectionResponse(id, code, message, this.codes)); }
    /** Send a bad (structured) response to the socket by string codev */
    public bad(code: string = 'unknown', message: any = '', id: number = this.wsid): this{ return this.badResponse(this.getCode(code), message, id); }

    /** Send an ok (structured) response to the socket [pref use 'ok' method] */
    public okResponse(cls: string, data: any, id: number = this.wsid): this { return this.send(new ConnectionResponse(id, this.getCode('success'), { class: cls, data }, this.codes)); }
    /** Send an ok (structured) response to the socket with autogenerated codes */
    public ok(cls: string, data: any, id: number = this.wsid): this { return this.okResponse(cls, cls == 'code' ? this.getCode(data) : data, id); }

    /** Send an ok (structured) repsponse to all connections (filtered by filter param callback) */
    public broadcast(cls: string, data: any, filter?: filter): this{
        this.events.emit<Event.Server.Broadcast.Type>(Event.Server.Broadcast.Name, { class: cls, data, filter});
        return this;
    }

    /** Send a file trought the socket [experimental] */
    public file(cls: string, path: string, id: number = this.wsid, json: boolean = true): this{
        try{ let f = FS.readFileSync(path).toString(); return this.ok(cls, json ? JSON.parse(f) : f, id); }
        catch(e){ return this.bad('not found', id); }
    }

    /** Get the string code from numeric and vice-versa */
    public getCode(code: string | number = 'unknows'): number{ return Connection.getCode(this.codes, code); }

    /** Get the string code from numeric and vice-versa */
    static getCode(codes: string[], code: string | number = 'unknown'): number{
        if(typeof code == 'string'){ return codes.findIndex(c => c == code.toUpperCase().replace(/ /g,'_')); }
        else if(typeof code == 'number' && Codes[code]){ return code; }
        return this.getCode(codes);
    }

    /** Send HttpBad Response from an Express Http Response */
    public static HttpBad(res: any, status: number, code: string | number, codes: string[]){ return res.status(status).send(new ConnectionResponse(0, Connection.getCode(codes, code), '', codes)); }

    /** Send HttpOk Response from an Express Http Response */
    static HttpOk(res: any, cls: string, data: any, codes: string[]){ return res.send(new ConnectionResponse(0, Connection.getCode(codes, 'success'), { class: cls, data }, codes)); }

    /** Send HttpFile Response from an Express Http Response */
    static HttpFile(res: any, cls: string, path: string, codes: string[]){
        if(FS.existsSync(path)){
            try{
                let f = FS.readFileSync(path).toString();
                res.send(new ConnectionResponse(0, Connection.getCode(codes, 'success'), { class: cls, data: JSON.parse(f) }, codes));
            }
            catch(e){ Connection.HttpBad(res, 404, 'not found', codes); }
        }
        else{ Connection.HttpBad(res, 404, 'not found', codes); }
    }
}

/** Structured response for WebSocket Rest Server */
export class ConnectionResponse {
    public ok: boolean = false;
    public statusCode: string;

	constructor(public id: number = 0, public code: number = 0, public message: any = '', codes: string[]){
        this.id = id;
		this.ok = code == 0;
        this.code = code;
        this.statusCode = codes[code];
        this.message = message;
        Object.seal(this);
	}

	public set(index: 'code'|'message', value: any = null): this{
        if(index == 'code'){ this.code = value; this.ok = value == 0; }
        else if(index == 'message'){ this.message = value; }
		return this;
	}
}