import { Router } from "express";
import { registerUser, loginUser , logoutUser } from "../controllers/user.controller.js";
import {upload}from "../middlewares/multer.middleware.js";
import { verify } from "jsonwebtoken";
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

 export default router; 