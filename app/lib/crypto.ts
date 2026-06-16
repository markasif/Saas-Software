import {hash, verify} from "argon2";

export async function hashPassword(password: string) : Promise<string>{
    return await hash(password)
}

export async function verifyPassword(password: string, hash: string) : Promise<boolean>{
    try{
        return await verify(hash, password)
    }catch(error){
        console.log("Verification failed", error)
        return false
    }
}