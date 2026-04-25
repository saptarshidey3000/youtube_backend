import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";



//generate access token and refresh token

const generateAccessAndRefreshTokens = async (userId) => {

    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken=refreshToken;
        // save refresh token in database
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Failed to generate tokens");
    }

}


// ==============================
// REGISTER USER CONTROLLER
// ==============================

const registerUser = asyncHandler(async (req, res, next) => {

    // 🔹 DEBUG LOGS (for development only)
    console.log("CONTENT TYPE:", req.headers["content-type"]);
    console.log("BODY RAW:", req.body);
    console.log("TYPE OF BODY:", typeof req.body);
    console.log("KEYS:", Object.keys(req.body || {}));

    console.log("fullname:", JSON.stringify(req.body?.fullname));
    console.log("username:", JSON.stringify(req.body?.username));
    console.log("email:", JSON.stringify(req.body?.email));
    console.log("password:", JSON.stringify(req.body?.password));

    console.log("FILES:", req.files);


    // 🔹 STEP 1: Extract data from request body
    const fullname = req.body?.fullname;
    const username = req.body?.username;
    const email = req.body?.email;
    const password = req.body?.password;


    // 🔹 STEP 2: Validate required fields
    // Ensure no field is empty or just spaces
    if (
        !fullname?.trim() ||
        !username?.trim() ||
        !email?.trim() ||
        !password?.trim()
    ) {
        throw new ApiError(400, "All fields are required");
    }


    // 🔹 STEP 3: Check if user already exists
    // Match either email OR username
    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        throw new ApiError(409, "User already exists with this email or username");
    }


    // 🔹 STEP 4: Get uploaded file paths (from multer)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverimageLocalPath = req.files?.coverimage?.[0]?.path;


    // 🔹 STEP 5: Validate file uploads
    if (!avatarLocalPath || !coverimageLocalPath) {
        throw new ApiError(400, "Avatar and cover image are required");
    }


    // 🔹 STEP 6: Upload files to Cloudinary
    const avatarUrl = await uploadToCloudinary(avatarLocalPath);
    const coverimageUrl = await uploadToCloudinary(coverimageLocalPath);


    // 🔹 STEP 7: Check if upload was successful
    if (!avatarUrl || !coverimageUrl) {
        throw new ApiError(500, "Failed to upload images to cloudinary");
    }


    // 🔹 STEP 8: Create user in database
    const newUser = await User.create({
        fullname,
        avatar: avatarUrl.secure_url,
        coverimage: coverimageUrl.secure_url,
        email,
        username: username.toLowerCase(), // normalize username
        password
    });


    // 🔹 STEP 9: Fetch created user (exclude sensitive fields)
    const createdUser = await User.findById(newUser._id)
        .select("-password -refreshToken");


    // 🔹 STEP 10: Safety check
    if (!createdUser) {
        throw new ApiError(500, "Failed to create user");
    }


    // 🔹 STEP 11: Send response
    return res.status(201).json(
        new ApiResponse(
            201,
            "User registered successfully",
            createdUser
        )
    );
});

//login user
const loginUser = asyncHandler(async (req, res) => {
        //req body --> data

        const {email, username, password} = req.body;

        // username or email
        
        if(!email || !password) {
            throw new ApiError(400, "Email and password are required");
        }
        // find the user 
        const user = await User.findOne({
            $or: [{ email }, { username }]
        });
        // if user not found --> error
        if(!user) {
            throw new ApiError(404, "User not found");
        }
        // if user found --> compare password
        const isMatch = await user.comparePassword(password);
        // if password not match --> error
        if(!isMatch) {
            throw new ApiError(401, "Invalid credentials");
        }
        // if password match --> generate access token and refresh token
        const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);
        // send access token and refresh token to client (cookie or response body)
        const loggedInUser = await User.findById(user._id).
        select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure : true,
        }
        return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json(
                    new ApiResponse(
                        200,
                        {
                            user: loggedInUser,
                            accessToken
                        
                        },
                        "User logged in successfully"
                    )
                );

});


