import * as PATH from 'path';
import * as FS from 'fs';
import { Service, Emitter, ModelBase } from '@wrserver/core';
import { Crypt, Algorithm } from '@wrserver/crypt';
import { TableModel } from './table.model';
import { Event } from './events';
import { DataModel, where, order, mapAs } from './data.model';

/** Data interface to communicate with events */
export interface IDataModel { table: string }
/** Data interface to communicate with events */
export interface ISet<T extends DataModel = any> extends IDataModel { data: Partial<T> }
/** Data interface to communicate with events */
export interface IDelete<T extends DataModel = any> extends IDataModel { where?: where<T> }
/** Data interface to communicate with events */
export interface IUpdate<T extends DataModel = any> extends ISet<T>, IDelete{ }
/** Data interface to communicate with events */
export interface IGet<T extends DataModel = any> extends IDelete<T> { order?: order<T>, mapAs?: mapAs<T> }
/** Data interface to communicate with events */
export interface IFirst<T extends DataModel = any> extends IGet<T> { }
/** Data interface to communicate with events */
export interface ISave extends IDataModel { }
/** Data interface to communicate with events */
export interface ITable extends ISave { model: string }
/** Data interface to communicate with events */
export interface IDataSave<T extends DataModel = any> { file: string, data: TableModel<T> }

/** Service that allow to store in json files db-like data  */
export class DataService extends Service {
    protected data: { [key: string]: TableModel<any> } = {};
    protected timeout: any;
    protected path: string;

    public init(): this{
        this.events.fire<Event.Service.Instanciated.Type>(Event.Service.Instanciated.Name, this);
        this.checkPath();
        this.load().then(()=>{ this.ready(); }).catch(()=>{ })
        this.setTimer();
        this.setResponder();
        return this;
    }

    /** Set the responders for Emitter events */
    private setResponder(): this{
        this.events.respond<boolean, Event.Table.New.Type>(Event.Table.New.Name, event =>{
            if(!event.data.table || !event.data.model){ return false; }
            return this.newTableFromObject(event.data);
        })
        this.events.respond<boolean, Event.Table.Drop.Type> (Event.Table.Drop.Name, event => this.dropTable(event.data.table));
        this.events.respond<void, Event.Table.Save.Type> (Event.Table.Save.Name, event => { this.apply(event.data.table) });
        this.events.respond<DataModel[], Event.Table.Get.Type>(Event.Table.Get.Name, event => this.get(event.data.table, event.data.where, event.data.order, event.data.mapAs));
        this.events.respond<DataModel, Event.Table.Set.Type>(Event.Table.Set.Name, event => this.set(event.data.table, event.data.data));
        this.events.respond<DataModel, Event.Table.First.Type>(Event.Table.First.Name, event => this.first(event.data.table, event.data.where, event.data.order, event.data.mapAs));
        this.events.respond<boolean, Event.Table.Update.Type>(Event.Table.Update.Name, event => this.update(event.data.table, event.data.data, event.data.where));
        this.events.respond<boolean, Event.Table.Delete.Type>(Event.Table.Delete.Name, event => this.delete(event.data.table, event.data.where));
        return this;
    }

    /** Check if the saving path exists */
    protected checkPath(): this{
        let s = FS.existsSync(this.directory) ? FS.statSync(this.directory) : null;
        if(s && !s.isDirectory()){ this.directory += '_'; return this.checkPath(); }
        else if(!s){ FS.mkdirSync(this.directory); }
        return this;
    }

    /** Set a timer for auto-saving */
    protected setTimer(): this{ this.timeout = setTimeout(()=>{ this.timer() }, DataService.cadence); return this; }
    /** Restore timer after a save */
    protected timer(): this{ return this.save().setTimer(); }

