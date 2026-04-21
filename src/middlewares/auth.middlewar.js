import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) 
=> {
    try {
        const token = req.cookies?.accessToken || req.headers
            ("Authorization")?.replace("Bearer ", "") 
    
            if (!token) {
                throw new ApiError(401, "Unauthorized: No token provided");
            }
            
        const decodedToken = await jwt.verify(token, process.env.
            ACCESS_TOKEN_SECRET)
    
        const user = await User.findById
        (decodedToken?._id).select("-password -refreshToken");
    
        if (!user) {
            throw new ApiError(401, "Unauthorized: User not found");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error.message || "Unauthorized"); 
    }

});


