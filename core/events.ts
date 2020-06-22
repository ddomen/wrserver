import { Connection, IConnectionIncomingMessage, IConnectionIncomingParsed, IConnectionOutcome } from "./component";
import { Service } from "./service";
import { request as WSRequest } from "websocket";
import { IBroadcastOutcome } from "./wrserver";
import { Module } from "./module";
import { Controller, Page } from "./controller";

/** Event for Emitter Request handling */
export interface Event {}
export namespace Event{
    export namespace Any{
        export const Name: string = 'event.any';
        export interface Type extends Event { [key: string]: any }
    }

    /** Connection shared Events  */
    export namespace Connection{
        /** Fires when connection rise up */
        export namespace Rise{
            export const Name: string = 'connection.rise';
            export type Type = Connection;
        }
        /** Fires when connection drop down */
        export namespace Drop{
            export const Name: string = 'connection.drop';
            export type Type = Connection;
        }
        /** Fires when connection closes (before drop) */
        export namespace Close{
            export const Name: string = 'connection.close';
            export type Type = Connection;
        }
        /** Fires when connection get an error */
        export namespace Error{
            export const Name: string = 'connection.error';
            export type Type = Error;
        }
        /** Fires when connection receives a ping */
        export namespace Ping{
            export const Name: string = 'connection.ping';
            export type Type = Connection;
        }
        /** Fires before connection send a pong */
        export namespace Pong{
            export const Name: string = 'connection.pong';
            export type Type = Connection;
        }
        /** Fires when connection receives a message (yet not parsed) */
        export namespace Message{
            export const Name: string = 'connection.message';
            export type Type = IConnectionIncomingMessage;
        }
        /** Fires when connection receives a parsed message */
        export namespace ParsedMessage{
            export const Name: string = 'connection.parsed';
            export type Type = IConnectionIncomingParsed;
        }
        /** Fires when connection receives a parsed message (Alias for ParsedMessage) */
        export namespace Digest{
            export const Name: string = 'connection.digest';
            export type Type = Module;
        }
        /** Fires when connection send a message */
        export namespace Send{
            export const Name: string = 'connection.send';
            export type Type = IConnectionOutcome;
        }
    }

    /** Service shared Events */
    export namespace Service{
        /** Fires when the Service ready method is called */
        export namespace Ready{
            export const Name: string = 'service.ready';
            export type Type = Service;
        }
        /** Fires when all Services ready method are called */
        export namespace AllReady{
            export const Name: string = 'service.all.ready';
            export type Type = null;
        }
    }

    /** Server shared Events */
    export namespace Server{
        /** Fires when connection send a message in broadcast mode */
        export namespace Broadcast{
            export const Name: string = 'server.broadcast';
            export type Type = IBroadcastOutcome;
        }
        /** Fires when the server is fully ready */
        export namespace Ready{
            export const Name: string = 'server.ready';
            export type Type = null;
        }
        /** Fires when receiving a GET HTTP request */
        export namespace Url{
            export const Name: string = 'server.url';
            export type Type = Express.Request;
        }
        /** Fires when receiving any method but GET HTTP request */
        export namespace BadMethod{
            export const Name: string = 'server.badmethod';
            export type Type = Express.Request;
        }
        /** Firse when server get error on HTTP request (status code 500) */
        export namespace Error{
            export const Name: string = 'server.error';
            export type Type = Error;
        }
    }

    /** Websocket shared Events */
    export namespace Websocket{
        /** Firse when a websocket connection request has been rejected */
        export namespace Reject{
            export const Name: string = 'websocket.reject';
            export type Type = WSRequest;
        }
        /** Firse when a websocket connection request has been accepted */
        export namespace Accept{
            export const Name: string = 'websocket.accept';
            export type Type = Connection;
        }
    }

    /** Module shared Events */
    export namespace Module{
        /** Fires when a module digest successfully a message */
        export namespace Digest{
            export const Name: string = 'module.digest';
            export type Type = Controller;
        }
    }

    /** Controller shared Events */
    export namespace Controller{
        export namespace Digest{
            export const Name: string = 'controller.digest';
            export type Type = Page;
        }
    }

}

