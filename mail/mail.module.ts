import { Module, ControllerType, ServiceType, ModuleType, Interceptor } from "@wrserver/core";
import { MailService } from "./mail.service";

/** A simple email module */
export class MailModule extends Module {
    protected controllers: ControllerType[] = [ ];
    protected models: any[] = [ ];
    public services: ServiceType[] = [ MailService ];
    public dependencies: ModuleType[] = [ ];
    public interceptors: Interceptor[] = [ ];

    /** Set email service (default: gmail) */
    public static withService(service: string){ MailService.withService(service); return this; }
    /** Set email service configuration - user (default: '') */
    public static withUser(user: string){ MailService.withUser(user); return this; }
    /** Set email service configuration - password (default: '') */
    public static withPass(pass: string){ MailService.withPass(pass); return this; }
}