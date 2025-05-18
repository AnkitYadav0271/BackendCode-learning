import { Router } from "express";
import {
    loginUser,
    logOutUser,
    registerUser,
    refreshAccessToken,
    changePassword,
    getWatchHistory,
    getCurrentUser,
    updateProfileDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {name:"avatar"
        ,maxCount:1},
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser);

    router.route('/login').post(loginUser);

    //secured routes 

    router.route("/logout").post(verifyJWT,logOutUser);
    router.route("/refresh-token").post(refreshAccessToken);
    router.route("/change-password").post(verifyJWT,changePassword);
    router.route("/watch-history").post(verifyJWT,getWatchHistory);
    router.route("/current-user").get(verifyJWT,getCurrentUser);
    router.route("/update-details").patch(verifyJWT,updateProfileDetails);

    router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);
    router.route("/coverImage").patch(verifyJWT,uplode.single("coverImage"),updateUserCoverImage)

    router.route("/c/:username").get(verifyJWT,getUserChannelProfile);