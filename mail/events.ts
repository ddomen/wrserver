import { Email } from './mail.service';

export namespace Event{
    /** Email shared Events */
    export namespace Email{
        /** Fires just before email is sent */
        export namespace BeforeSend{
            export const Name: string = 'email.beforesend';
            export type Type = Email;
        }

        /** Fires when a mail is begin to send */
        export namespace Send{
            export const Name: string = 'email.send';
            export type Type = Email;
        }
    }
}