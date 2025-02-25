"use server";

import {User} from "@/models/user" 
import dbConnect from "@/lib/mongoose";
import bc from "bcryptjs"

export const getUser = async (id:string) => {
    try {
        await dbConnect();
        const user = await User.findById(id)
        return user
    }catch (error){
        console.error(error);
        return null;
    }
}

export const checkMasterKeySalt = async (email:string , MasterKeySalt:string) => {
    try {
        await dbConnect();
        const user = await User.findOne({email})
        const masterKeyHash = user.masterKeyHash;
        const compare = bc.compare(MasterKeySalt ,masterKeyHash)
        return compare
    } catch  {
        return null;
    }
}

export const getMasterKeyReminder = async (email: string) => {
    try {
        await dbConnect();
        const user = await User.findOne({ email });
        return user?.masterKeyReminder || null;
    } catch {
        return null;
    }
}

export const setMasterKeyWithReminder = async (email: string, masterKeyHash: string, reminder?: string) => {
    try {
        await dbConnect();
        await User.updateOne(
            { email },
            { 
                masterKeyHash,
                masterKeySetAt: new Date(),
                masterKeyReminder: reminder 
            }
        );
        return true;
    } catch {
        return false;
    }
}