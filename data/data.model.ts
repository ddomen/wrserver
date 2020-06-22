import { ModelBase } from "@wrserver/core";
import { DataService } from "./data.service";

/** where callback => filter the set [SQL - WHERE] */
export type where<T extends ModelBase = ModelBase> = (value?: T, index?: number, array?: T[]) => boolean;
/** order callback => order the set [SQL - ORDER BY] */
export type order<T extends ModelBase = ModelBase> = (a: T, b: T) => number;
/** mapAs callback => remap the set with different objects [SQL - AS] */
export type mapAs<T extends ModelBase = ModelBase> = (value?: T, index?: number, array?: T[]) => T;

/** Restricted Model Type for the Table Model */
export type DataType<T extends ModelBase> = T;
/** Restricted Model Type for the Table Model */
export type DataModelType<T extends ModelBase = ModelBase> = { new (service: DataService, data: T): T, checkValidity(model: T, ...args: any[]): boolean };

/** An abstract Model to represent Json saved files for collect data */
export abstract class DataModel extends ModelBase {
    constructor(protected service: DataService, data: any){ super(data); }

    /** Save changes of the current Table */
    protected save(): boolean{ this.service.apply(this.class.Table); return true; }
    /** Select an array of entries from dataset that satisfy the where callback */
    protected get(where?: where<DataModel>, order?: order<DataModel>, mapAs?: mapAs<DataModel>): DataModel[] { return this.service.get(this.class.Table, where, order, mapAs); }
    /** Insert a new element to the current Table */
    protected set(data: DataModel): DataModel{ return this.service.set(this.class.Table, data); }
    /** Edit all elements that satisfy the where callback */
    protected update(data: DataModel, where?: where): boolean { return this.service.update(this.class.Table, data, where); }
    /** Delete all elements that satisfy the where callback */
    protected delete(where?: where<DataModel>): boolean{ return this.service.delete(this.class.Table, where); }
    /** Select the first element that satisfy the where callback */
    protected first(where?: where<DataModel>, order?: order<DataModel>, mapAs?: mapAs<DataModel>): DataModel { return this.service.first(this.class.Table, where, order, mapAs); }

    /** Check if a model can be validated on a dataset */
    protected static checkValidity(model: DataModel, set: DataModel[]): boolean{ return true; }
    
    /** Represent the table name which can be saved on a file */
    public static Table: string;
}