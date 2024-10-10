import mongoose, {Schema} from "mongoose";

const subsriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId,          // one who is subscribing
            ref: "User"
        },
        channel: {
            type: Schema.Types.ObjectId,           // one to whom the user is subscribing
            ref: "User"
        }
}, {timestamps: true})

export const Subscription = new mongoose.model("Subscription", subsriptionSchema);