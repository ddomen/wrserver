import { Event } from '../events';

/** Callback that convert an EventModel<EventType> to Result for the Emitter events */
export type EmitterCallback<EventType extends Event = Event.Any.Type, Result = void> = (event: EventModel<EventType>) => Result;

/** Response type for a rised event (response for on, once, etc.) */
export type EventResponse<EventType extends Event = Event.Any.Type, Result = void> = EventModel<EventType> | EmitterCallback<EventType, Result>;

/** Crossed response for rised request (response for response method by request method) */
export type CrossedEventResponse<EventType extends Event = Event.Any.Type, Result = void> = EventModel<Result> | EmitterCallback<EventType, Result>;

/** Request for a event response (request for request method) */
export type EventRequest<EventType extends Event = Event.Any.Type> = EventType | EventModel<EventType>;

export class Emitter {
    private handlers: { [key: string]: HandlerModel<any>[] } = {};
    private responders: { [key: string]: ResponderModel<any, any> } = {};
    private composers: ComposerModel<any>[] = [];
    private fired: EventModel<any>[] = [];

    constructor(){
        if(Emitter.Instance){ return Emitter.Instance; }
        else{ Emitter.Instance = this; }
    }

    private get htypes(): string[]{ return Object.keys(this.handlers); }

    /** Emit an event */
    public emit<EventType extends Event = Event.Any.Type>(type: string, data: EventType = null, name: string = null, like: boolean = true): this{
        let event = new EventModel(type, name, data);
        this.fired.push(event);
        if(this.handlers[type]){
            let hs = this.handlers[type];
            if(name != null){ hs = hs.filter(h => h.name == name); }
            hs.forEach(h => h.call(event));
            this.handlers[type] = this.handlers[type].filter(h => !h.elasped);
        }
        if(like){
            let htypes = this.htypes.filter(t => !!t.match(type) && t != type);
            htypes.forEach(ht => {
                let hs = this.handlers[ht];
                hs = hs.filter(h => h.like);
                if(name != null){ hs = hs.filter(h => h.name == name); }
                hs.forEach(h => h.call(event));
                this.handlers[ht] = this.handlers[ht].filter(h => !h.elasped);
            })
        }
        return this;
    }

    /** Emit an event only if is not already emitted */
    public fire<EventType extends Event = Event.Any.Type>(type: string, data: EventType = null, name: string = null, like: boolean = true): this{
        if(!this.fired.find(ev => ev.type == type && (!name || ev.name == name))){ this.emit<EventType>(type, data, name, like); }
        else if(like){
            let htypes = this.htypes.filter(t => !!t.match(type));
            htypes.forEach(ht => { if(!this.fired.find(ev => ev.type == ht && (!name || ev.name == name))){ this.emit<EventType>(type, data, name, like); } })
        }
        return this;
    }

    /** Execute the callback every time receives a type event */
    public on<EventType extends Event = Event.Any.Type>(type: string, callback: EmitterCallback<EventType>, name: string = null, times?: number, like: boolean = false): this{
        if(!this.handlers[type]){ this.handlers[type] = []; }
        this.handlers[type].push((new HandlerModel<EventType>(name, callback, times, like)) as HandlerModel<Event.Any.Type>);
        return this;
    }

    /** Remove handlers for type events */
    public off(type: string, name: string = null): this{
        if(this.handlers[type]){ this.handlers[type] = this.handlers[type].filter(h => h.name != name); }
        return this;
    }

    /** Execute the callback the first time receives a type event.
     * 
        If the event is already emitted execute the callback for the first emitted type event */
    public once<EventType extends Event = Event.Any.Type>(type: string, callback: EmitterCallback<EventType>, name: string = null): this{
        if(!this.handlers[type]){ this.handlers[type] = []; }
        let hs = new HandlerModel(name, callback, 1),
            ev = this.fired.filter(e => e.type == type && (!name || e.name == name))[0];
        if(ev){ hs.call(ev as EventModel<EventType>); }
        else{ this.handlers[type].push(hs); }
        return this;
    }

    /** Execute the callback the first time receives a type[] event.
     * 
        If the event is already emitted execute the callback for the first emitted type[] event */
    public onces<EventType extends Event = Event.Any.Type>(types: string[], callback: EmitterCallback<EventType>, name: string = null): this{
        if(Array.isArray(types) && types.length){
            types.length == 1 ?  this.once<EventType>(types.shift(), callback, name) : this.once<EventType>(types.shift(), ()=>{ this.onces<EventType>(types, callback, name); }, name);
        }
        return this
    }

    /** Execute the callback every time receives a type[] event */
    public ons<EventType extends Event = Event.Any.Type>(types: string[], callback: EmitterCallback<EventType>, name: string = null, times?: number): this{
        types.forEach(t => { this.on<EventType>(t, callback, name, times) });
        return this;
    }

