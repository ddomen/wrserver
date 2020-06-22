import { Service, ServiceType, ControllerType, ModuleType, Module, ModelBase, Controller, Connection } from "@wrserver/core";
import { DataService, Event as DataEvent, DataModel } from "@wrserver/data";
import { RoleModel, RoleActionModel, RoleGroupModel, IRole, IRoleAction, IRoleGroup, RoleActionType } from "./roles.model";

/** Data Accessibility interface */
export interface IDataAccess{ write: boolean, read: boolean }

/** Role access and domain interface */
export interface IRoled { roleAccess?: boolean, name: string, domain?: string }

/** Role access and domain type */
export type Roled<T = any> = IRoled & T;

/** Service to manage server side roles */
export class RolesService extends Service {
    public dependencies: ServiceType[] = [ DataService ];

    /** Automatic initialize RolesService */
    public init(dataService: DataService): this{
        return this.generateTables(dataService)
                    .generateGroups(dataService)
                    .generateRoles(dataService)
                    .generateActions(dataService)
                    .ready();
    }
    
    /** Generate tables for roles uses */
    private generateTables(dataService: DataService): this{
        dataService.newTable(RoleModel.Table, 'role');
        dataService.newTable(RoleActionModel.Table, 'roleaction');
        dataService.newTable(RoleGroupModel.Table, 'rolegroup');
        return this;
    }

    /** Initialize actions */
    private generateActions(dataService: DataService): this{
        RolesService.Actions.forEach(act => { dataService.set<RoleActionModel>(RoleActionModel.Table, act); });
        return this;
    }

    /** Initialize roles */
    private generateRoles(dataService: DataService): this{
        RolesService.Roles.forEach(role => {
            let nRole: { name: string, domain: string, actions: string[] } = { name: role.name, domain: role.domain, actions: [] };
            role.actions.forEach(act => { let actName = this.getActionString(act); if(actName){ nRole.actions.push(actName); } });
            dataService.set<RoleModel>(RoleModel.Table, nRole);
            nRole.actions.forEach(act => { if(!RolesService.Actions.find(y => y.name == act)){ RolesService.Actions.push({ name: act, domain: nRole.domain }); } });
        });
        return this;
    }

    /** Initialize groups */
    private generateGroups(dataService: DataService): this{
        RolesService.Groups.forEach(group => {
            let nGroup: { name: string, domain: string, actions: string[], roles: string[] } = { name: group.name, domain: group.domain, roles: group.roles, actions: [] };
            group.actions.forEach(act => { let actName = this.getActionString(act); if(actName){ nGroup.actions.push(actName); } });
            dataService.set<RoleGroupModel>(RoleGroupModel.Table, nGroup);
            nGroup.roles.forEach(role => { if(!RolesService.Roles.find(r => r.name == role)){ RolesService.Roles.push({ name: role, domain: nGroup.domain, actions: [] }); } });
            nGroup.actions.forEach(act => { if(!RolesService.Actions.find(y => y.name == act)){ RolesService.Actions.push({ name: act, domain: nGroup.domain }); } });
        });
        return this;
    }

    /** Helper to get action name from a RoleActionType */
    private getActionString(action: RoleActionType): string{
        if(typeof action == 'string'){ return action;  }
        else if((action as ModuleType).prototype instanceof Module){ return 'module.' + (action as ModuleType).name; }
        else if((action as ControllerType).prototype instanceof Controller){ return 'controller.' + (action as ControllerType).name; }
        else if(typeof action == 'object' && action){
            if(action.access.read){ return 'data.read.' + action.model.name; }
            if(action.access.write){ return 'data.write.' + action.model.name; }
        }
        return null;
    }

    /** Check if a role can perform an action */
    public can(role: RoleModel, action: RoleActionModel | string, domain: string = null): boolean{
        if(action instanceof RoleActionModel){ return role && role.hasAction(action.name) && (domain == null || role.domain == domain); }
        else if(typeof action == 'string'){ return this.can(role, this.getAction(action), domain); }
        return false;
    }

    /** Check if a role have access to a module */
    public module(role: RoleModel, module: string | Roled<ModuleType>, domain: string = null): boolean{
        if(typeof module == 'string'){ return this.can(role, 'module.' + module, domain); }
        else if(module && !module.roleAccess){ return true; }
        else if(module && module.roleAccess){ return this.can(role, 'module.' + module.name, domain); }
        return false
    }

    /** Check if a role have access to a controller */
    public controller(role: RoleModel, controller: string | Roled<ControllerType>, domain: string = null, module: string | Roled<ModuleType> = null) : boolean{
        if(!((module == null || this.module(role, module, domain)))){ return false; }
        if(typeof controller == 'string'){ return this.can(role, 'controller.' + controller, domain); }
        else if(controller && !controller.roleAccess){ return true; }
        else if(controller && controller.roleAccess){ return this.can(role, 'controller.' + controller.name, domain); }
        return false;
    }

