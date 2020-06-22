import { ModuleType } from '../module';
import { ControllerType, Controller as ControllerBase } from '../controller';
import { ServiceType, Service } from '../service';
import { IConnectionIncomingParsed, Connection as ConnectionComponent, IConnectionOutcome } from './connection.component';

/** Type of Interceptor */
export type InterceptorType = typeof Interceptor;

/** Valid types for IInterceptCallback.type */
export type InterceptTypes = 'string' | 'number' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function' | 'null' | 'false' | 'true' | 'any';

/** Interface for Interception callbacks */
export interface IInterceptCallback{ type: InterceptTypes, callback: (type: any) => any };

/** Interceptor for intermodule costumization handler */
export abstract class Interceptor<T = any> {
    constructor(public type: T){}

    public dependencies: ServiceType[] = [];
    protected readonly services: { [key: string]: Service };
    protected readonly NEXT: Symbol = Interceptor.NEXT;

    /** Check if the given type has the same type of the Interceptor */
    public check(type: T): boolean{ return this.type == type; }

    /** Inject a service if not present */
    public inject(service: Service){
        if(this.dependencies.includes(service.constructor as ServiceType)){ this.services[service.constructor.name] = service; }
        return this;
    }

    /** Interception callback, must be defined */
    public abstract intercept(type: T, ...args: any[]): null | undefined | Symbol | any;

    /** Collection of Interceptor singleton instances */
    private static Instances: Interceptor<any>[] = [];
    
    /** Return if the given value is an instance of the current Interceptor type */
    public static is(v: any): boolean { return v instanceof this; }
    
    /** Attach the Interceptor to a given type */
    protected static attachTo<T>(type: T): Interceptor<T>{
        let instance = this.Instances.find(i => i.type == type);
        if(instance){ return instance; }
        instance = new (this as any)(type);
        this.Instances.push(instance);
        return instance;
    }

    public static NEXT: Symbol = Symbol('next');
}

/** Collection of common Interceptors */
export namespace Interceptor{
    /** Interceptor for Connection Component */
    export abstract class Connection extends Interceptor<string> {
        constructor(type: string){ super('connection.' + type); }
        /** Attach the Interceptor to a Connection */
        public static attach(type: ModuleType): Module{ return super.attachTo<ModuleType>(type); }
    }
    /** Interceptor for Modules (before module message digestion) */
    export abstract class Module extends Interceptor<ModuleType> {
        public abstract intercept(type: ModuleType, message: IConnectionIncomingParsed): null | undefined | any;
        /** Attach the Interceptor to a Module */
        public static attach(type: ModuleType): Module{ return super.attachTo<ModuleType>(type); }
    }
    /** Interceptor for Controllers (before controller message digestion) */
    export abstract class Controller extends Interceptor<ControllerType> {
        public abstract intercept(type: ControllerType, connection: ConnectionComponent, message: IConnectionIncomingParsed, module: Module): null | IConnectionOutcome | Function | Symbol;
        /** Attach the Interceptor to a Controller */
        public static attach(type: ControllerType): Controller{ return super.attachTo<ControllerType>(type) as Controller; }
    }
    /** Interceptor for Controller Pages (before page message digestion) */
    export abstract class Page extends Interceptor<string> {
        public abstract intercept(type: string, connection: ConnectionComponent, message: IConnectionIncomingParsed, controller: ControllerBase): null | undefined | any;
        /** Attach the Interceptor to a Page (by string name: <controllerName>.<pageName>) */
        public static attach(type: string): Page{ return super.attachTo<string>(type); }
    }
    /** Interceptor for Services (custom service handler) */
    export abstract class Service extends Interceptor<ServiceType> {
        /** Attach the Interceptor to a Service */
        public static attach(type: ServiceType): Service{ return super.attachTo<ServiceType>(type); }
    }
}

/** Simple Array wrapper for Interceptors */
export class InterceptorCollection<T = any> {
    constructor(protected interceptors: Interceptor<T>[] = []){}

    /** Appends a new Interceptor only if the collection doesnt already have it */
    public push(...interceptors: Interceptor<T>[]): this{
        interceptors
            .filter(int => this.interceptors.indexOf(int) < 0)
            .forEach(interceptor => { this.interceptors.push(interceptor); });
        return this;
    }

    /** Return a new InterceptorCollection filtering by instance of the given type */
    public get<R, U extends typeof Interceptor = any>(type: U): InterceptorCollection<R>{
        return new InterceptorCollection<R>(this.interceptors.filter(int => type.is(int)) as any);
    }

    /** Return a new InterceptorCollection filtering by checking the given type */
    public check(type: T): InterceptorCollection<T>{ return new InterceptorCollection<T>(this.interceptors.filter(int => int.check(type))); }

    /** Return the first callable Interception result or null. (NB: any type is always called last) */
    public intercept(type: T, args: any[],  ...callbacks: IInterceptCallback[]): null | undefined | any {
        let int: any = this.callIntercept(type, args),
            resCall: any = Interceptor.NEXT,
            intCall: IInterceptCallback = null,
            called: IInterceptCallback[] = [];
        while(resCall == Interceptor.NEXT){
            intCall = callbacks.find(cb => 
                    !called.includes(cb) && (
                    (cb.type == 'null' && int == null)
                    || cb.type == typeof int
                    || (cb.type == 'false' && !int && int != null)
                    || (cb.type == 'true' && !!int)
                    )
                );
            called.push(intCall);
            if(intCall && typeof intCall.callback == 'function'){
                try{ resCall = intCall.callback.call(null, int); }
                catch(e){ resCall = Interceptor.NEXT; }
            }
            else{ break; }
        }
        if(!intCall){
            intCall = callbacks.find(cb => cb.type == 'any');
            if(intCall){ try{ return intCall.callback.call(null, int); } catch(e){ return null; } }
        }
        return resCall;
    }

    /** Inject a service into every Interceptor */
    public inject(service: Service){ this.interceptors.forEach(int => int.inject(service)); return this; }

    /** Return the first callable Interception result or null. */
    protected callIntercept(type: T, args: any[]){
        let res = this.check(type).interceptors.map(int => int.intercept(type, ...args));
        if(res.includes(null)){ return null; }
        if(res.includes(undefined)){ return undefined; }
        return res.find(x => x != null && x != undefined) || null;
    }
}