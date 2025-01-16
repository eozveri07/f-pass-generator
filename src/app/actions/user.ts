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
    } catch (error) {
        return null;
    }
}