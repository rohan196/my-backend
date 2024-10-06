import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import {ApiResponse} from '../utils/ApiResponse.js'

import {User} from '../models/user.model.js';

import {uploadOnCloudinary} from '../utils/cloudinary.js'

const registerUser = asyncHandler( async (req, res) => {
    // get user data from frontend/postman
    // validation - not empty
    // check if user already exists: username, email
    // cheack for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response-res

    // User details - get
    const {fullName, email, username, password} = req.body;         // destructuring the data 
    console.log("email: ", email);

    // validation
    if(
        [fullName, email, username, password].some((field) => field?.trim()==="")       // checks for all - if any one is empty - returns true
    ) {
        throw new ApiError(400, "all fields are required")
    }                                                                                   // add rules for whatever you want - like eamail should contain @

    // Checking if User exists
    const existedUser = User.findOne({
        $or: [{username}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // check for images/avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload on cloudinary - await cuz it might take time
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    // entry in database
    const user = await User.create({
        fullName, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",          // cover image is not compulsary
        email,
        password, 
        username: username.toLowerCase()
    })

    // check user was made and remove the password and token - all data will come as response except these two fields    
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while creating the user")
    }

    // return response/res
    // using ApiResponse for an organised way fro response
    return res.status(201).json(new ApiResponse(200, createdUser, "User registered Successfully"))

})   

export {registerUser}