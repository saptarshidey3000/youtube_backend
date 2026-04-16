import asyncHandler from "../utils/asyncHandler.js";
import {Apierror} from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
    //get user details from request body
    //valdation - not empty 
    // check if user already exists : username or email
    //check for image , check for avatar 
    //upload image to cloudinary and get url
    //create user in database - create entry in db 
    //remove password and refresh token field from response 
    //check for user creation success and send response
    //return res 
    const { username, email, fullname, password } = req.body;
    console.log("email:",email);

    if(fullname === "" || email === "" || password === "" || username === ""){
        throw new Apierror("All fields are required",400);
    }

    const existingUser = User.findOne({
         $or: [{ email }, { username }] 
        })
    if(existingUser){
        throw new Apierror("User already exists with this email or username",409);
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverimageLocalPath = req.files?.coverimage[0]?.path;

    if(!avatarLocalPath || !coverimageLocalPath){
        throw new Apierror("Avatar and cover image are required",400);
    }
    //upload to cloudinary and get url
    const avatarUrl = await uploadToCloudinary(avatarLocalPath);
    const coverimageUrl = await uploadToCloudinary(coverimageLocalPath);

    if(!avatarUrl || !coverimageUrl){
        throw new Apierror("Failed to upload images to cloudinary",500);
    }

    const newUser = await User.create({
        fullname,
        avatar: avatarUrl.secure_url,
        coverimage: coverimageUrl.secure_url,
        email,
        username: username.toLowerCase(),
        password
    });

});

export { registerUser };