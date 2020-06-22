import * as PATH from 'path';
import { Emitter, InterceptorCollection, Interceptor, Console } from "../component";
import { Event } from "../events";

/** Type of Service */
export type ServiceType = typeof Service;

/** Service Base class [your services should extend this class and have 'Service' at the end of the name] */
export abstract class Service {
    public dependencies: ServiceType[] = [];
    public interceptors: Interceptor[] = [];
    protected interceptorCollection: InterceptorCollection;

    constructor(protected directory: string, protected events: Emitter, protected console: Console){
        let serv: ServiceType = this.constructor as ServiceType;
        this.directory = PATH.isAbsolute(serv.directory) ? serv.directory : PATH.join(this.directory, serv.directory || '');
    }

    /** Inject interceptors to the Service */
    public inject(interceptors: InterceptorCollection): this{
        let ints = this.interceptors.filter(int => interceptors.check(int.type))
        this.interceptorCollection = new InterceptorCollection(ints);
        return this;
    }

    /** Initilize the server, just after dependencies resolved.
     * 
     * The dependencies are passed to this method by the order defined in the dependencies array of the service
     * 
     * For example ```dependencies = [ ServiceType1, ServiceType2 ]``` will trigger ```init(ServiceInstance1, ServiceInstance2)``` */
    public init(...dep: Service[]): this{ return this; }

    /** Fire the ready event for initialize the server */
    protected ready(): this{
        this.console.service('service ' + this.constructor.name + ' ready');
        this.events.fire<Event.Service.Ready.Type>(Event.Service.Ready.Name, this, this.constructor.name);
        return this;
    }

    protected static directory: string = '';
}