    /** Load all files from the base directory */
    protected load(): Promise<any>{
        return new Promise((y,n)=>{
            let dir = FS.readdirSync(this.directory);
            dir = DataService.encrypt ?
                    dir.filter(f => f.substr(-7) == '.cryson').map(f => f.substr(0, f.length-7)) :
                    dir.filter(f => f.substr(-5) == '.json').map(f => f.substr(0, f.length-5));
            this.loadChunk(dir).then(y).catch(n);
        });
    }

    /** Async load a files stack, from the base directory */
    protected loadChunk(stack: string[]): Promise<any>{
        return new Promise((y,n)=> {
            if(stack.length){
                let file = stack.shift();
                this.loadFile(file)
                    .then((data)=>{
                        this.data[file] = data;
                        this.data[file].setIncrement((this.data[file].first((a: any)=>true, (a: any, b: any) => a.id > b.id ? 1 : -1, (a: any) => a.id) || { id:0 }).id + 1)
                        this.loadChunk(stack).then(y).catch(n);
                    })
                    .catch(()=>{ this.loadChunk(stack).then(y).catch(n); })
            }
            else{ y(); }
        })
    }

    /** Load a file and convert it to a DataModel */
    protected loadFile(file: string): Promise<any>{
        return new Promise((y, n) => {
            try{
                let ext = DataService.encrypt ? '.cryson' : '.json',
                    r = FS.createReadStream(PATH.join(this.directory, file + ext)), res = '';
                r.on('data', (data) => { res += data.toString(); })
                r.on('end', () => {
                    let pres = JSON.parse(DataService.encrypt ? this.decrypt(res) : res),
                        model = ModelBase.getByName(pres.__model__)
                    if(model && Array.isArray(pres.__data__)){
                        pres = TableModel.FROM(this, model, pres.__data__);
                        if(pres.data.length && pres.data[0].id != undefined){
                            let maxID = 0;
                            pres.data.forEach((d: any) => { maxID = Math.max(maxID, d.id); });
                            model.ID = maxID + 1;
                        }
                    }
                    y(pres);
                })
            }
            catch(e){ this.events.fire('data.error', e); n(e); }
        });
    }

    /** Save changes of a Table */
    public apply(table: string): this{ if(this.data[table]){ this.saveChunk([table]);} return this; }
    /** Remove a file linked to a Table */
    public remove(table: string): this{
        if(!this.data[table]){
            let ext = DataService.encrypt ? '.cryson' : '.json';
            try{ FS.unlinkSync(PATH.join(this.directory, table + ext)); }
            catch(e){ }
        }
        return this;
    }
    
    /** Save current dataset, in the base directory */
    public save(): this{
        this.events.emit<Event.Service.SaveAll.Type>(Event.Service.SaveAll.Name);
        try{ this.saveChunk(Object.keys(this.data)); }
        catch(e){}
        return this;
    }

    /** Async save a files stack, in the base directory */
    protected saveChunk(stack: string[]): this{
        if(stack.length){
            let file = stack.shift();
            this.console.debug('saving ' + file + ' table');
            this.events.emit<Event.Service.Save.Type>(Event.Service.Save.Name, { file, data: this.data[file] });
            this.saveFile(file, this.data[file])
                .then(() => { this.saveChunk(stack); })
                .catch(() => { this.saveChunk(stack); })
        }
        return this;
    }

    /** Save a file in a readable modelled json */
    protected saveFile(file: string, data: any){
        return new Promise((y, n) => {
            try{
                let ext = DataService.encrypt ? '.cryson' : '.json',
                    d = JSON.stringify(data),
                    w = FS.createWriteStream(PATH.join(this.directory, file + ext));
                d = DataService.encrypt ? this.encrypt(d) : d;
                w.write(d);
                w.end(()=>{ y(); })
            }
            catch(e){ n(e); }
        });
    }

    /** Check if Table exists */
    protected isTable(table: string): boolean{ return table && this.data[table] instanceof TableModel }

