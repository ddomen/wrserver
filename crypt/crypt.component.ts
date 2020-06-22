import * as CRYPTO from 'crypto';

export type Algorithm = CRYPTO.CipherCCMTypes | CRYPTO.CipherGCMTypes | 'aes-256-cbc' | 'aes-192-cbc' | 'aes-128cbc';

/** Encrypt - Decrypt component */
export class Crypt {

    constructor(
        protected key: string = 'CryptServiceKey',
        protected vector: string = '51498c76b69cff62'
    ){}

    /** Sha256 Algorithm */
    public sha256(text: string): string{ return CRYPTO.createHmac('sha256', this.key).update(text).digest('hex'); }

    /** Generate a key for the given algorithm */
    protected genKey(key: string, bytes: number){
        while(key.length < bytes){ key += key; }
        return key.substr(0, bytes);
    }

    /** Generate a iv initializer vector */
    protected genVector(bytes: number){ return Buffer.from(CRYPTO.randomBytes(bytes)).toString('hex').substr(0, bytes);}

    /** Retrive bytes from given algorithm */
    protected byteAlgorithm(algorithm: Algorithm){ return algorithm.match('128') ? 16 : (algorithm.match('192') ? 24 : 32); }


    /** Encrypt a string with choosen algorithm */
    public encrypt(text: string, algorithm: Algorithm, key: string = this.key, vector: string = this.vector){
        let bytes = this.byteAlgorithm(algorithm),
            rkey = this.genKey(key, bytes),
            cipher = CRYPTO.createCipheriv(algorithm, rkey, vector),
            crypted = cipher.update(text,'utf8','hex');
        crypted += cipher.final('hex');
        return crypted;
    }

    /** Decrypt a string with choosen algorithm */
    public decrypt(text: string, algorithm: Algorithm, key: string = this.key, vector: string = this.vector){
        let bytes = this.byteAlgorithm(algorithm),
            rkey = this.genKey(key, bytes),
            decipher = CRYPTO.createDecipheriv(algorithm, rkey, vector),
            dec = decipher.update(text,'hex','utf8');
        dec += decipher.final('utf8');
        return dec;
    }
}