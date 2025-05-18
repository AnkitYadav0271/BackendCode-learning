
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

//* Change password is going to start here

export const changePassword = asyncHandler(async (req,res)=>{
  const {oldPassword, newPassword} = req.body;
  const user =  await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
      throw new ApiError(400, "invalid old password");
  }
      user.password = newPassword;
     await user.save({validateBeforeSave: false})
      return res.status(200)
          .json(new ApiResponse(200,{},"password changed successfully"))



})

//*get current user starts here

export const getCurrentUser = asyncHandler(async (req,res)=>{
    return res.status(200)
        .json(200,req.user,"Current user fetched successfully")
})

//* update account detail starts here

export const updateProfileDetails = asyncHandler(async (req,res)=>{
    const {fullName , email} = req.body;

    if (!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }

  User.findByIdAndUpdate(req.user?._id,
      {
          $set:{
              fullName,
              email,

          }
      },
      {new : true}).select("-password");

    return res.status(200)
        .json(new ApiResponse(200,{},"Profile updated successfully"))
})

//user Avatar update is going here to be written

export  const updateUserAvatar = asyncHandler(async (req,res)=>{
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadCloudinary(avatarLocalPath);
    if (!avatar.url){
        throw  new ApiError(400, "Error while uploading avatar");
    }

   const user = await User.findByIdAndUpdate(req.user._id,
        {avatar : avatar.url},
        {new: true}).select("-password")
    return res.status(200)
        .json(new ApiResponse(200,user, "Avatar Upadated successfully"))
})

//user Cover Image update is going here to be written

export const updateUserCoverImage = asyncHandler(async (req,res)=>{
    const coverImgLocalPath = req.file?.path
    if (!coverImgLocalPath){
        throw new ApiError(400, "cover Image file is missing");
    }

    const coverImg = await uploadCloudinary(avatarLocalPath);
    if (!coverImg.url){
        throw  new ApiError(400, "Error while uploading Cover Image");
    }

  const user =  await User.findByIdAndUpdate(req.user._id,
        {coverImage : coverImg.url},
        {new: true}).select("-password")
    return res.status(200)
        .json(new ApiResponse(200,user,"CoverImage update successfully"))
})

//user profile starts here

export const getUserChannelProfile = asyncHandler(async (req,res)=>{
    const {username} = req.params;
    if (!username?.trim()){
        throw new ApiError(400,"usermame is missing")
    }

   // User.find({username})
 const channel = await  User.aggregate([{
     $match:{
         username:username?.toLowerCase()
     }},{
     $lookup:{
         from:"subscriptions",
         localField: "_id",
         foreignField:"channel",
         as:"subscribers"
     }},
     {
     $lookup:{
         from:"subscriptions",
         localField: "_id",
         foreignField:"channel",
         as:"subscribed"
     }
     },
     {
         $addFields:{
             subscribersCount : {
                 $size: "$subscribers"
             },
             channelIsSubscribedToCount: {
                 $size: "$subscribe"
             },
             isSubscribed:{
                 $cond: {
                     if:{$in:[req.user?._id,"$subscribers.subscribers"]},
                     then:true,
                     else:false
                 }
             }
         }
     },
     {
         $project:{
             fullName:1,
             username:1,
             subscribersCount:1,
             channelIsSubscribedToCount:1,
             avatar:1,
             isSubscribed:1,
             coverImage:1,
         }
     }

 ])

if (!channel?.length){
    throw new ApiError(404,"Channel does not exist");
}

return res.status(200)
    .json(new ApiResponse(200,channel[0]),"User channel fetched successfully")
})



