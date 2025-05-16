import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (localFilePath) => {
try{
if(!localFilePath) return "File is not uploaded correctly";
const response = await cloudinary.uploader.upload(localFilePath,{
    resource_type:"auto"
})
//File has been uploaded successful 
console.log("File is uploaded on cloudinary",response);
console.log("/n response url is here",response.url);
return response;
}catch(error ){
    fs.unlinkSync(localFilePath) // remove the locally file saved temporary
    console.log("Error occur",error)
}

}

export default uploadCloudinary;