//logout user
const logoutUser = asyncHandler(async (req, res) => {

    // 🔹 STEP 1: Remove refresh token from database
    // We find the logged-in user using req.user._id (comes from verifyJWT middleware)
    // Then we set refreshToken = undefined (basically deleting it)

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        {
            new: true, // returns updated document (not really needed here, but okay)
        }
    );

    // 🔹 STEP 2: Define cookie options
    // httpOnly → frontend JS cannot access cookies (security)
    // secure → cookie only sent over HTTPS (important in production)

    const options = {
        httpOnly: true,
        secure: true,
    };

    // 🔹 STEP 3: Clear cookies from browser
    // We remove both:
    // ✔ accessToken (short-lived token)
    // ✔ refreshToken (long-lived token)

    return res
        .status(200) // success status
        .clearCookie("accessToken", options)   // remove access token cookie
        .clearCookie("refreshToken", options)  // remove refresh token cookie

        // 🔹 STEP 4: Send success response
        .json(
            new ApiResponse(
                200,
                null,
                "User logged out successfully"
            )
        );
});


//refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    // 🔹 STEP 1: Get refresh token from cookies
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    // 🔹 STEP 2: Validate refresh token presence
    if (!incomingRefreshToken) {
        throw new ApiError(400, "Refresh token is required");
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
        // 🔹 STEP 3: Find user by ID from decoded token
        const user = await User.findById(decodedToken?._id);
    
        // 🔹 STEP 4: Validate user existence and token match
        if (!user || user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }
        // 🔹 STEP 5: Generate new access token
        const {accessToken,newRefreshToken} =   await generateAccessAndRefreshTokens(user._id);
    
        // 🔹 STEP 6: Send new access token in response
        const options = {
            httpOnly: true,
            secure: true,
        };
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
                    "Access token refreshed successfully"
                )
            );
    
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token");
    }

    
});


//change user password
  const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Find the user in the database
    const user = await User.findById(req.user?._id);

    //check password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      throw new ApiError(401, "Current password is incorrect");
    }

    // Update the user's password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Password changed successfully"
      )
    );
    
  });

  //get current user details
  const getCurrentUser = asyncHandler(async (req, res) => {
    // const user = await User.findById(req.user?._id)
    //     .select("-password -refreshToken");
    // if (!user) {
    //     throw new ApiError(404, "User not found");
    // }
    return res.status(200).json(
        new ApiResponse(
            200,
            req.user,
            "Current user details fetched successfully"
        )
    );
  });

  //update user details (fullname, username, email))

  const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullname, username, email } = req.body;
    if(!fullname || !username || !email) {
        throw new ApiError(400, "Fullname, username and email are required");
    }
    
    const user = User.findByIdAndUpdate(
        req.user._id,
        {   
          $set: {
            fullname,
            username,
            email
          }
        } ,
        { new: true }
    ).select("-password ");

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "User details updated successfully"
        )
    );
  
    const updateData = {};  
  });

  //update avatar 
  const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }
    const avatarUrl = await uploadToCloudinary(avatarLocalPath);
    if (!avatarUrl) {
        throw new ApiError(500, "Failed to upload avatar to cloudinary");
    }
    const user  =  await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { avatar: avatarUrl }
        },
        { new: true }
    ).select("-password ");
    return res.status(200).json(
        new ApiResponse(
            200,    
            user,
            "Avatar updated successfully"
        )
    );
  });

  //update cover image
  const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is required");
    }   
    const coverImageUrl = await uploadToCloudinary(coverImageLocalPath);
    if (!coverImageUrl) {
        throw new ApiError(500, "Failed to upload cover image to cloudinary");
    }
    const user  =  await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { coverimage: coverImageUrl }
        },
        { new: true }
    ).select("-password ");
    return res.status(200).json(
        new ApiResponse(
            200,    
            user,
            "Cover image updated successfully"
        )
    );
  });

  //delete user account


export { registerUser, 
        loginUser , 
        logoutUser,
        refreshAccessToken,
        changePassword,
        getCurrentUser,
        updateUserDetails,
        updateAvatar,
        updateCoverImage
        };