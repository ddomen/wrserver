import { Connection, IConnectionIncomingParsed, IConnectionOutcome, Emitter, InterceptorCollection, Console } from '../component'
import { Service } from "../service";
import { ModelBase, ModelType } from "../models";
import { Event } from '../events';
import { Page } from './pages';

/** Controller interface for default method */
export interface IControllerDefault{ default(message: IConnectionIncomingParsed): IConnectionOutcome }
/** Type of Controller */
export type ControllerType = typeof Controller;

/** Controller Base class [your controllers should extends this class and have 'Controller' at the end of the name]

 * Every method linked to a page should return a 'ConnectionOutcome'
*/
export abstract class Controller {
    constructor(
        protected connection: Connection,
        protected events: Emitter,
        protected console: Console,
        protected services: { [name: string]: Service },
        protected models: { [name: string]: ModelType },
        protected interceptors: InterceptorCollection<string>
    ){}

    /** Digest a parsed message in an readable response */
    public digest(message: IConnectionIncomingParsed): IConnectionOutcome {
        let page: Page = null;
        let pageStr: keyof this | 'default' = message.page.toLowerCase() as keyof this;
        if(typeof this[pageStr] == 'function'){ page = this[pageStr] as any; }
        else if(typeof (this as any).default == 'function'){ pageStr = 'default'; page = (this as any).default; }

        this.events.emit<Event.Controller.Digest.Type>(Event.Controller.Digest.Name, page);
        if(page){
            return this.interceptors.intercept(this.constructor.name.toLowerCase() + '.' + pageStr, [ this.connection, message, this ],
                { type: 'function', callback: (int: Function) => int.call(this, page) },
                { type: 'null', callback: () => this.callPage(page, message) },
                { type: 'false', callback: null },
                { type: 'any', callback: () => this.callPage(page, message) }
            ) || Controller.BadDig;
        }
        return Controller.NotDig;
    }

    protected callPage(page: Page, message: IConnectionIncomingParsed): IConnectionOutcome{
        if(page && page.isPage){ return page.call(this, message); }
        return null;
    }

    /** Return a readable ok response, with class, and data converted to sendable (if method is present) */
    protected ok(cls: string, data: any, sendableArgs?: any[]): IConnectionOutcome {
        let sendable = typeof data.sendable == 'function' ? data.sendable(...(sendableArgs || [])): data;
        return { class: cls, data: sendable };
    }
    /** Return a readable bad response, reporting message with specific code */
    protected bad(code?: string, message?: string): IConnectionOutcome{ return (code && message ? { code, message, bad: true } : code) || Controller.BadDig; }

    /** Retrive a model by its name. Usefull to convert model in desired model type */
    protected model<T = typeof ModelBase>(name: string | typeof ModelBase): T{ return (this.models[(name as any).name || name] as any) as T; }
    /** Retrive a service by its name. Usefull to convert service in desired model type */
    protected service<T extends Service = Service>(name: string | typeof Service) : T{ return this.services[(name as any).name || name] as T; }

    public static section: string;
    /** Impossible to digest (missing page - linked method) Symbol */
    public static NotDig: Symbol = Symbol('NOTDIG');
    /** Bad digestion (wrong response of page - linked method) Symbol */
    public static BadDig: Symbol = Symbol('BADDIG');
}