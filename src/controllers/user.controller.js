import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";



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


//register user
const registerUser = asyncHandler(async (req, res, next) => {

    console.log("CONTENT TYPE:", req.headers["content-type"]);

       console.log("BODY RAW:", req.body);
    console.log("TYPE OF BODY:", typeof req.body);
    console.log("KEYS:", Object.keys(req.body || {}));

    console.log("fullname:", JSON.stringify(req.body?.fullname));
    console.log("username:", JSON.stringify(req.body?.username));
    console.log("email:", JSON.stringify(req.body?.email));
    console.log("password:", JSON.stringify(req.body?.password));

    console.log("FILES:", req.files);

    const fullname = req.body?.fullname;
    const username = req.body?.username;
    const email = req.body?.email;
    const password = req.body?.password;

  if (
  !fullname?.trim() ||
  !username?.trim() ||
  !email?.trim() ||
  !password?.trim()
) {
  throw new ApiError(400, "All fields are required");
}

    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        throw new ApiError(409, "User already exists with this email or username");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverimageLocalPath = req.files?.coverimage?.[0]?.path;

    if (!avatarLocalPath || !coverimageLocalPath) {
        throw new ApiError(400, "Avatar and cover image are required");
    }

    const avatarUrl = await uploadToCloudinary(avatarLocalPath);
    const coverimageUrl = await uploadToCloudinary(coverimageLocalPath);

    if (!avatarUrl || !coverimageUrl) {
        throw new ApiError(500, "Failed to upload images to cloudinary");
    }

    const newUser = await User.create({
        fullname,
        avatar: avatarUrl.secure_url,
        coverimage: coverimageUrl.secure_url,
        email,
        username: username.toLowerCase(),
        password
    });

    const createdUser = await User.findById(newUser._id)
        .select("-password -refreshTokens");

    if (!createdUser) {
        throw new ApiError(500, "Failed to create user");
    }

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
                            accessToken,
                            refreshToken
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


export { registerUser, loginUser , logoutUser};