    /** Execute the callback every time receives a type-like event (event type match callback type) */
    public like<EventType extends Event = Event.Any.Type>(type: string, callback: EmitterCallback<EventType>, name: string = null, times?: number): this{ return this.on<EventType>(type, callback, name, times, true); }

    /** Make a request to retrive the result of a responder type event */
    public request<Result = any, EventType extends Event = Event.Any.Type>(type: string, event: EventRequest<EventType>, name: string = null): Result{
        if(event && typeof type == 'string' && type && this.responders[type]){
            if(!(event instanceof EventModel)){ event = new EventModel(type, name, event); }
            return this.responders[type].respond(event);
        }
        return null;
    }

    /** Respond to an type event with a result */
    public respond<Result = any, EventType extends Event = Event.Any.Type>(type: string, response: CrossedEventResponse<EventType, Result>, callable: boolean = true, name: string = null, times?: number): this{
        if(!this.responders[type]){ this.responders[type] = new ResponderModel<Result, EventType>(name, response, callable, times); }
        return this;
    }

    /** Make a composed request and add it to the composed handlers.
     
        A comopsed request will trig if there is at least one composer element that is equal to decompose event.

        A function in the composer stack will be evaluate before the comparison if callable parameter is set to true (default: true).

        compose(0) <=> decompose(0)

        compose([0,1,2]) <=> decompose(0) | decompose(1) | decompose(2)

        compose([0,1,(x) => x*2 == 12]) <=> decompose(0) | decompose(1) | decompose(6)
    */
    public compose<EventType = any>(composer: EventType, callback: Function, callable: boolean = true, name: string = null, times?: number): this{
        this.composers.push(new ComposerModel<EventType>(name, composer, callback, times, callable));
        return this;
    }

    /** Execute the callback of a composed request. See compose for more info. */
    public decompose<EventType = any>(composer: EventType, data: any = {}, name: string = null): this{
        let comps = this.composers.filter(c => c.compose(composer));
        if(comps.length){
            let event = new EventModel('ComposerEvent', name, Object.assign({}, data, { composer }));
            comps.forEach(c => c.call(event));
            this.composers = this.composers.filter(c => !!c.elasped);
        }
        return this;
    }

    /** Check if an event has already fired at least once */
    public hasFired(type: string, name: string = null){ return this.fired.filter(ev => ev.type == type && (!name || ev.name == name)).length }

    private static Instance: Emitter;
}

export class EventModel<EventType extends Event = Event.Any.Type> { constructor(public type: string, public name: string = null, public data: EventType = null){} }

class Handler {
    protected count: number = 0;
    constructor(public name: string, public times: number = Infinity){}
    public get elasped(): boolean{ return this.count >= this.times; }
}

export class HandlerModel<EventType extends Event = Event.Any.Type> extends Handler{
    constructor(name: string, public callback: EmitterCallback<EventType>, times: number = Infinity, public like: boolean = false){ super(name, times)}
    public call(event: EventModel<EventType>): this{ if(typeof this.callback == 'function' && !this.elasped){ this.callback.call(null, event); this.count++; } return this; }
}

export class ResponderModel<Result = any, EventType extends Event = Event.Any.Type> extends Handler {
    constructor(name: string, public response: CrossedEventResponse<EventType, Result>, public callable: boolean = true, times: number = Infinity){ super(name, times); }
    public respond(event: EventModel<EventType>): Result{
        if(!this.elasped){
            if(this.callable && typeof this.response == 'function'){ return this.response.call(null, event); }
            else if(typeof this.response != 'function'){ return this.response.data; }
        }
        return null;
    }
}

export class ComposerModel<EventType extends Event = Event.Any.Type> extends Handler {
    constructor(name: string, public composer: EventType, public callback: Function, times: number = Infinity, public callable: boolean = true){ super(name, times); }
    public call(event: EventModel): this{ if(typeof this.callback == 'function' && !this.elasped){ this.callback.call(null, event); this.count++; } return this; }
    protected decompose(target: any, composer: any = this.composer): any{
        switch(typeof composer){
            case 'function': return this.callable ? (composer as any).call(null, target) : composer;
            case 'object':
                if(Array.isArray(composer)){ return composer.map(x => this.decompose(target, x)); }
                return composer;
            default: return composer;
        }
    }

    public compose(target: any, composer: any = this.composer): boolean{
        let decomposed = this.decompose(target, composer);
        if(Array.isArray(decomposed)){ return decomposed.some(d => this.compose(target, d)); }
        switch(typeof target){
            case 'object':
                if(Array.isArray(target)){ return target.some(c => this.compose(c)); }
                else{ return decomposed == target; }
            case 'function': return target.call(null, decomposed) == decomposed;
            default: return decomposed == target;
        }
    }
}