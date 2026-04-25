import { Router } from "express";
import { registerUser, loginUser , logoutUser , refreshAccessToken } from "../controllers/user.controller.js";
import {upload}from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverimage", maxCount: 1 },
  ]),
  registerUser
);

router.post("/login", loginUser);

//secured routes
router.post("/logout", verifyJWT, logoutUser);
//refresh token route
router.post("/refresh-token", verifyJWT, refreshAccessToken);

 export default router; 