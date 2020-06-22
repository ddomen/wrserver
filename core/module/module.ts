import { Controller, ControllerType } from '../controller';
import { Connection, IConnectionIncomingParsed, IConnectionOutcome, Emitter, Interceptor, InterceptorCollection, Console } from '../component';
import { Service, ServiceType } from '../service';
import { ModelBase, ModelType } from '../models';
import { Event } from '../events';

/** Type of Module */
export type ModuleType = typeof Module;

/** Module package for server service and models injection */
export abstract class Module {
    protected controllers: ControllerType[] = [];
    protected models: ModelType[] = [];
    
    public services: ServiceType[] = [];
    public dependencies: ModuleType[] = [];
    public interceptors: Interceptor[] = [];
    public codes: string[] = [];

    private _services: { [name: string]: Service };
    private _models: { [name: string]: typeof ModelBase };
    private _interceptors: InterceptorCollection<ControllerType>;

    constructor(protected events: Emitter, protected console: Console){ }

    /** Inject service and calculate models and interceptors to use in this module */
    public inject(services: Service[]){
        this._services = {};
        this.services.forEach(s => { let serv = services.find(u => u.constructor == s); this._services[s.name] = serv; });
        this._models = {};
        this.models.forEach(m => { this._models[m.name] = m; });
        this._interceptors = new InterceptorCollection<ControllerType>(this.interceptors).get<ControllerType>(Interceptor.Controller)
        return this;
    }

    /** Digest a parsed message, finding the correct Controller */
    public digest(connection: Connection, message: IConnectionIncomingParsed): IConnectionOutcome {
        let cnt = this.controllers.find(c => c.section == message.section);
        if(cnt){
            return this._interceptors.intercept(cnt, [ connection, message, this ],
                { type: 'function', callback: (int: Function) => int.call(this) },
                { type: 'false', callback: null },
                { type: 'any', callback: () => this.makeController(connection, message, cnt) }
            ) || null;
        }
        return null;
    }

    protected makeController(connection: Connection, message: IConnectionIncomingParsed, cnt: ControllerType): IConnectionOutcome{
        if(cnt){
            let cm: Controller = new (cnt as any)(connection, this.events, this.console, this._services, this._models, this._interceptors.get<Interceptor.Controller>(Interceptor.Controller));
            this.events.emit<Event.Module.Digest.Type>(Event.Module.Digest.Name, cm);
            return cm.digest(message);
        }
        return null
    }
}