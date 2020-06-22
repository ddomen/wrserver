import { Service, Connection, Event, ServiceType } from "@wrserver/core";
import { DataService } from "@wrserver/data";
import { RoleModel, RolesService } from "@wrserver/roles";
import { AuthModel } from "./auth.model";
import { Event as AuthEvent } from "./events";

/** Auth Service for simple manage of User Account with WS Connections */
export class AuthService extends Service {
    public dependencies: ServiceType[] = [ DataService, RolesService ];
    protected rolesService: RolesService;

    /** Automaic initialize AuthService */
    public init(dataService: DataService, rolesService: RolesService): this{
        this.events.on<Event.Connection.Drop.Type>(Event.Connection.Drop.Name, event => {
            let auth = this.getUser(event.data);
            if(auth){
                auth.disconnect();
                this.events.emit<AuthEvent.Auth.Disconnect.Type>(AuthEvent.Auth.Disconnect.Name, auth);
            }
        })
        dataService.newTable('auth');
        dataService.newTable('token');
        return this.ready();
    }

    /** Check if the current Connection is linked to an Auth user */
    public checkUser<T = any>(connection: Connection): boolean{ return !!connection.get<T>(AuthModel.ConnectionInfo); }
    /** Get the current Connection linked Auth user */
    public getUser(connection: Connection): AuthModel{ return connection.get<AuthModel>(AuthModel.ConnectionInfo); }
    /** Set the current Connection Auth user */
    public setUser(connection: Connection, user: AuthModel): this{ connection.set<AuthModel>(AuthModel.ConnectionInfo, user); connection.set<RoleModel>(RoleModel.ConnectionInfo, user.role); return this; }
    /** Remove the current Connection Auth user */
    public removeUser(connection: Connection): this{ connection.set<AuthModel>(AuthModel.ConnectionInfo, null); connection.set<RoleModel>(RoleModel.ConnectionInfo, null); return this; }
    /** Get the current Connection Role */
    public getRole(connection: Connection): RoleModel{ return connection.get<RoleModel>(RoleModel.ConnectionInfo); }
}