    /** Check if a role have access to a controller */
    public page(role: RoleModel, page: string, domain: string = null, controller: string | Roled<ControllerType> = null, module: string | Roled<ModuleType> = null): boolean{
        if(!((module == null || this.module(role, module, domain)))){ return false; }
        if(!((controller == null || this.controller(role, controller, domain)))){ return false; }
        return this.can(role, 'page.' + page, domain)
    }

    /** Check if a role have access to data */
    public data(role: RoleModel, data: string | Roled<typeof DataModel>, domain: string = null): IDataAccess{
        let dataName: string;
        if(typeof data == 'string'){ dataName = data; }
        else if(data.prototype instanceof DataModel && !data.roleAccess){ return { write: true, read: true };  }
        else if(data.prototype instanceof DataModel && data.roleAccess){ dataName = data.name; }
        else{ return { write: false, read: false }; }
        return { write: this.can(role, 'data.write.' + dataName, domain), read: this.can(role, 'data.read.' + dataName, domain) };
    }

    /** Get the current Connection linked Role */
    public getConnectionRole(connection: Connection): RoleModel{ return connection.get<RoleModel>(RoleModel.ConnectionInfo); }
    /** Get the current Connection linked Role Actions */
    public getConnectionAction(connection: Connection): RoleActionModel[]{ let role = this.getConnectionRole(connection); return (role && role.getActions()) || []; }

    /** Retrive role by id or name */
    public getRole(identifier: number | string): RoleModel{
        let where;
        if(typeof where == 'number'){ where = (role: RoleModel) => role.id == identifier; }
        else if(typeof where == 'string'){ where = (role: RoleModel) => role.name == identifier; }
        else{ return null; }
        return this.events.request<RoleModel, DataEvent.Table.First.Type<RoleModel>>(DataEvent.Table.First.Name, { table: 'roles', where });
    }

    /** Retrive action by id or name */
    public getAction(identifier: number | string, domain: string = null): RoleActionModel{
        let where;
        if(typeof where == 'number'){ where = (act: RoleActionModel) => act.id == identifier && (domain == null || act.domain == domain); }
        else if(typeof where == 'string'){ where = (act: RoleActionModel) => act.name == identifier && (domain == null || act.domain == domain); }
        else{ return null; }
        return this.events.request<RoleActionModel, DataEvent.Table.First.Type<RoleActionModel>>(DataEvent.Table.First.Name,{ table: 'roles.actions', where })
    }

    /** Get the Action name from a typed action (string | Module | Controller | Model) */
    public getActionName(action: string | Roled<ModuleType> |  Roled<ControllerType> | Roled<typeof ModelBase>, read: boolean = false): string{
        if(typeof action == 'string'){ return action; }
        else if(action.prototype instanceof Module){ return 'module.' + action.name; }
        else if(action.prototype instanceof Controller){ return 'controller.' + action.name; }
        else if(action.prototype instanceof ModelBase && read){ return 'data.read.' + action.name; }
        else if(action.prototype instanceof ModelBase && !read){ return 'data.write.' + action.name; }
        return null;
    }


    /** Create a role group */
    public createRoleGroup(name: string, roles: string[], actions: string[], domain: string = null): RoleGroupModel{
        return this.events.request<RoleGroupModel, DataEvent.Table.Set.Type<RoleGroupModel>>(DataEvent.Table.Set.Name, { table:'',  data: { name, roles, domain, actions} })
    }

    /** Create a role */
    public createRole(name: string, actions: string[], domain: string = null): RoleModel{
        return this.events.request<RoleModel, DataEvent.Table.Set.Type<RoleModel>>(DataEvent.Table.Set.Name, { table:'',  data: { name, domain, actions} })
    }

    /** Create an action */
    public createActionRole(name: string, domain: string = null): RoleActionModel{
        return this.events.request<RoleActionModel, DataEvent.Table.Set.Type<RoleActionModel>>(DataEvent.Table.Set.Name, { table:'',  data: { name, domain } })
    }

    /** Initializator for RoleGroups */
    private static Groups: IRoleGroup[] = [];
    /** Initializator for RoleActions */
    private static Actions: IRoleAction[] = [];
    /** Initializator for Roles */
    private static Roles: IRole[] = [];

    /** Set Roles to use in the server, than set actions not yet included */
    public static withRoles(...roles: IRole[]){ this.Roles.push(...roles); return this; }
    /** Set Actions to use in the server */
    public static withActions(...actions: IRoleAction[]){ this.Actions.push(...actions); return this; }
    /** Set Groups to use in the server, than set roles and actions not yet included */
    public static withGroups(...groups: IRoleGroup[]){ this.Groups.push(...groups); return this; }
}
