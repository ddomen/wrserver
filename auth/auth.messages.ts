/** Login data format */
export interface IAuthMessageLogin{ name: string, password: string }

/** Register data format */
export interface IAuthMessageRegister extends IAuthMessageLogin{ email: string }

/** Verify data format */
export interface IAuthMessageVerify{ name: string, token: string }