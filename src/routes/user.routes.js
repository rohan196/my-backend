import { Router } from "express"
import { registerUser, loginUser, logoutUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// router.route("/register").post(registerUser);
// injected the multer middleware for accepting and storing the files before registering the user
// .fields -> to accept multiple fields - avatar & coverImage
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)


router.route("/login").post(loginUser)

//secured routes - needing credentials/access 
// logoutUser run hone se pehle we need to run our middleware to get the access
router.route("/logout").post(verifyJWT, logoutUser)



export default router;