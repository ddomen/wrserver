import { Model, Column, Connection } from '@wrserver/core';
import { DataService, DataModel } from '@wrserver/data';
import { Crypt } from '@wrserver/crypt';
import { MailService } from '@wrserver/mail';
import { RoleGroupModel, RoleModel, RoleActionModel } from '@wrserver/roles';

export interface AuthRegistrationMail { subject: string, text: string, html?: boolean, from?: string, isFile?: boolean };
export interface AuthForm { name: string, password: string, email?: string };

/** User-Auth Model */
@Model
export class AuthModel extends DataModel implements AuthForm {
    @Column.ID()
    public id: number;
    @Column.String()
    public name: string;
    @Column.String()
    public password: string;
    @Column.String()
    public email: string;
    @Column.String()
    public ip: string;
    @Column.Model(RoleModel)
    public role: RoleModel;
    @Column.Model(RoleGroupModel)
    public roleGroup: RoleGroupModel;
    @Column.Boolean()
    public verified: boolean;
    @Column.Boolean()
    public banned: boolean;

    public online: boolean;
    public lastConnection: Date;

    public sendable(): any{ return { id: this.id, name: this.name, email: this.email, role: this.role }; }

    /** Check if this user can perform an action */
    public hasAction(action: string | RoleActionModel){ return this.roleGroup.hasAction(action) || this.role.hasAction(action); }

    /** Disconnect the user */
    public logout(connection: Connection): this{ return this.disconnect(); }
    /** Connect the user */
    public login(): this{ return this.ping(); }

    /** Put offline the user */
    public disconnect(): this{
        this.online = false;
        return this;
    }

    /** Put online and reset the last connection for the user */
    public ping(): this{
        this.online = true;
        this.lastConnection = new Date();
        return this;
    }

    /** Change current password */
    public changePassword(pass: string): boolean{
        if(!AuthModel.validate('password', pass)){ return false; }
        this.password = pass;
        return true;
    }

    /** Change current email */
    public changeEmail(email: string): boolean{
        if(!AuthModel.validate('email', email)){ return false; }
        this.email = email;
        return true;
    }

    /** Send a message to user linked connection */
    public send(cls: string, data: any, connection: Connection): this{ connection.ok(cls, data, 0); return this; }


    /** Register a new Auth user */
    public static register(dataService: DataService, emailService: MailService, auth: AuthForm): 0|1|2|3|4|5|6{
        if(!auth){ return 1; }
        auth.name = auth.name.toLowerCase();
        if(!this.validate('name', auth.name)){ return 2; }
        if(!this.validate('password', auth.password)){ return 3; }
        if(!this.validate('email', auth.email)){ return 4; }
        if(this.exists(dataService, auth.name)){ return 5; }
        if(this.existsEmail(dataService, auth.email)){ return 6; }
        else{
            auth.name = auth.name.toLowerCase();
            let newAuth = dataService.set<AuthModel>(this.Table, auth);
            emailService.send(auth.email,
                    this.RegistrationMail.subject,
                    emailService.format(this.RegistrationMail.text, {
                        code: this.registrationToken(newAuth),
                        name: newAuth.name,
                        password: newAuth.password,
                        id: (newAuth.id || '').toString()
                    }),
                    this.RegistrationMail.html,
                    this.RegistrationMail.isFile,
                    this.RegistrationMail.from)
                        .then(()=>{ }).catch(()=>{ })
            return 0;
        }
    }

    public static registrationToken(auth: AuthForm){ return this.sha256(auth.name + ':' + auth.password); }
    
    /** Convalidate a field for the user */
    public static validate(type: 'password' | 'email' | 'name', value: string): boolean{
        if(typeof value != 'string'){ return false; }
        switch(type){
            case 'password':
                return value.length >= 4 && value.length <= 16;
            case 'email':
                return !!value.match(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/g) && AuthModel.MailHosts.includes(value.split('@')[1] || '');
            case 'name':
                return value.length >= 5 && value.length <= 16;
        }
        return false;
    }

    /** Verify an user (ex. after email invitation / verification) */
    public static verify(service: DataService, name: string, token: string): 0|1|2|3{
        let user = service.get<AuthModel>(this.Table, usr => usr.name == name)[0];
        if(user){
            if(user.verified){ return 1; }
            if(this.registrationToken(user) != token){ return 2; }
            user.verified = true;
            service.save();
            return 0;
        }
        return 3;
    }

    /** Encrypt with sha256 */
    protected static sha256(text: string): string{ return this.Crypt.sha256(text); }
    /** Get Auth user by ID */
    public static getById(service: DataService, id: number): AuthModel{ return service.first<AuthModel>(this.Table, usr => usr.id == id); }
    /** Get Auth user by name */
    public static getByUserName(service: DataService, name: string): AuthModel{ return service.first<AuthModel>(this.Table, usr => usr.name == name.toLowerCase()); }

    /** Check if an user with name param exists */
    public static exists(service: DataService, name: string): boolean{ return !!service.get<AuthModel>(this.Table, auth => auth.name == name).length; }
    /** Check if an user with email param exists */
    public static existsEmail(service: DataService, email: string): boolean{ return !!service.get<AuthModel>(this.Table, auth => auth.email == email).length; }
    /** Try to find an Auth user from its name and password */
    public static login(service: DataService, login: AuthForm = null): AuthModel{
        return login == null ? null : service.first<AuthModel>(this.Table, auth => auth.password == login.password && auth.name == (login.name || '').toLowerCase());
    }

