import { Controller, IConnectionIncomingParsed, IConnectionOutcome, IConnectionIncomingParsedNull } from "@wrserver/core";
import { DataService } from "@wrserver/data";
import { MailService } from "@wrserver/mail";
import { AuthModel } from "./auth.model";
import { AuthService } from "./auth.service";
import { TokenModel } from "./token.model";
import { Page } from "./auth.decorator";
import { IRoleController, RoleModel, RolesService } from "@wrserver/roles";
import { IAuthMessageVerify, IAuthMessageLogin, IAuthMessageRegister } from "./auth.messages";

export type AuthControllerServices = { AuthService: AuthService, DataService: DataService, MailService: MailService, RolesService: RolesService };
export type AuthControllerModels = { AuthModel: typeof AuthModel, TokenModel: typeof TokenModel };
/** Auth interface for @Auth decorator implementation */
export interface IAuthController extends Controller{ user: AuthModel }

/** Controller for Account Managment */
export class AuthController extends Controller implements IAuthController, IRoleController {
    public user: AuthModel = this.services.AuthService.getUser(this.connection);
    public role: RoleModel = this.services.RolesService.getConnectionRole(this.connection);
    protected services: AuthControllerServices;
    protected models: AuthControllerModels;

    /** #PAGE - Login */
    @Page.Page
    protected login(message: IConnectionIncomingParsed<IAuthMessageLogin>): IConnectionOutcome {
        if(!message.data){ return this.bad('login no parameters'); }
        let usr: AuthModel = this.models.AuthModel.login(this.services.DataService, { name: message.data.name, password: message.data.password });
        if(!usr){ return this.bad('login wrong credentials'); }
        else if(!usr.verified){ return this.bad('login not verified'); }
        else if(usr.banned){ return this.bad('login banned'); }
        usr.login();
        this.services.AuthService.setUser(this.connection, usr);
        return this.ok('user', usr);
    }  

    /** #PAGE - Logout */
    @Page.Auth()
    protected logout(message: IConnectionIncomingParsedNull): IConnectionOutcome {
        this.user.logout(this.connection);
        this.services.AuthService.removeUser(this.connection);
        return this.ok('logout', true);
    }

    /** #PAGE - Change Password */
    @Page.AuthPage()
    protected password(message: IConnectionIncomingParsed<string>): IConnectionOutcome{
        if(!message.data){ return this.bad('changepw no parameters'); }
        this.user.changePassword(message.data);
        return this.ok('code', 'changepw success');
    }

    /** #PAGE - Change Email */
    @Page.AuthPage()
    protected email(message: IConnectionIncomingParsed<string>): IConnectionOutcome{
        if(!message.data){ return this.bad('changeem no parameters'); }
        this.user.changeEmail(message.data);
        return this.ok('code', 'changeem success');
    }

    /** #PAGE - Register new user */
    @Page.Page
    protected register(message: IConnectionIncomingParsed<IAuthMessageRegister>): IConnectionOutcome{
        if(!message.data){ return this.bad('registration no parameters'); }
        let reg = this.models.AuthModel.register(this.services.DataService, this.services.MailService, message.data);
        switch(reg){
            case 0:
                let usr = this.models.AuthModel.getByUserName(this.services.DataService, message.data.name);
                return this.ok('code', 'registration success');
            case 2: return this.bad('registration invalid name');
            case 3: return this.bad('registration invalid password')
            case 4: return this.bad('registration invalid email');
            case 5: return this.bad('registration name duplicate');
            case 6: return this.bad('registration email duplicate');
            default: return this.bad('registration fail');
        }
    }

    /** #PAGE - Verify new user */
    @Page.Page
    protected verify(message: IConnectionIncomingParsed<IAuthMessageVerify>): IConnectionOutcome{
        if(!message.data){ return this.bad('verify no parameters'); }
        let ids = this.models.AuthModel.verify(this.services.DataService, message.data.name, message.data.token);
        switch(ids){
            case 0: return this.ok('code', 'verify success');
            case 1: return this.ok('cls', 'verify already verified');
            case 2: return this.bad('verify wrong token');
            case 3: return this.noAuth();
            default: return this.bad('verify fail')
        }
    }

    @Page.AuthPage()
    protected ban(message: IConnectionIncomingParsed): IConnectionOutcome{
        if(!message.data){ return this.bad('ban no parameters'); }
        
    }

    /** Return a bad no auth message */
    protected noAuth(){ return this.bad('no auth'); }

    public static section: string = 'auth';
}