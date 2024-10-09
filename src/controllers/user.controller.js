import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import {ApiResponse} from '../utils/ApiResponse.js'

import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js'

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // The refresh token needs to be saved to the database to validate through it without password everytime
        user.refreshToken = refreshToken
        // if we save - the user model will kick in and will need password - to avoid that
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

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
    // console.log("email: ", email);

    // validation
    if(
        [fullName, email, username, password].some((field) => field?.trim()==="")       // checks for all - if any one is empty - returns true
    ) {
        throw new ApiError(400, "all fields are required")
    }                                                                                   // add rules for whatever you want - like eamail should contain @

    // Checking if User exists
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // check for images/avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // const coverImageLocalPath = res?.files?.coverImage?.[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required | multer")
    }
    // if(!coverImageLocalPath) {
    //     throw new ApiError(400, "Cover Image file is required | multer")
    // }

    // console.log(avatarLocalPath);

    // upload on cloudinary - await cuz it might take time
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);       // if not sent - returns an empty string


    if(!avatar) {
        throw new ApiError(400, "Avatar file is required | cloudinary");
    }

    // if(!coverImage) {
    //     throw new ApiError(400, "Cover Image file is required | cloudinary");
    // }


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

const loginUser = asyncHandler(async(req, res) => {
    // req body - data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    // accepting data
    const {username, email, password} = req.body 

    // ye check krna - i think && aayega, he said abhi atleast || aayega
    // i thought right but different approach, pinned comment - a reply said the same as me
    // if(!username || !email) {
    if(!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    // Find either email or username
    const user = await User.findOne({
        $or: [{username}, {email}]                                  // mongodb operators
    })

    if(!user) {
        throw new ApiError(404, "User does not exist")
    }

    // found the user, now we have to check the password
    // we have a fubction made isPasswordCorrect in user model where we do bcrypt compare and it returns booloean
    // we'll use "user" - to add functions remember, don;t use User
    const passwordMatched = await user.isPasswordCorrect(password)

    if(!passwordMatched) {                                      // will enter when value is false - not false is true
        throw new ApiError(401, "Invalid User Credentials")
    }

    // generating access token and refresh token from the function we defined above
    const { accessToken, refreshToken } = generateAccessAndRefreshTokens(user._id)

    //what info to send to the user & the "user" object doesn't have the refresh token (empty) cuz when we made the object of the User, it didn't have that
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    // send the tokens in cookies
    // specifying options for cookie
    const options = {
        httpOnly: true,
        secure: true
    }
    // returning data and cookies to the user
    return res                              // return of login controller
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, {
                user: loggedInUser, accessToken, refreshToken           // if user wants to save the tokens - you can change that
            },
            "User logged in successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req, res) => {
    // we can access the req.user that is defined in the auth.middleware and passed as a middleware in the "/logout" route
    //clearing the refresh token from the database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {                              // mongodb operator to update the values
                refreshToken: undefined
            }                  
        },
        {
            new: true                           // the response that is given now will be the new updated values
        }

    ) 
    
    // clearing the refresh token from the cookies too
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"))
})

export {
    registerUser,
    loginUser, 
    logoutUser
}