    /** Encrypt a text (default with base data algorithm) */
    protected encrypt(text: string, algorithm: Algorithm = DataService.algorithm){ return DataService.Crypt.encrypt(text, algorithm); }
    /** Decrypt a text (default with base data algorithm) */
    protected decrypt(text: string, algorithm: Algorithm = DataService.algorithm){ return DataService.Crypt.decrypt(text, algorithm); }

    /** Select an array of entries from dataset that satisfy the where callback */
    public getFromObject<T extends DataModel>(obj: IGet<T>)
        { return this.get<T>(obj.table, obj.where, obj.order, obj.mapAs); }
    /** Select an array of entries from dataset that satisfy the where callback */
    public get<T extends DataModel>(table: string, where?: where<T>, order?: order<T>, mapAs?: mapAs<T>): T[]
        { return this.isTable(table) ? this.data[table].get(where, order, mapAs) : []; }
    /** Select the first element that satisfy the where callback */
    public firstFromObject<T extends DataModel>(obj: IFirst<T>)
        { return this.first<T>(obj.table, obj.where, obj.order, obj.mapAs); }
    /** Select the first element that satisfy the where callback */
    public first<T extends DataModel>(table: string, where?: where<T>, order?: order<T>, mapAs?: mapAs<T>): T
        { return this.get<T>(table, where, order, mapAs)[0]; }
    /** Insert a new element to a Table */
    public setFromObject<T extends DataModel>(obj: ISet<T>)
        { return this.set<T>(obj.table, obj.data); }
    /** Insert a new element to a Table */
    public set<T extends DataModel>(table: string, data: Partial<T>): T
        { let res = this.isTable(table) ? this.data[table].set(data) : null; if(res){ this.apply(table); } return res; }
    /** Edit all elements that satisfy the where callback */
    public updateFromObject<T extends DataModel>(obj: IUpdate<T>)
        { return this.update<T>(obj.table, obj.data, obj.where); }
    /** Edit all elements that satisfy the where callback */
    public update<T extends DataModel>(table: string, data: Partial<T>, where?: where<T>): boolean
        { let res = this.isTable(table) && this.data[table].update(data, where); if(res){ this.apply(table); } return res; }
    /** Delete all elements that satisfy the where callback */
    public deleteFromObject<T extends DataModel>(obj: IDelete<T>)
        { return this.delete<T>(obj.table, obj.where); }
    /** Delete all elements that satisfy the where callback */
    public delete<T extends DataModel>(table: string, where?: where<T>): boolean
        { let res = this.isTable(table) && this.data[table].delete(where); if(res){ this.apply(table); } return res; }
    
    /** Create a new Table built on a Model, if does not exists (remember to omit the final 'Model' from the model name) */
    public newTableFromObject(table: ITable){ return this.newTable(table.table, table.model); }
    /** Create a new Table built on a Model, if does not exists (remember to omit the final 'Model' from the model name) */
    public newTable(name: string, modelName: string = name): boolean{
        let model = ModelBase.getByName(modelName);
        if(!this.data[name] && model){
            this.data[name] = new TableModel(this, model, []);
            this.apply(name);
            return true;
        }
        return false;
    }
    /** Remove a Table from the dataset, than remove the file linked to that */
    public dropTable(name: string): boolean
        { let res = this.isTable(name) && (delete this.data[name]); if(res){ this.remove(name) } return res; }

    /** Set the base directory of the dataset storage */
    public static withDir(directory: string){ this.directory = directory; return this; }
    protected static directory: string = 'data';
    /** Enable/Disable the encryption of the dataset storage */
    public static withEncrypt(enc: boolean = true){ this.encrypt = !!enc; return this; }
    protected static encrypt: boolean = false;
    /** Set the base algorithm of the DataService */
    public static withAlgorithm(alg: Algorithm){ this.algorithm = alg; return this; }
    protected static algorithm: Algorithm = 'aes-256-cbc';
    /** Set the autosave cadence of the DataService in ms */
    public static withCadence(cad: number){ this.cadence = cad; return this; }
    protected static cadence: number = 900000;
    protected static Crypt: Crypt = new Crypt('data.service');

}