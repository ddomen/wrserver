import { Constructor } from '../wrserver';

export type ModelBaseExtender<T extends ModelBase> = T;
export type ModelType<T = any> = Constructor<ModelBaseExtender<ModelBase>> & T;

/** Format to build up a Model described by its columns descriptors [See @Column] */
export class ModelFormat{
    public array: ModelFormat;
    constructor(
        public name: string,
        public type: any,
        public preset: any,
        array?: any
    ){ this.array = ModelFormat.from(array); }

    /** Evaluate initial value from Format descriptor */
    public eval(value: any): any{
        let def = typeof this.preset == 'function' ? this.preset.call() : this.preset;
        switch(this.type){
            case Number: case String: case Boolean:
                return this.type(value || def);
            case Array:
                return this.array ?
                        Array.from(value || def || []).map(v => this.array.eval(v)) :
                        Array.from(value || def || []);
            default:
                return new this.type(value || def);
        }
    }

    /** Convert an object to a ModelFormat */
    public static from(format: any): ModelFormat{
        if(!format){ return null; }
        else if(ModelFormat.is(format)){ return format; }
        else if(Array.isArray(format)){
            return format.length >= 3 ?
                    new ModelFormat(format[0], format[1], format[2], format[3]) :
                    null;
        }
        else{ return new ModelFormat(format.name, format.type, format.preset, format.array); }
    }

    public static is(value: any): boolean{ return value instanceof ModelFormat}
}

/** Model Base class [your models should extends this class and have 'Model' at the end of the name] */
export abstract class ModelBase {
    constructor(data: any = {}){
        ModelBase.addModel(new.target as any);
        this.parse(data);
    }

    /** Return current constructor */
    protected get class(): any{ return this.constructor; }

    /** Convert the model to a Json writable to and readable from a file */
    protected toJSON() : any{
        let columns = this.class.Columns;
        if(columns){
            let res: any = {};
            for(let c of this.class.Columns){ res[c.name] = this[c.name as keyof this]; }
            return res;
        }
        return this;
    }

    /** Parse an object to the current Model descriptor */
    protected parse(data: any = {}): this{
        if(this.class.Columns){
            for(let c of this.class.Columns){
                if(!c){ continue; }
                else if(typeof c == 'string'){ this[c as keyof this] = data[c]; }
                else if(Array.isArray(c)){ this[c[0] as keyof this] = this.evaluate(data[c[0]], ModelFormat.from([c[1], c[2], c[3]])); }
                else if(ModelFormat.is(c)){ this[c.name as keyof this] = this.evaluate(data[c.name], c); }
                else if(typeof c == 'object'){ this[c.name as keyof this] = this.evaluate(data[c.name], ModelFormat.from(c)); }
            }
        }
        return this;
    }

    /** Evaluate a value from a choosen format [See ModelFormat.eval] */
    protected evaluate(value: any, format: ModelFormat): any{ return format.eval(value); }

    /** Convert the Model to a secure sendable object (ex. in this method you can eliminate passwords before send the Model to client) */
    public sendable(): ModelBase{ return Object.assign({}, this); }

    /** Generic Field Format descriptor (the array? will be evaluated into the current Format)
     * 
     * Care that the default value is evaluated once. If it is an object reference every model will inherith the same reference.
     * Use a function returning a new reference to instantiate new object.
    */
    public static Field(name: string, type: Function, def: any, array?: any): ModelFormat{ return ModelFormat.from([name, type, def, array]); }
    /** Numeric Format shorthand [See ModelBase.Field] */
    public static Number(name: string, def: (()=>number) | number = 0){ return ModelBase.Field(name, Number, def); }
    /** Boolean Format shorthand [See ModelBase.Field] */
    public static Boolean(name: string, def: (()=>boolean) | boolean = false){ return ModelBase.Field(name, Boolean, def); }
    /** String Format shorthand [See ModelBase.Field] */
    public static String(name: string, def: (()=>string) | string = ''){ return ModelBase.Field(name, String, def); }
    /** Array Format shorthand [See ModelBase.Field] */
    public static Array(name: string, array?: any, def: (()=>any[]) | any[] = ()=>[]){ return ModelBase.Field(name, Array, def, array); }
    /** Date Format shorthand [See ModelBase.Field] */
    public static Date(name: string, def: (()=>Date) | Date = ()=>new Date){ return ModelBase.Field(name, Date, def); }
    /** Model Format shorthand, link another Model to the property [See ModelBase.Field] */
    public static Model(model: any, def: (()=>any) | any = () => new model, name: string = ''){ return ModelBase.Field(name, model, def); }
    /** ID Format shorthand, generates a static ID member with automatic increment [See ModelBase.Field] */
    public static ID(Model: Constructor){ let idName = Model.name + 'ID'; Model[idName] = Number(Model[idName])||1; return Model.Number('id', () => Model[idName]++);}

    /** Check if a model can be validated */
    protected static checkValidity(model: ModelBase, ...args: any[]): boolean{ return true; }

    /** Get a Model by its name (exclude model from the name) */
    public static getByName<T extends ModelBase = any>(name: string): T{
        if(!name){ return null; }
        let n = name.toLowerCase();
        return this.MODELS[n] || this.MODELS[n + 'model'] || null;
    }

    /** Add a Model to the static collection */
    public static addModel(model: Constructor){
        if(model && typeof model.name == 'string' && model.name && !this.MODELS[model.name.toLowerCase()]){ this.MODELS[model.name.toLowerCase()] = model; }
        return this;
    }

    protected static ArrayNumber = new ModelFormat(null, Number, 0);
    protected static ArrayBoolean = new ModelFormat(null, Boolean, false);
    protected static ArrayString = new ModelFormat(null, String, '');
    protected static ArrayDate = new ModelFormat(null, Date, () => new Date);

    private static MODELS: { [key: string]: ModelBaseExtender<any> } = {};
}

export function Model(constructor: Constructor){ ModelBase.addModel(constructor); }