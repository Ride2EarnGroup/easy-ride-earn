import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import {jwtVerify} from "../middleware/auth.middleware.js"

const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        }
    ]),
    registerUser
)
router.route('/login').post(loginUser)
router.route('/logout').post(jwtVerify,logoutUser)
router.route('/refresh-token').post(jwtVerify,refreshAccessToken)

export default router;
