import { Router } from "express"
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"

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
    ])
    , registerUser);

export default router;