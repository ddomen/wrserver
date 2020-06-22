/** An Array of codes for responses */
export const Codes: string[] = [
    'SUCCESS',
    'UNKNONW',
    'HTTP_ERROR',
    'SOCKET_ERROR',
    'SERVER_ERROR',
    'BAD_METHOD',
    'BAD_FORMAT',
    'BAD_TARGET',
    'BAD_SECTION',
    'BAD_PAGE',
    'BAD_REQUEST',
    'BAD_RESPONSE',
    'NOT_FOUND',
    'NO_AUTH',
    'NO_ACCESS'
];
Codes[-1] = 'UNKNOWN';