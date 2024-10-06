import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const uploadOnCloudinary = async (localFilePath) => {   
        try {
            if (!localFilePath) return null     // Multer uploads on local server and we are using that path - to upload on cloudinary server
            // Upload the file on Cloudinary
            const cloudinaryresponse = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto"
            })
            // file has been uploaded succesfully
            console.log("File is uploaded on the cloudinary", response.url)
            return cloudinaryresponse;
        } catch (error) {
            fs.unlinkSync(localFilePath)    // Remove the locally saved primary file as the upload operation got failed
            return null
        }
    }

export {uploadOnCloudinary}