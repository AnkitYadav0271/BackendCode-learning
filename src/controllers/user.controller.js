
import asyncHandler from "../utils/asyncHandles.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import uploadCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId)=>{
try{
const user = await User.findById(userId);
const accessToken = user.generateAccessToken();
const refreshToken = user.generateRefreshToken();

user.refreshTokens = refreshToken;
await user.save({ validateBeforeSave : false});

return {accessToken , refreshToken};
}catch(error){
    throw new ApiError(500,"Something went wrong while generating refresh and access token");
}
}

export const registerUser =  asyncHandler(async(req, res, next) => {
   //get user details from frontend 
   //validation - not empty
   //check if user already exist : username,email
   //check for Images, check for avatar
   //upload them to cloudinary,avatar
   //create user object- create entry in database
   // remove password and refresh token from the response
   //check for user creation
   //return response
   const { fullName, email, userName, password } = req.body; 
   console.log("Email", email);
   // if(fullName ==="") {
   //     throw new ApiError(400,"full name is required")
   // }
   if (
      [fullName, password, userName, email].some((field) => {
         return field?.trim() === "";
      })
   ) {
      throw new ApiError(400, "All fields are required");
   }
   console.log(userName)

   const userExist= await User.findOne({
    $or:[{userName},{email}]
   });

   if(userExist){
    throw new ApiError(409,"User already exists")
   }
    
   
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required");
  }

const avatarResponse =  await uploadCloudinary(avatarLocalPath);
const coverImage = await uploadCloudinary(coverImageLocalPath);
if(!avatarResponse){
    return new ApiError(405,"avatar not uploaded successfully")
   }
const user = await User.create({
    fullName,
    avatar:avatarResponse.url,
    coverImage: coverImage.url || "",
    email ,
    password,
    userName:userName.toLowerCase()
});
// if(!user){
//     throw new ApiError(409,"user not created in db")
// }
const createdUser = await User.findById(user._id).select(
    "-password -refreshTokens"
)
if(!createdUser) {
    throw new ApiError(500,"Some thing went wrong while registering the user");
}

return res.status(201).json(
    new ApiResponse(200,createdUser,"userRegistered successfully")
);
});


export const loginUser = asyncHandler(async(req,res,)=>{
    //? steps take data from req.body !! req body => data !!
    //check if user exist or not  !! username  or email !!
    //if exist check credentials validity !! password check !!
    // generate access token and refresh token
    // save refresh token db and Respond (Secure cookie ) it to user.
    // Give access token with response also (Refresh + Access token) , don't save
    //Now next time when user wants to login , Get access token (if not expired)
    //if Access token not expired get refresh token from user side
    //if refresh token is not Expired,Generate new access token from user side 
    //if refresh token is also expired then we have to ask user for credentials again

    const {email,userName, password} = req.body;
    if (!userName || !email){
        throw new ApiError(400,"username or email is required");
    }
  const isUser = await     User.findOne(
        {
            $or:[{userName} , {email}]
        }
    )
    if(!isUser){
        throw new ApiError(404,"User not found please register");
    }

   const isPasswordValid = await isUser.isPasswordCorrect(password);

     if(!isPasswordValid){
        throw new ApiError(404,"email or password does not exist");
    }

    const {refreshToken, accessToken} = await generateAccessAndRefreshTokens(isUser._id);

    //Sending the cookies 
  const loggedInUser = await  User.findById(isUser._id).select("-password -refreshTokens");

  const options = {
    httpOnly: true,
    secure : true,
  }

  return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
    new ApiResponse(200,{
        user: loggedInUser , accessToken,refreshToken
    }
   , "user logged in successful"
)
  )

  
}) 


export const logOutUser = asyncHandler (async(req,res)=>{
     User.findByIdAndUpdate(
      req.user._id , {
        $set:{
          refreshTokens: undefined
        }
      },
      {
        new: true
      }
     )
     const options = {
      httpOnly : true,
      secure: true
     }
     return res.status(200).clearCookie("accessToken",options).clearCookie("RefreshTokens")
})

//* refresh Access token starts here

export const refreshAccessToken = asyncHandler(async(req,res)=>{
  

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
      throw new ApiError(401,"unautherised request");
    }
  
   const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
   
   const user = await User.findById(decodedToken?._id);

  if(!user){
    throw new ApiError(401,"invalid refresh token")
  }
   
  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is used or expired")
  }

  const options = {
    httpOnly: true,
    secure: true,
  }

const {accessToken, newRefreshToken } =  await generatedAccessAndRefreshTokens(user._id);

  return res.
  status(200)
  .cookie("accessToken", accessToken)
  .cookie("refreshToken", newRefreshToken)
  .json(
    new ApiRespone(200,{accessToken , newRefreshToken},"AccessToken Refreshed succesfuly")
  )
})