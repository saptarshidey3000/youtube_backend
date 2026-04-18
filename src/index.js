import dotenv from "dotenv";
dotenv.config(); // no path needed

import app from "./app.js";
import connectDB from "./db/index.js";

connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.error("Error connecting to the database", err);
    throw err;
});