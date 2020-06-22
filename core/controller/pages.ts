import { IConnectionIncomingParsed, IConnectionOutcome } from "../component";
import { Controller } from "./controller";

/** Type of Page */
export type Page = { isPage: boolean, description?: string } & ((message: IConnectionIncomingParsed) => IConnectionOutcome);

/** Page decorator namespace */
export namespace Page{
    export function Page(target: Controller, propertyKey: string | symbol, descriptor: PropertyDescriptor){
        descriptor.value.isPage = true;
        return descriptor;
    }
}