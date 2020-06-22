import { IConnectionIncomingParsed, IConnectionOutcome, Page as CorePage } from "@wrserver/core";
import { IRoleController } from "./roles.model";

export namespace Page{
    /** Check connection role before loading page */
    export function Role(role: string, domain: string = null){
        return function(target: IRoleController, propertyKey: string | symbol, descriptor: PropertyDescriptor){
            let page = descriptor.value;
            descriptor.value = function(this: IRoleController, message: IConnectionIncomingParsed): IConnectionOutcome{
                if(this.role && this.role.name == role && (domain == null || this.role.domain == domain)){ return page.call(this, message); }
                return this.bad('no access');
            }
            return CorePage.Page(target, propertyKey, descriptor);
        }
    }

    /** Check connection action before loading page */
    export function Action(action: string, domain: string = null){
        return function(target: IRoleController, propertyKey: string | symbol, descriptor: PropertyDescriptor){
            let page = descriptor.value;
            descriptor.value = function(this: IRoleController, message: IConnectionIncomingParsed): IConnectionOutcome{
                if(this.role && this.role.hasAction(action) && (domain == null || this.role.domain == domain)){ return page.call(this, message); }
                return this.bad('no access');
            }
            return CorePage.Page(target, propertyKey, descriptor);
        }
    }

    /** Check connection role if is in group before loading page */
    export function Group(group: string, domain: string = null){
        return function(target: IRoleController, propertyKey: string | symbol, descriptor: PropertyDescriptor){
            let page = descriptor.value;
            descriptor.value = function(this: IRoleController, message: IConnectionIncomingParsed): IConnectionOutcome{
                if(this.role){
                    let grp = this.role.inGroup(group);
                    if(grp){ return page.call(this, message); }
                }
                return this.bad('no access');
            }
            return CorePage.Page(target, propertyKey, descriptor);
        }
    }

    /** Check connection action on controller.<methodName> before loading page */
    export function ActionController(domain: string = null){
        return function(target: IRoleController, propertyKey: string, descriptor: PropertyDescriptor){ return Action('controller.' + propertyKey, domain)(target, propertyKey, descriptor); }
    }
    /** Check connection action on page.<methodName> before loading page */
    export function ActionPage(domain: string = null){
        return function(target: IRoleController, propertyKey: string, descriptor: PropertyDescriptor){ return Action('page.' + propertyKey, domain)(target, propertyKey, descriptor); }
    }
    /** Check connection action on both controller.<methodName> and page.<methodName> before loading page */
    export function ActionControllerPage(domain: string = null){
        return function(target: IRoleController, propertyKey: string, descriptor: PropertyDescriptor){
            return Action('page.' + propertyKey, domain)(target, propertyKey, Action('controller.' + propertyKey, domain)(target, propertyKey, descriptor));
        }
    }

    export import Page = CorePage.Page;
}
