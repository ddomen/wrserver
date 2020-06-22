import { Class } from '../wrserver';

export class Decorator {
    protected decorators: any[] = [];
    constructor(protected parameters: any[]){ }
    protected apply(...args: any[]): any{ return this.decorators.map(d => typeof d == 'function' ? d.apply(this, args) : d); }
    protected mixin(derived: Class, base: Class[]): any{
        let exclude = ['length', 'prototype', 'name'];
        base.forEach(b => {
            Object.getOwnPropertyNames(b.prototype).forEach(name => {
                if(name == 'constructor' && derived.constructor){ return; }
                derived.prototype[name] = b.prototype[name];
            });
            Object.getOwnPropertyNames(b).filter(x => !exclude.includes(x)).forEach(name => { derived[name] = b[name]; })
        });
        return derived;
    }
    public decore(...args: any[]): Decorator{ return null; }
    public function(name: string): any{
        let self = this;
        return function(...args: any[]){ if(typeof (self as any)[name] == 'function'){ return (self as any)[name].apply(self, args.concat(self.apply(...args))); } return null; }
    }
    public static target(name: string, ...args: any[]): any{ return new this(args).function(name as any); }
    public static decore(...args: any[]): any{ return this.target('decore', ...args); }
}