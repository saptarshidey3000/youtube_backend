import mongoose, { Mongoose } from "mongoose";
import { DB_NAME } from "./constants";




//first approach to connect with database and start server

import e from "express";
import express from "express";
import dotenv from "dotenv";
const app=express();

(async()=>{
    try {
     await   mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log("Connected to the database successfully"); 
        app.on("error",(error)=>{
            console.error("Failed to connect with the database");
            throw error;
        })
        app.listen(process.env.PORT,()=>{
            console.log(`Server is running on port ${process.env.PORT}`);
        })

} catch(error){
    console.error("Error connecting to the database", error);
    throw error;
}})()
    