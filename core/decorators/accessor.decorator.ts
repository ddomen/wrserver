import { Decorator } from './decorator';
import { MethodDecoration } from './method.decorator';

/** Decorator for accessors [See MethodDecorator] */
export type AccessorDecoration = MethodDecoration;

export class AccessorDecorator extends Decorator {
    public function(name: string): AccessorDecoration { return super.function(name as any); }
    public static target(name: string, ...args: any[]): AccessorDecoration { return super.target(name, ...args); }
    public static decore(...args: any[]): AccessorDecoration { return super.decore(...args); }
}