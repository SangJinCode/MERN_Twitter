import express from "express";
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import connectMongoDB  from "./db/connectMogoDB.js";
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT

// to parse req.body, limit shouldn't be too high to prevent DOS, 바디 사이즈 제어
app.use(express.json({ limit: "5mb"})); 
app.use(express.urlencoded({extended: true}));//to parse from data(urlencoded)

app.use(cookieParser()); //middleware protectRoute에서 cookie로 부터 jwt를 parse 할때 사용

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// app.get("/", (req, res) => {
//     res.send("Server is ready");
// });

app.listen(PORT, () => {
    console.log(`Sever is running on port ${PORT}`)
    connectMongoDB();
});