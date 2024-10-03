import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

const connectDB = async () => {
    try {
        //returns the response after the connection - stored in connectionInstance
        const connectionInstanse = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) 
        console.log(`MongoDB Connected !!! DB HOST: ${connectionInstanse.connection.host}`)
    } catch (error) {
        console.log("MongoDB connection error", error)
        process.exit(1);        // Node js functionality - gives the current process
    }
}

export default connectDB