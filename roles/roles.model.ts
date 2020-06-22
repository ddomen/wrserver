import { Model, Column, ModuleType, ControllerType, ModelBase, Controller } from "@wrserver/core";
import { DataModel } from "@wrserver/data";
import { IDataAccess } from "./roles.service";

/** Cast possibilities for RoleActionModel.name */
export type RoleActionType = string | ModuleType | ControllerType | { model: typeof ModelBase, access: IDataAccess };

/** Interface for requested role description */
export interface IRoleController extends Controller { role: RoleModel }

@Model
export class RoleActionModel extends DataModel{
    @Column.ID()
    public id: number;

    @Column.String()
    public name: string;

    @Column.String(null)
    public domain: string;

    public static checkValidity(model: RoleActionModel, set: RoleActionModel[]): boolean{ return model.name && !set.find(act => act.name == model.name && act.domain == model.domain); }

    public static Table: string = 'roles.actions';
    protected static Columns: string[] = [];
}
export interface IRoleAction{ name: string, domain?: string }

@Model
export class RoleModel extends DataModel{
    @Column.ID()
    public id: number;

    @Column.String()
    public name: string;

    @Column.String(null)
    public domain: string;

    @Column.Array([], ()=>[])
    public actions: string[];

    /** Check if this role can perform an action */
    public hasAction(action: string | RoleActionModel): boolean{
        let actName = typeof action == 'string' ? action : (action instanceof RoleActionModel ? action.name : null);
        return actName && this.actions && (this.actions.includes(actName) || this.actions.includes('*'));
    }

    public inGroup(group: string | RoleGroupModel): RoleGroupModel{
        if(group instanceof RoleGroupModel){ return (!!group.roles.find(role => this.name == role) && group) || null; }
        return this.getGroups().filter(grp => grp.name == group)[0] || null;
    }

    /** Get array of actions from actions ids */
    public getActions(): RoleActionModel[]{
        let actions = this.service.get<RoleActionModel>(RoleActionModel.Table, act => this.actions.includes(act.name));
        return this.actions.map(name => actions.find(act => act.name == name));
    }

    /** Get array of groups containing actual role */
    public getGroups(): RoleGroupModel[]{
        return this.service.get<RoleGroupModel>(RoleGroupModel.Table, grp => grp.roles.includes(this.name));
    }

    public static checkValidity(model: RoleModel, set: RoleModel[]): boolean{ return model.name && !set.find(role => role.name == model.name && role.domain == model.domain); }

    public static Table: string = 'roles';
    public static ConnectionInfo: string = 'roles.role';
    protected static Columns: string[] = [];
}
export interface IRole{ name: string, domain?: string, actions: RoleActionType[] }

@Model
export class RoleGroupModel extends DataModel{
    @Column.ID()
    public id: number;

    @Column.String()
    public name: string;

    @Column.String(null)
    public domain: string;

    @Column.Array([], ()=>[])
    public roles: string[];

    @Column.Array([], ()=>[])
    public actions: string[];

    /** Check if this group contains a role */
    public hasRole(role: string | RoleModel): boolean{
        let roleName = typeof role == 'string' ? role : (role instanceof RoleModel ? role.name : null);
        return roleName && this.roles && this.roles.includes(roleName);
    }

    /** Check if this group can perform an action */
    public hasAction(action: string | RoleActionModel): boolean{
        let actName = typeof action == 'string' ? action : (action instanceof RoleActionModel ? action.name : null);
        return actName && this.actions && this.actions.includes(actName);
    }

    /** Get array of actions from actions ids */
    public getActions(): RoleActionModel[]{
        let actions = this.service.get<RoleActionModel>(RoleActionModel.Table, act => this.actions.includes(act.name));
        return this.actions.map(name => actions.find(act => act.name == name));
    }

    /** Get array of roles from roles ids */
    public getRoles(): RoleModel[]{
        let roles = this.service.get<RoleModel>(RoleModel.Table, role => this.roles.includes(role.name));
        return this.roles.map(name => roles.find(role => role.name == name));
    }

    public static checkValidity(model: RoleGroupModel, set: RoleGroupModel[]): boolean{ return model.name && !set.find(group => group.name == model.name && group.domain == model.domain); }

    public static Table: string = 'roles.groups';
    protected static Columns: string[] = [];
}
export interface IRoleGroup extends IRole{ roles: string[] }
