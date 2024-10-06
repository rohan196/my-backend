import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit: "16kb"}))                                  // To accept json data
app.use(express.urlencoded({extended: true, limit: "16kb"}))            // To accept and understand url data
app.use(express.static('public'))                                // To make a public folder on our server to keep files and folders
app.use(cookieParser())                                                 // To access user browser cookies

// routes import 
import userRouter from './routes/user.routes.js';

// routes declaration
app.use('/api/v1/users', userRouter);

// http:localhost:8000/api/v1/users/register


export {app} 