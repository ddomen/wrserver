import * as PATH from 'path';
import * as FS from 'fs';
import { Console } from 'console';

/** Usefull console logger with file output */
export class WRSConsole extends Console {
    public currentLevel: number = 0;
    protected path: string = PATH.join(this.directory, 'logs');

    constructor(protected grade: string = 'UNK', protected directory: string = process.cwd()){
        super(process.stdout, process.stderr);
    }

    protected formatNumber(n: number = 0, digit: number = 2): string{
        let nn = n.toString();
        while(nn.length < digit){ nn = '0' + nn; }
        return nn;
    }
    protected date(): string{ let d = new Date(); return this.formatNumber(d.getHours())+':'+this.formatNumber(d.getMinutes())+':'+this.formatNumber(d.getSeconds()); }
    protected field(...str: any[]): string{ return str.map(s => '[' + s + ']').join(''); }
    protected row(...str: any[]): string{ return str.map(s => s+'\n').join(''); }
    protected tab(...str: any[]): string{ return str.map(s => s+'\t').join(''); }
    protected meta(mode: string): string{ return this.field(this.grade, mode.toUpperCase(), this.date(), this.stackTrace()); }

    protected saveLog(level: number, mode: string, ...args: any[]): this{
        try{
            if(!FS.existsSync(this.path)){ FS.mkdirSync(this.path) }
            FS.writeFileSync(
                PATH.join(this.path, mode + '.json'),
                this.stringify({ date: new Date(), grade: this.grade, trace: this.stackTrace(), silenced: level < this.currentLevel, data: args, level, mode })+',\n',
                { flag: 'a' }
            );
        }
        catch(e){}
        return this;
    }

    protected stackTrace(): string{
        let e = (new Error().stack||'').split('\n');
        e.shift();
        return PATH.relative(this.directory, ((e.find(x => !x.match('WRSConsole')) || '').match(/\((.*)\)/) || [])[1]);
    }

    protected stamp(stamper: keyof Console, mode: string, level: number = 0, ...args: any[]): this{
        if(typeof this[stamper] != 'function'){ return this; }
        if(typeof level != 'number'){ return this.stamp(stamper, mode, 0, level, ...args); }
        this.saveLog(level, mode, ...args);
        if(this.currentLevel <= level){ return (super[(stamper == 'trace' ? 'log' : stamper) as keyof Console] as any)(this.meta(mode), ...args);}
        return this;
    }

    /** Set the level of the output of the console. Greater is, lesser will be on the console (does not influence file output) */
    public level(lv?: number): this | number{ if(lv == undefined){ return this.currentLevel; } this.currentLevel = Number(lv) || 0; return this; }

    /** Stringify a circular object in Json pattern */
    public stringify(obj: any): string{
        let cache: any[] = [];
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if(cache.indexOf(value) !== -1) {
                    try{ return JSON.parse(JSON.stringify(value));}
                    catch(error){ return; }
                }
                cache.push(value);
            }
            return value;
        });
    }

    public log(...args: any[]): this{ return this.stamp('log', 'log', ...args); }
    public info(...args: any[]): this{ return this.stamp('info', 'info', ...args); }
    public debug(...args: any[]): this{ return this.stamp('debug', 'debug', ...args); }
    public table(...args: any[]): this{ return this.stamp('table', 'table', ...args); }
    public error(...args: any[]): this{ return this.stamp('error', 'error', ...args); }
    public warn(...args: any[]): this{ return this.stamp('warn', 'warn', ...args); }
    public trace(...args: any[]): this{ return this.stamp('trace', 'trace', ...args); }

    public node(...args: any[]): this{ return this.stamp('log', 'node', ...args); }
    public service(...args: any[]): this{ return this.stamp('log', 'service', ...args); }
    public model(...args: any[]): this{ return this.stamp('log', 'model', ...args); }
    public module(...args: any[]): this{ return this.stamp('log', 'module', ...args); }
    public controller(...args: any[]): this{ return this.stamp('log', 'controller', ...args); }
    public connection(...args: any[]): this{ return this.stamp('log', 'connection', ...args); }
}