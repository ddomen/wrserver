import { Class } from '../wrserver';
import { Decorator } from './decorator';

/** Decorator for classes  | @Dec()class{} |*/
export type ClassDecoration<T extends object = any> = (constructor: Class) => T;

export class ClassDecorator extends Decorator {
    public function(name: string): ClassDecoration{ return super.function(name); }
    public static target(name: string, ...args: any[]): ClassDecoration{ return super.target(name, ...args); }
    public static decore(...args: any[]): ClassDecoration{ return super.decore(...args); }
}