import { Module, ServiceType, ModelType } from "@wrserver/core";
import { Algorithm } from "@wrserver/crypt";
import { TableModel } from "./table.model";
import { DataModel } from "./data.model";
import { DataService } from "./data.service";

/** A db-like Data managment module  */
export class DataModule extends Module {
    protected models: ModelType[] = [ TableModel, DataModel ];
    public services: ServiceType[] = [ DataService ];

    /** Set the base directory of the dataset storage */
    public static withDir(directory: string){ DataService.withDir(directory); return this; }
    /** Enable/Disable the encryption of the dataset storage */
    public static withEncrypt(enc: boolean = true){ DataService.withEncrypt(enc); return this; }
    protected static encrypt: boolean = false;
    /** Set the base algorithm of the DataService */
    public static withAlgorithm(alg: Algorithm){ DataService.withAlgorithm(alg); return this; }
    /** Set the autosave cadence of the DataService in ms */
    public static withCadence(cad: number){ DataService.withCadence(cad); return this; }
}