import { Model, Column } from '@wrserver/core';
import { Crypt } from '@wrserver/crypt';
import { DataService, DataModel } from '@wrserver/data';
import { AuthModel } from './auth.model';

/** Token Model */
@Model
export class TokenModel extends DataModel {
    @Column.ID()
    public id: number;
    @Column.Number()
    public auth: number;
    @Column.String(TokenModel.generate)
    public token: string;
    @Column.Date()
    public start: Date;
    @Column.Date(() => { let d = new Date(); d.setDate(d.getDate() + 1); return d; })
    public end: Date;

    public sendable(): any{ return { token: this.token, elaspe: this.end, type: 'user' }; }
    
    /** Refresh the Token duration */
    public refresh(): this{
        this.end = new Date();
        this.end.setDate(this.end.getDate() + 1);
        this.save();
        return this;
    }

    /** Elaspe the token */
    public elaspe(): this{
        this.end = new Date();
        this.save();
        return this;
    }

    /** Get the Auth user linked with this Token */
    public getUser(): AuthModel{ return AuthModel.getById(this.service, this.auth); }

    /** Check Token validity */
    public static check(service: DataService, token: string): TokenModel{
        if(!token){ return null; }
        let now = new Date();
        return service.first<TokenModel>(this.Table, tok => tok.token == token && tok.end > now);
    }

    /** Get Token by Auth user linked ID */
    public static getByUserId(service: DataService, id: number): TokenModel{
        let now = new Date(), s = service.first<TokenModel>(this.Table, t => t.auth == id && t.end > now);
        if(!s){ s = service.set<TokenModel>(this.Table, { auth: id }); service.save(); }
        return s;
    }
    
    /** Generate random pattern for token generation */
    public static random(n: number = 64): string{
        var text = '', possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for(var i=0;i<n;i++){ text += possible.charAt(Math.floor(Math.random() * possible.length)); }
        return text;
    }
    
    /** Generate new token key */
    public static generate(n: number = 64){ return this.Crypt.sha256(TokenModel.random(n)); }
    
    public static Table: string = 'token';
    protected static Columns: string[] = [];
    protected static Crypt: Crypt = new Crypt('token.model');
}