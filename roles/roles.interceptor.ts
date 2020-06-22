import { Interceptor, ControllerType, Connection, IConnectionIncomingParsed, ServiceType, Controller } from "@wrserver/core";
import { RolesService, Roled } from "./roles.service";
import { RoleModel } from "./roles.model";

export class RolesInterceptorController extends Interceptor.Controller{
    public dependencies: ServiceType[] = [ RolesService ];
    protected services: { RolesService: RolesService };

    /** Intercept roles for controller */
    public intercept(controller: Roled<ControllerType>, connection: Connection, message: IConnectionIncomingParsed): null | Function | Symbol {
        if(!controller.roleAccess){ return this.NEXT; }
        let role = connection.get<RoleModel>(RoleModel.ConnectionInfo);
        if(!role || !this.services.RolesService.controller(role, controller)){ return function(this: Controller){ return this.bad('no access'); } }
        return this.NEXT;
    }
}

export class RolesInterceptorPage extends Interceptor.Page{
    public dependencies: ServiceType[] = [ RolesService ];
    protected services: { RolesService: RolesService };

    /** Intercept roles for a page */
    public intercept(page: string, connection: Connection, message: IConnectionIncomingParsed, controller: Controller){
        let method: any = (controller as any)[page];
        if(typeof method == 'function'){
            if(!method.roleAccess){ return this.NEXT; }
            let role = connection.get<RoleModel>(RoleModel.ConnectionInfo);
            if(!role || !this.services.RolesService.page(role, page)){ return function(this: Controller){ return this.bad('no access'); } }
        }
        return this.NEXT;
    }
}