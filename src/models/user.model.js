import mongoose , {Schema} from "mongoose";

const userSchema = new Schema({
   username:{
        type:String,    
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        index:true
   } ,
   email:{
        type:String,    
        required:true,
        unique:true,
        trim:true,
        lowercase:true
   },
   fullname:{
        type:String,    
        required:true,
        trim:true,
        index:true
   } ,
   avatar:{
        type:String, //cloudinary url   
        trim:true,
        required:true,
   },
   coverimage:{
        type:String, //cloudinary url   
   },
   watchhistory:[
    {
        type:Schema.Types.ObjectId,
        ref:"Video"
    }
   ],
   password:{
        type:String,    
        required:[true,'Password is required'],
   },
   refreshTokens:[
    {
        type:String,
    }
   ]
},
{timestamps:true});

const User = mongoose.model("User", userSchema);

export default User;