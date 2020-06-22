import { Instance, Class } from '../wrserver';
import { Decorator } from "./decorator";

/** Decorator for methods | class{ @Dec()method(){} } */
export type MethodDecoration = (instance: Instance<any> | Class, key: string | symbol, descriptor: PropertyDescriptor) => void | PropertyDescriptor;

export class MethodDecorator extends Decorator {
    public function(name: string): MethodDecoration{ return super.function(name); }
    public static target(name: string, ...args: any[]): MethodDecoration{ return super.target(name, ...args); }
    public static decore(...args: any[]): MethodDecoration{ return super.decore(...args); }
}