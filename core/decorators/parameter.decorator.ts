import { Decorator } from './decorator';

/** Decorator for parameter | function(@Dec()a: string){} | */
export type ParameterDecoration = (fn: Function, key: string | symbol, index: number) => void;

export class ParameterDecorator extends Decorator {
    public function(name: string): ParameterDecoration{ return super.function(name); }
    public static target(name: string, ...args: any[]): ParameterDecoration{ return super.target(name, ...args); }
    public static decore(...args: any[]): ParameterDecoration{ return super.decore(...args); }
}