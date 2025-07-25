import  jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import {asyncHandler} from"../utils/asyncHandler.js"


export const jwtVerify= asyncHandler(async(req,_,next)=>{
try {
    const token=req.cookies?.accessToken||
    req.header("Authorization")?.replace("bearer ","");
    if(!token){
      throw new ApiError(401, "Unauthorized request");
    }
    const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    const user= await User.findById(decodedToken?._id).select("-password -refreshToken");
    if(!user){
        throw new ApiError(401, "Invalid Access Token");
    }
    req.user=user;
    next();
    
} catch (error) {
   throw new ApiError(401, error?.message || "Invalid access token");
}
})