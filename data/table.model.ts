import { Model } from "@wrserver/core";
import { DataModel, where, order, mapAs, DataModelType } from './data.model';
import { DataService } from "./data.service";

/** A Model representing a db-like table */
@Model
export class TableModel<T extends DataModel = DataModel> extends DataModel {
    constructor(service: DataService, protected Model: DataModelType<T>, protected data: T[]){ super(service, data); }

    /** Parse overwrite for simple data retriving */
    protected parse(data: any): this{ this.data = data; return this; }

    public toJSON(): any{
        let n = this.Model.name.toLowerCase().replace('model','');
        return { __model__: n[0].toUpperCase() + n.substr(1), __data__: this.data };
    }

    /** Select an array of entries that satisfy the where callback */
    public get(where?: where<T>, order?: order<T>, mapAs?: mapAs<T>): T[]{
        if(Array.isArray(this.data)){
            let t = this.data;
            if(typeof where == 'function'){ t = t.filter(where); }
            if(typeof order == 'function'){ t = t.sort(order); }
            if(typeof mapAs == 'function'){ t = t.map(mapAs); }
            return t;
        }
        return [];
    }

    /** Select the first element that satisfy the where callback */
    public first(where?: where<T>, order?: order<T>, mapAs?: mapAs<T>): T{ return this.get(where, order, mapAs)[0]; }

    /** Insert a new element to this Table */
    public set(data: T): T{
        if(Array.isArray(this.data)){
            let r;
            if(data instanceof this.Model){ r = data; }
            else{ r = new this.Model(this.service, data); }
            if(this.Model.checkValidity(r, this.data)){
                this.data.push(r);
                return r;
            }
        }
        return null;
    }

    /** Edit all elements that satisfy the where callback */
    public update(data: T, where?: where<T>): boolean{
        if(Array.isArray(this.data)){
            let t = this.data.map((x, i) => ({ data:x, i }));
            if(typeof where == 'function'){ t = t.filter(x => where(x.data, x.i)); }
            t.forEach(x => { this.data[x.i] = this.cloneObject(data); })
            return true;
        }
        return false;
    }

    /** Delete all elements that satisfy the where callback */
    public delete(where?: where<T>): boolean{
        if(Array.isArray(this.data)){
            if(typeof where == 'function'){ this.data = this.data.filter(where); }
            return true;
        }
        return false;
    }

    public setIncrement(id: number = 1){
        (this.Model as any)[this.Model.name + 'ID'] = Math.max(id, 1) || 1;
        return this;
    }

    /** Clone object property, excluding object references */
    protected cloneObject(obj: any){
        if(typeof obj != 'object'){ return obj.valueOf(); }
        let res: any = {};
        for(let k in obj){ res[k] = this.cloneObject(obj[k]); }
        return res;
    }

    /** Cast an object to a TableModel */
    public static FROM<T extends DataModel>(service: DataService, Model: DataModelType<T>, data: any){ return new TableModel(service, Model, data.map((d: any) => new Model(service, d))); }
}