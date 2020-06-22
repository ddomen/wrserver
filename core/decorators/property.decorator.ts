import { Instance } from '../wrserver';
import { Decorator } from './decorator';

/** Decorator for properties | class{ @Dec()public prop; } | */
export type PropertyDecoration = (instance: Instance<any>, key: string | symbol) => void | any;

export class PropertyDecorator extends Decorator {
    public function(name: string): PropertyDecoration{ return super.function(name); }
    public static target(name: string, ...args: any[]): PropertyDecoration{ return super.target(name, ...args); }
    public static decore(...args: any[]): PropertyDecoration{ return super.decore(...args); }
}