    public static Table: string = 'auth';
    protected static Columns: string[] = [];
    protected static Crypt: Crypt = new Crypt('auth.model');

    public static ConnectionInfo: string = 'auth.user';

    /** Set available Mail Host for email registration */
    public static withMailHost(hosts: string[]){ this.MailHosts = hosts; return this; }
    /** Set available Mail Host for email registration as International */
    public static withInternationalMailHost(){ return this.withMailHost(this.InternationalMailHosts); }
    /** Set available Mail Host for email registration as International */
    public static withItalianMailHost(){ return this.withMailHost(this.ItalianMailHosts); }

    /** List of Italian Mail Hosts */
    protected static ItalianMailHosts: string[] = [
        'gmail.com', 'googlemail.com', 'google.com', //google
        'hotmail.com', 'hotmail.it', 'outlook.it', 'outlook.com', 'live.it', 'live.com', 'msn.com', 'msn.it', //microsoft
        'libero.it', 'virgilio.it', 'tiscali.it', 'alice.it', 'tin.it', 'poste.it', 'teletu.it', //ISP italiani
        'yahoo.it', 'yahoo.com' //yahoo 
    ];
    /** List of International Mail Hosts */
    protected static InternationalMailHosts: string[] = [
        /* Default domains included */
        "aol.com", "att.net", "comcast.net", "facebook.com", "gmail.com", "gmx.com", "googlemail.com",
        "google.com", "hotmail.com", "hotmail.co.uk", "mac.com", "me.com", "mail.com", "msn.com",
        "live.com", "sbcglobal.net", "verizon.net", "yahoo.com", "yahoo.co.uk",
        /* Other global domains */
        "email.com", "fastmail.fm", "games.com" /* AOL */, "gmx.net", "hush.com", "hushmail.com", "icloud.com",
        "iname.com", "inbox.com", "lavabit.com", "love.com" /* AOL */, "outlook.com", "pobox.com", "protonmail.com",
        "rocketmail.com" /* Yahoo */, "safe-mail.net", "wow.com" /* AOL */, "ygm.com" /* AOL */,
        "ymail.com" /* Yahoo */, "zoho.com", "yandex.com",
        /* United States ISP domains */
        "bellsouth.net", "charter.net", "cox.net", "earthlink.net", "juno.com",
        /* British ISP domains */
        "btinternet.com", "virginmedia.com", "blueyonder.co.uk", "freeserve.co.uk", "live.co.uk",
        "ntlworld.com", "o2.co.uk", "orange.net", "sky.com", "talktalk.co.uk", "tiscali.co.uk",
        "virgin.net", "wanadoo.co.uk", "bt.com",
        /* Domains used in Asia */
        "sina.com", "sina.cn", "qq.com", "naver.com", "hanmail.net", "daum.net", "nate.com", "yahoo.co.jp", "yahoo.co.kr", "yahoo.co.id", "yahoo.co.in", "yahoo.com.sg", "yahoo.com.ph", "163.com", "126.com", "aliyun.com", "foxmail.com",
        /* French ISP domains */
        "hotmail.fr", "live.fr", "laposte.net", "yahoo.fr", "wanadoo.fr", "orange.fr", "gmx.fr", "sfr.fr", "neuf.fr", "free.fr",
        /* German ISP domains */
        "gmx.de", "hotmail.de", "live.de", "online.de", "t-online.de" /* T-Mobile */, "web.de", "yahoo.de",
        /* Italian ISP domains */
        "libero.it", "virgilio.it", "hotmail.it", "aol.it", "tiscali.it", "alice.it", "live.it", "yahoo.it", "email.it", "tin.it", "poste.it", "teletu.it",
        /* Russian ISP domains */
        "mail.ru", "rambler.ru", "yandex.ru", "ya.ru", "list.ru",
        /* Belgian ISP domains */
        "hotmail.be", "live.be", "skynet.be", "voo.be", "tvcablenet.be", "telenet.be",
        /* Argentinian ISP domains */
        "hotmail.com.ar", "live.com.ar", "yahoo.com.ar", "fibertel.com.ar", "speedy.com.ar", "arnet.com.ar",
        /* Domains used in Mexico */
        "yahoo.com.mx", "live.com.mx", "hotmail.es", "hotmail.com.mx", "prodigy.net.mx",
        /* Domains used in Brazil */
        "yahoo.com.br", "hotmail.com.br", "outlook.com.br", "uol.com.br", "bol.com.br", "terra.com.br", "ig.com.br", "itelefonica.com.br", "r7.com", "zipmail.com.br", "globo.com", "globomail.com", "oi.com.br"
    ];
    protected static MailHosts: string[] = AuthModel.ItalianMailHosts;

    /** Set registration mail */
    public static withRegistrationMail(data: AuthRegistrationMail){ this.RegistrationMail = data; return this; }
    protected static RegistrationMail: AuthRegistrationMail = {
        subject: 'Registration',
        text: 'WRS Registration: Thank you for your registration!'
    }
}