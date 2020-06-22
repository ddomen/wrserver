import { Event as CoreEvent } from '@wrserver/core';
import { AuthModel } from './auth.model';

export namespace Event {
    export namespace Auth{
        export namespace Disconnect{
            export const Name: string = 'auth.disconnect';
            export type Type = AuthModel & CoreEvent;
        }
    }
}