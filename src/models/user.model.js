import mongoose, {Schema} from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true         // To make this easily searchable
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true 
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        avatar: {
            type: String,           // Cloudinary url
            required: true,
        },
        avatar: {
            type: String,
        },
        watchHitory: [
            {
            type: Schema.Types.ObjectId,
            ref: "Video"
            }
        ],
        //Hashing will be done
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        refreshToken: {
            type: String
        }  
    }, 
    {
        timestamps: true
    }
)

// Mongoose middlewares - Hashing Password
userSchema.pre("save", async function (next) {
    // Only hash the password when password is passed, if not, return and pass to the next middleware
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)  // Rounds/Salt is passed - Read about it more
    next();
})

// Custom method for checking the password
userSchema.methods.isPasswordCorrect = async function(password) {
    //comparing the password entered and encrypted password - returns boolean value
    return await bcrypt.compare(password, this.password)
} 

// Genrating Access Token
userSchema.methods.generateAccessToken = function() {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    )
} 

// Generating Refresh Token
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
} 

export const User = mongoose.model("User", userSchema);