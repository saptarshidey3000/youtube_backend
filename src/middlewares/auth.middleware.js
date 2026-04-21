import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js"; // (not used here, but kept for consistency)
import  asyncHandler  from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import User  from "../models/user.model.js"; // make sure this import exists

// Middleware to verify JWT token
export const verifyJWT = asyncHandler(async (req, res, next) => {
    
    try {
        // 🔹 STEP 1: Extract token from request
        // We try to get token from:
        // 1. Cookies (if stored in browser cookies)
        // 2. Authorization header (if sent manually via frontend/Postman)

        const token = 
            req.cookies?.accessToken || // from cookies
            req.header("Authorization")?.replace("Bearer ", ""); // from headers

        // 🔹 STEP 2: If no token found → reject request
        if (!token) {
            throw new ApiError(401, "Unauthorized: No token provided");
        }

        // 🔹 STEP 3: Verify the token using secret key
        // This checks:
        // ✔ Is token valid?
        // ✔ Is token expired?
        // ✔ Was it signed with correct secret?

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        // 🔹 STEP 4: Get user from database using ID from token
        // decodedToken contains payload like: { _id: "userId" }

        const user = await User.findById(decodedToken?._id)
            .select("-password -refreshToken"); // exclude sensitive fields

        // 🔹 STEP 5: If user not found → reject request
        if (!user) {
            throw new ApiError(401, "Unauthorized: User not found");
        }

        // 🔹 STEP 6: Attach user to request object
        // So next middleware/route can access logged-in user

        req.user = user;

        // 🔹 STEP 7: Move to next middleware or controller
        next();

    } catch (error) {

        // 🔹 STEP 8: Handle all errors (invalid token, expired, etc.)
        throw new ApiError(401, error.message || "Unauthorized");
    }
});