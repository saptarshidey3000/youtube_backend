import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) 
=> {
    const token = req.cookies?.accessToken || req.headers
        ("Authorization")?.replace("Bearer ", "") 

        if (!token) {
            throw new ApiError(401, "Unauthorized: No token provided");
        }
        
});

