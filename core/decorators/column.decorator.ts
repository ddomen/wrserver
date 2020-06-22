import { Constructor } from '../wrserver';
import { ModelBase } from "../models";
import { PropertyDecorator } from "./property.decorator";

export type ColumnSource<T = any> = T | (()=>T);
export type ColumnDecoration = <T extends ModelBase>(Model: T, name: string) => void;

/** Define a Column in the TableModel for this type of Model */
export class Column extends PropertyDecorator{

    public field(Model: any, name: string){
        let constr: any = Model.constructor;
        if(Array.isArray(constr.Columns)){ constr.Columns.push(constr.Field(name, this.parameters[0], this.parameters[1], this.parameters[2])) }
    }

    public fieldId(Model: any, name: string){
        let constr: any = Model.constructor;
        if(Array.isArray(constr.Columns)){ constr.Columns.push(ModelBase.ID(constr)) }
    }

    public static decore(type: any, def: any, array?: any): any{ return this.Field(type, def, array); }
    /** Define a Column in the TableModel for this type of Model - Define a Table Column for a Generic Field [See ModelBase.Field] */
    public static Field(type: any, def: any, array?: any): ColumnDecoration{ return this.target('field', type, def, array); }
    /** Define a Column in the TableModel for this type of Model -  Define a Table Column for a Numeric Field [See ModelBase.Number] */
    public static Number(def: ColumnSource<number> = 0): ColumnDecoration{ return this.target('field', Number, def); }
    /** Define a Column in the TableModel for this type of Model -  Define a Table Column for a Boolean Field [See ModelBase.Boolean] */
    public static Boolean(def: ColumnSource<boolean> = false): ColumnDecoration{ return this.target('field', Boolean, def); }
    /** Define a Column in the TableModel for this type of Model -  Define a Table Column for a String Field [See ModelBase.String] */
    public static String(def: ColumnSource<string> = ''): ColumnDecoration{ return this.target('field', String, def); }
    /** Define a Column in the TableModel for this type of Model -  Define a Table Column for an Array Field [See ModelBase.Array] */
    public static Array(array?: any, def: ColumnSource<any[]> = ()=>[]): ColumnDecoration{ return this.target('field', Array, def, array); }
    /** Define a Column in the TableModel for this type of Model -  Define a Table Column for a Date Field [See ModelBase.Date] */
    public static Date(def: ColumnSource<Date> = ()=>new Date): ColumnDecoration{ return this.target('field', Date, def); }
    /** Define a Column in the TableModel for this type of Model -  Define a Table Column for a Model Field [See ModelBase.Model] */
    public static Model(model: Constructor, def: ColumnSource = () => new model): ColumnDecoration{ return this.target('field', model, def); }
    /** Define a Column in the TableModel for this type of Model -  Define a Table Column for an ID autoincrement Field [See ModelBase.ID] */
    public static ID(): ColumnDecoration { return this.target('fieldId'); }
}