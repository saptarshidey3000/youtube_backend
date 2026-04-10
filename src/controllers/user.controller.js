import asyncHandler from "../utils/asyncHandler.js";


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
});

export { registerUser };