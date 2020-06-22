import * as FS from 'fs';
import * as NODEMAILER from 'nodemailer';
import { Service, Emitter, ServiceType } from '@wrserver/core';
import { Event } from './events';

export interface IncompleteEmail { to?: string | string[], subject: string, text: string, html?: boolean, from?: string, isFile?: boolean };
export interface Email extends IncompleteEmail { to: string | string[] };

export class MailService extends Service {
    protected transporter: NODEMAILER.Transporter = NODEMAILER.createTransport({
        service: MailService.service,
        auth: { user: MailService.user, pass: MailService.pass }
    })

    public init(): this{
        this.events.on<Event.Email.Send.Type>(Event.Email.Send.Name, event => this.send(event.data.to, event.data.subject, event.data.text, event.data.html, event.data.isFile, event.data.from));
        return this.ready();
    }

    /** Send an Email by object */
    public sendEmail(email: Email){ return this.send(email.to, email.subject, email.text, email.html, email.isFile, email.from); }

    /** Send an Email by parameters */
    public send(to: string | string[], subject: string, text: string, html: boolean = true, isFile: boolean = false, from: string = MailService.user){
        let sendText = text;
        if(isFile){
            try{ sendText = FS.readFileSync(sendText).toString(); }
            catch(ex){ sendText = "WRS ERROR: Something went wrong! - reply to this mail to report the issue, thank you."; }
        }
        let opts: NODEMAILER.SendMailOptions = { to: Array.isArray(to) ? to.join(', ') : to, subject, from };
        opts[html ? 'html' : 'text'] = sendText;
        this.events.emit<Event.Email.BeforeSend.Type>(Event.Email.BeforeSend.Name, { to, subject, text, html, isFile, from });
        return this.transporter.sendMail(opts);
    }

    /** Format an email with specific replacer object */
    public format(text: string, replacer: { [key: string]: string }){
        let res = text;
        if(!replacer){ return res; }
        for(let t in replacer){
            let regex = new RegExp('\\$\\$\\$'+t+'\\$\\$\\$', 'gi');
            res = res.replace(regex, replacer[t]);
        }
        return res;
    }

    /** Set email service (default: gmail) */
    public static withService(service: string){ this.service = service; return this; }
    protected static service: string = 'gmail';
    /** Set email service configuration - user (default: '') */
    public static withUser(user: string){ this.user = user; return this; }
    protected static user: string = '';
    /** Set email service configuration - password (default: '') */
    public static withPass(pass: string){ this.pass = pass; return this; }
    protected static pass: string = '';
}