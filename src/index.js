import dotenv from 'dotenv'
import { app } from './app.js';
import connectDB from "./db/index.js";

dotenv.config()

const port = process.env.PORT;

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port: `, port);
    })
})
.catch((err) => {
    console.log("MongoDB connection failed: ", err);
})
 


































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