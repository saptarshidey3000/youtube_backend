import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";

// ✅ DEBUG (add this at TOP — just for testing)
console.log("ENV CHECK:");
console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API_KEY:", process.env.CLOUDINARY_API_KEY);
console.log("API_SECRET:", process.env.CLOUDINARY_API_SECRET);

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

    return result;

  } catch (error) {
    console.error("Cloudinary Error:", error);
    throw error;
  }
};