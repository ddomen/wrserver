import { Controller, IConnectionIncomingParsed, IConnectionOutcome, Page as CorePage } from "@wrserver/core";
import { Page as RolePage, IRoleController } from "@wrserver/roles";
import { IAuthController } from "./auth.controller";


export namespace Page{
    export function Auth(action: string = null, role: string = null, domain: string = null){
        return function(target: IRoleController, propertyKey: string | symbol, descriptor: PropertyDescriptor){
            if(action != null){ descriptor = RolePage.Action(action, domain)(target, propertyKey, descriptor); }
            if(role != null){ descriptor = RolePage.Role(role, domain)(target, propertyKey, descriptor); }

            let page = descriptor.value;
            descriptor.value = function(this: IAuthController, message: IConnectionIncomingParsed): IConnectionOutcome{
                if(!this.user){ return this.bad('no auth') }
                return page.call(this, message);
            }
            return CorePage.Page(target, propertyKey, descriptor);
        }
    }

    export function AuthRole(role: string, domain: string = null){
        return function(target: IRoleController, propertyKey: string | symbol, descriptor: PropertyDescriptor){
            return Auth(null, role, domain)(target, propertyKey, CorePage.Page(target, propertyKey, descriptor));
        }
    }

    export function AuthAction(action: string, domain: string = null){
        return function(target: IRoleController, propertyKey: string | symbol, descriptor: PropertyDescriptor){
            return Auth(action, null, domain)(target, propertyKey, CorePage.Page(target, propertyKey, descriptor));
        }
    }

    export function AuthPage(domain: string = null, role: string = null){
        return function(target: IRoleController, propertyKey: string, descriptor: PropertyDescriptor){
            return Auth('page.' + propertyKey, role,domain)(target, propertyKey, descriptor);
        }
    }

    export function AuthController(domain: string = null, role: string = null){
        return function(target: IRoleController, propertyKey: string, descriptor: PropertyDescriptor){
            return Auth('controller.' + propertyKey, role,domain)(target, propertyKey, descriptor);
        }
    }

    export function AuthControllerPage(domain: string = null, role: string = null){
        return function(target: IRoleController, propertyKey: string, descriptor: PropertyDescriptor){
            return Auth('page.' + propertyKey, role,domain)(target, propertyKey, Auth('controller.' + propertyKey, role,domain)(target, propertyKey, descriptor));
        }
    }

    export import Page = CorePage.Page;
    export import Role = RolePage.Role;
    export import Action = RolePage.Action;
    export import ActionPage = RolePage.ActionPage;
    export import ACtionController = RolePage.ActionController;
    export import ActionControllerPage = RolePage.ActionControllerPage;
}