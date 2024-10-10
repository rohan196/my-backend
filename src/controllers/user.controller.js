import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import mongoose from 'mongoose';

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        // console.log(accessToken)
        const refreshToken = user.generateRefreshToken()
        // console.log(refreshToken)

        // The refresh token needs to be saved to the database to validate through it without password everytime
        user.refreshToken = refreshToken
        // if we save - the user model will kick in and will need password - to avoid that
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
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
    const { fullName, email, username, password } = req.body;         // destructuring the data 
    // console.log("email: ", email);

    // validation
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")       // checks for all - if any one is empty - returns true
    ) {
        throw new ApiError(400, "all fields are required")
    }                                                                                   // add rules for whatever you want - like eamail should contain @

    // Checking if User exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // check for images/avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // const coverImageLocalPath = res?.files?.coverImage?.[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required | multer")
    }
    // if(!coverImageLocalPath) {
    //     throw new ApiError(400, "Cover Image file is required | multer")
    // }

    // console.log(avatarLocalPath);

    // upload on cloudinary - await cuz it might take time
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);       // if not sent - returns an empty string


    if (!avatar) {
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

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating the user")
    }

    // return response/res
    // using ApiResponse for an organised way fro response
    return res.status(201).json(new ApiResponse(200, createdUser, "User registered Successfully"))

})

const loginUser = asyncHandler(async (req, res) => {
    // req body - data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    // accepting data
    const { username, email, password } = req.body
    // ye check krna - i think && aayega, he said abhi atleast || aayega
    // i thought right but different approach, pinned comment - a reply said the same as me
    // if(!username || !email) {
    // if(!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
    // }
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    // Find either email or username
    const user = await User.findOne({
        $or: [{ username }, { email }]                                  // mongodb operators
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // found the user, now we have to check the password
    // we have a fubction made isPasswordCorrect in user model where we do bcrypt compare and it returns booloean
    // we'll use "user" - to add functions remember, don;t use User
    const passwordMatched = await user.isPasswordCorrect(password)

    if (!passwordMatched) {                                      // will enter when value is false - not false is true
        throw new ApiError(401, "Invalid User Credentials")
    }

    // generating access token and refresh token from the function we defined above
    // console.log(user._id) 

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // console.log(accessToken, refreshToken)

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

const refreshAccessToken = asyncHandler(async (req, res) => {
    // making a controller for the consition when our access token is expired and instead of asking for creadentials again, the user hits an endpoint to match the refresh token from the user(as it is long lived) to the refresh token stored in the database, this is like a pseudo login, it will then update the access and refresh token too

    // incoming cuz the frontend is sending it 
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized access")
    }

    try {
        // the RT that the user has is encrypted, not the same as the one saved on the db, so we have to jwtverify
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        // in the decoded refresh token we have the user id that we passed when defining the generateRefreshToken
        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        // conpare the incoming and the db refresh token
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        // generating new tokens
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    // We get the option to change password only when you are logged in - we can check by verifyjwt midlleware
    const { oldPassword, newPassword } = req.body

    // And if we are logged in, we'll also get the access to the user from the verifyjwt middleware
    const user = await User.findById(req.user?._id);

    // we made the isPasswordCorrect function in user.model for login - true/false
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    // save hone se pehle pre chalega- defined in user.model - hashes the password before saving 
    user.password = newPassword
    // we don't need to validate the other fields
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(400, {}, "Password changed successfully")
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    // this is for the logged in user - through verify jwt we'll get the current user in req.user
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!(fullName || email)) {
        throw new ApiError(404, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,                                        // see if it'll be ._id: he wrote .id - yes corrected
        {
            $set: {
                fullName,                                     // use any one of these two ways
                email: email
            }
        },
        { new: true }
    ).select("-password")                                      // we don't wanna send/res the password to the user         

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account Details Uldated Successfully"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {

    // we get this res.file from multer, and user access from verifyjwt
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    
    if(!avatar.url) {
        throw new ApiError(400, "Error while uploading on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {avatar: avatar.url}
        },
        {new: true}
    ).select("-password")

    res.send
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))

})

const updateUserCoverImage = asyncHandler(async (req, res) => {

    // we get this res.file from multer, and user access from verifyjwt
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }
    
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {coverImage: coverImage.url}
        },
        {new: true}
    ).select("-password")

    res.send
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"))

})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    
    // we get the channel detail and the channel page when we search for the specific channel - so, we'll retrieve it from the url
    const {username} = req.params

    // check for the username and also then trimming it
    if(!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            // First Pipeline
            // we'll match first to find the user with that specific username
            $match: {
                username: username?.toLowerCase()
            }
            // now we have that specific user and then we'll lookup the subscribers and data
        },
        {
            // Get the number of subscribers this user - by looking up only the documents with this channel name, then we'll count them, we'll add a "subscribers field referencing the "subscriptions" model 
            $lookup: {
                from: "subscriptions",               // cuz in the db, model name will be changed to lowecase and plural
                localField: "_id",
                foreignField: "channel",            // We have to select the channel to get the subscribers - channel document
                as: "subscribers"                   // name of the output array
            }
        },
        {
            // Here we are doing the reverse and finding the channels this user has subscribed
            $lookup: {
                from: "subscriptions",               // cuz in the db, model name will be changed to lowecase and plural
                localField: "_id",
                foreignField: "subscriber",            // We have to select the channel to get the subscribers - channel document
                as: "subscribedTo"
            }
        },
        {   
            // to add these fields in the user model, we are also counting the numbers in those two fiwlds
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"       // add all the documents in the field we created: subscribers ($ is used for fields)
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"       
                },
                isSubscribed: {
                    $cond: {
                        // The user who is logged in, his id is searched in the subscribers fiels of this specific channel, if it is, then subscribed
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},      // subscribers is the field we created, subscriber is the field in subscriptions model
                        then: true,
                        else: false
                    }
                }
            }
            
        },
        {   
            // the specific value we need to send/project - in the profile section we'll need specific ones only
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                // send created At too - through timestamps
            }
        }
    ])

    // console.log(channel)

    if(!channel?.length) {
        throw new ApiError(404, "Channel does not exist")
    }

    // AP return an array of objects

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")        // we return the first object in te array we have here
        )

})

const getWatchHistory = asyncHandler(async(req, res) => {
    // User refrences videos in the watch history and those specific videos have their share of owner(users), so we have to use mongoDb aggregation
    const user = await User.aggregate([
        {
            $match: {
                // mongoose gives an object for the id, so we make userid as aggregation pipelines directly deal wit mongoDb
                _id: new mongoose.Types.ObjectId(req.user._id),
                // _id: new mongoose.Types.ObjectId.createFromHexString(req.user._id), check this if error occurs
            }
        }, {
            $lookup: {
                from: "videos",                     // whicdb/model to refer
                localField: "watchHistory",         // name of the field in the current model - user
                foreignField: "_id",                // name of the field in the refered model
                as: "watchHistory",                 // name of the output array
                pipeline: [                         
                    {   
                        // to get the owners details we have to use sub 
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "-id",
                            as: "owner",
                            pipeline: [
                                // to ask for only specific data from the user document model
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {               // for the easy fetching from the frontend we are just extracting the first element that will give us the specific user details like owner[0], that is added to the already existing field owner                        
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]                                    
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            user[0].watchHistory
            "Watch History fetched Successfully"
        )
    )

})





export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} 