import { Event as CoreEvent } from '@wrserver/core';
import { DataService, ITable, ISave, IGet, ISet, IFirst, IUpdate, IDelete, IDataSave } from "./data.service";
import { DataModel } from "./data.model";

export namespace Event {
    export namespace Service{
        export namespace Instanciated {
            export const Name: string = 'data.instanced';
            export type Type = DataService & CoreEvent;
        }
        export namespace SaveAll{
            export const Name: string = 'data.all.save';
            export type Type = null;
        }
        export namespace Save{
            export const Name: string = 'data.save';
            export type Type<T extends DataModel = any> = IDataSave<T> & CoreEvent;
        }
    }

    export namespace Table{
        export namespace New{
            export const Name: string = 'data.table.new';
            export type Type = ITable & CoreEvent;
        }
        export namespace Drop{
            export const Name: string = 'data.table.drop';
            export type Type = ITable & CoreEvent;
        }
        export namespace Save{
            export const Name: string = 'data.table.save';
            export type Type = ISave & CoreEvent;
        }
        export namespace Get{
            export const Name: string = 'data.table.get';
            export type Type<T extends DataModel = any> = IGet<T> & CoreEvent;
        }
        export namespace Set{
            export const Name: string = 'data.table.set';
            export type Type<T extends DataModel = any> = ISet<T> & CoreEvent;
        }
        export namespace First{
            export const Name: string = 'data.table.first';
            export type Type<T extends DataModel = any> = IFirst<T> & CoreEvent;
        }
        export namespace Update{
            export const Name: string = 'data.table.update';
            export type Type<T extends DataModel = any> = IUpdate<T> & CoreEvent;
        }
        export namespace Delete{
            export const Name: string = 'data.table.delete';
            export type Type<T extends DataModel = any> = IDelete<T> & CoreEvent;
        }
    }
}

export default Event;