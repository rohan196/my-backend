import dotenv from 'dotenv'
import connectDB from "./db/index.js";

dotenv.config()

connectDB()
 


































/*
import express from "express";
const app = express()

;(async () =>  {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        //listeners - this is for the situation when express doesn't work-no communication
        app.on("error", (error) => {
            console.log("Error: ", error);
            throw error
        })
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on the port: ${process.env.PORT}`)
        })
    } catch (error) {
        console.log("ERROR: ", error)
        throw error
    }
})
*/