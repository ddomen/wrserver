import { Module, ModelType, ServiceType } from "@wrserver/core";
import { RolesService } from "./roles.service";
import { RoleModel, RoleActionModel, IRole, IRoleAction, IRoleGroup } from "./roles.model";

/** Module to manage server side roles */
export class RolesModule extends Module {
    protected models: ModelType[] = [ RoleModel, RoleActionModel ];
    public services: ServiceType[] = [ RolesService ];
    public codes: string[] = [ 'NO_ACCESS' ]

    /** Set Roles to use in the server, than set actions not yet included */
    public static withRoles(...roles: IRole[]){ RolesService.withRoles(...roles); return this; }
    /** Set Actions to use in the server */
    public static withActions(...actions: IRoleAction[]){ RolesService.withActions(...actions); return this; }
    /** Set Groups to use in the server, than set roles and actions not yet included */
    public static withGroups(...groups: IRoleGroup[]){ RolesService.withGroups(...groups); return this; }
}
