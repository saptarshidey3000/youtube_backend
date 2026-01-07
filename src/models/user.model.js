import mongoose , {Schema} from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

userSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        return next();
    }
     const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
    next();
});

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password,this.password);
};
userSchema.methods.generateAccessToken = function(){
        jwt.sign(
            {
               _id:this._id,
               username:this.username,
               email:this.email,
               fullname:this.fullname,
               avatar:this.avatar
               },
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn:process.env.ACCESS_TOKEN_LIFE}
        );
}
userSchema.methods.generateRefreshToken = function(){
               jwt.sign(
            {
               _id:this._id,

               },
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn:process.env.ACCESS_TOKEN_LIFE}
        );
}

const User = mongoose.model("User", userSchema);

export default User;