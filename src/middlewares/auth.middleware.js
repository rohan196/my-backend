import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";
import dotenv from 'dotenv'

dotenv.config()

export const verifyJWT = asyncHandler(async(req, res, next) => {        // if there is no res to send and it's not uses - we can change it to _, production level code
    try {
        // req has the access to the cookies cuz of the cookie parser middleware we added - cookies have our tokens 
        // In the mobile devices we can't get cookie access, so we use data from the headers -  user sending a custom header
        const userToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") 
        // we get the header from user in the format -> Authorization Bearer <token> - read about it in jwt
        
        // console.log(userToken)
        // console.log(req.cookies)
        // console.log(req.headers)

        if(!userToken) {
            throw new ApiError(401, "Unauthorized request")
        }
        // only the person who has the secret key can decode the token
        const decodedTokenInfo = jwt.verify(userToken, process.env.ACCESS_TOKEN_SECRET)
    
        // we defined all these info(like _id etc) to be sent to the token in our user.model file -> generateAccessToken()
        const user = await User.findById(decodedTokenInfo?._id).select("-password -refreshToken")
    


        if(!user) {
            // todo: discuss about frontend
            throw new ApiError(401, "invalid access token")
        }

        
    
        // Passing the acces of the current user - that was our main task - so that we can then use this access to logout that particular user
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }



})