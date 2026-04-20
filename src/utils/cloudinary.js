import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // ✅ add this

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ (optional but good practice)
export { cloudinary };

export const uploadToCloudinary = async (filePath, folder = "uploads") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      folder,
    });

    // ✅ DELETE local file after successful upload
    fs.unlinkSync(filePath);

    return result;

  } catch (error) {
    console.error("Cloudinary Error:", error);

    // ✅ ALSO delete file if upload fails (cleanup)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    throw error;
  }
};