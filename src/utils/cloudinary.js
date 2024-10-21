import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

import dotenv from 'dotenv'

dotenv.config()

    const value = cloudinary.config({                   // did const value = -> to check whether .env is loading
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // console.log(vslue)

    const uploadOnCloudinary = async (localFilePath) => {   
        try {
            if (!localFilePath) return null     // Multer uploads on local server and we are using that path - to upload on cloudinary server
            // Upload the file on Cloudinary
            const response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto"
            })
            // file has been uploaded succesfully
            // console.log("File is uploaded on the cloudinary", response.url)
            fs.unlinkSync(localFilePath)                        // Remove the locally saved primary file as the upload operation got failed
            return response;
        } catch (error) {
            fs.unlinkSync(localFilePath)                        // Remove the locally saved primary file as the upload operation got failed
            console.log("Can't upload image on cloudinary")
            return null
        }
    }

    const deleteOnCloudinary = async (public_id, resource_type="image") => {
        try {
            if (!public_id) return null;
    
            //delete file from cloudinary
            const result = await cloudinary.uploader.destroy(public_id, {
                resource_type: `${resource_type}`
            });
        } catch (error) {
            return error;
            console.log("delete on cloudinary failed", error);
        }
    };
    
    export { uploadOnCloudinary, deleteOnCloudinary };
