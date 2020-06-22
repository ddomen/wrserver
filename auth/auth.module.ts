import { Module, ModelType, ControllerType, ServiceType, ModuleType, Interceptor } from "@wrserver/core";
import { DataModule, DataService } from "@wrserver/data";
import { MailService, MailModule } from "@wrserver/mail";
import { RolesModule, RolesService } from '@wrserver/roles';
import { AuthModel, AuthRegistrationMail } from "./auth.model";
import { TokenModel } from "./token.model";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

/** A simple Authentication module for manage users */
export class AuthModule extends Module {
    protected controllers: ControllerType[] = [ AuthController ];
    protected models: ModelType[] = [ AuthModel, TokenModel ];
    public services: ServiceType[] = [ AuthService, DataService, MailService, RolesService ];
    public interceptors: Interceptor[] = [ ];
    public dependencies: ModuleType[] = [
        DataModule, MailModule,
        RolesModule.withRoles({ name: 'super', actions: ['*'] }, { name: 'administrator', actions: ['*'] })
    ];
    public codes: string[] = [
        'LOGIN_SUCCESS',
        'LOGIN_NO_PARAMETERS',
        'LOGIN_WRONG_CREDENTIALS',
        'LOGIN_NOT_VERIFIED',
        'LOGIN_BANNED',
        'REGISTRATION_SUCCESS',
        'REGISTRATION_FAIL',
        'REGISTRATION_NO_PARAMETERS',
        'REGISTRATION_NAME_DUPLICATE',
        'REGISTRATION_EMAIL_DUPLICATE',
        'REGISTRATION_INVALID_NAME',
        'REGISTRATION_INVALID_PASSWORD',
        'REGISTRATION_INVALID_EMAIL',
        'VERIFY_SUCCESS',
        'VERIFY_FAIL',
        'VERIFY_NO_PARAMITERS',
        'VERIFY_ALREADY_VERIFIED',
        'VERIFY_WRONG_TOKEN',
        'CHANGEPW_SUCCESS',
        'CHANGEPW_NO_PARAMETERS',
        'CHANGEEM_SUCCESS',
        'CHANGEEM_NO_PARAMETERS'
    ]


    /** Enable/Disable the encryption of the dataset storage */
    public static withEncrypt(enc: boolean = true){ DataService.withEncrypt(enc); return this; }
    /** Set mail host accepted in registration */
    public static withMailHost(hosts: string[]){ AuthModel.withMailHost(hosts); return this; }
    /** Set email service (default: gmail) */
    public static withService(service: string){ MailService.withService(service); return this; }
    /** Set email service configuration - user (default: '') */
    public static withUser(user: string){ MailService.withUser(user); return this; }
    /** Set email service configuration - password (default: '') */
    public static withPass(pass: string){ MailService.withPass(pass); return this; }
    /** Set registration mail */
    public static withRegistrationMail(data: AuthRegistrationMail){ AuthModel.withRegistrationMail(data); return this; }
}