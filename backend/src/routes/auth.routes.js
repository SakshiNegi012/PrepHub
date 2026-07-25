import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const authrouter = Router();

//POST /api/auth/register
authrouter.post("/register", authController.register);

//POST /api/auth/login
authrouter.post("/login", authController.login);

// GET /api/auth/get-me
authrouter.get("/get-me", authController.getMe);

// GET/api/auth/refresh-token
authrouter.get("/refresh-token", authController.refreshToken);

//get /api/auth/logout
authrouter.get("/logout", authController.logout);

 //get /api/auth/logout-all
authrouter.get("/logout-all", authController.logoutAll); 

//get /api/auth/verify-email
authrouter.get("/verify-email", authController.verifyEmail);
authrouter.post("/verify-email", authController.verifyEmail);

export default authrouter;