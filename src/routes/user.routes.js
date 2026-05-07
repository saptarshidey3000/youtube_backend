import { Router } from "express";
import { registerUser,
         loginUser , 
         logoutUser ,
          refreshAccessToken ,
          changePassword, 
          getCurrentUser, 
          updateUserDetails, 
          updateAvatar, 
          updateCoverImage, 
          getUserChannelDetails,
          getWatchHistory } from "../controllers/user.controller.js";
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

//change password route
router.post("/change-password",verifyJWT, changePassword);

//get current user 
router.get("/current", verifyJWT, getCurrentUser);

//update details route
router.route("/update-account").patch(verifyJWT, updateUserDetails);

//update avatar route
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);

//update cover image route
router.route("/update-cover-image").patch(verifyJWT, upload.single("coverimage"), updateCoverImage); 

//get channel details route
router.route("/c/:username").get(verifyJWT, getUserChannelDetails);

//get watch history route
router.route("/watch-history").get(verifyJWT, getWatchHistory);

 export default router; 