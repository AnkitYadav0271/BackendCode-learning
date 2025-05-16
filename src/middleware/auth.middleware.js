import { User } from "../models/user.models.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandles.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async(req,res,next)=>{
 try {
   const token =    req.cookies?.accessTokens || req.header("Authorization")?.replace("Bearer ",""); 
   if(!token){
      throw new ApiError (401,"Unauthorized request");
   }
   const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET )
     
   const user =  await User.findById(decodedToken?._id).select(
      "-password"
     );
  
     if(!user){
        throw new ApiError(401,"Invalid access token")
     }
     req.user = user;
     next()
 } catch (error) {
   throw new ApiError(401,error?.message||"Invalid actions");
 }
})