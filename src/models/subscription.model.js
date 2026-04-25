import mongoose , {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // User who subscribes
        ref: "User",
    },
    channel : {
        type: Schema.Types.ObjectId, // User being subscribed to
        ref: "User",
    }
}, 
{timestamps: true})


export default mongoose.model("Subscription", subscriptionSchema);