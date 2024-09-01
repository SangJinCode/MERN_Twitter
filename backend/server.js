import express from "express";
import authRoutes from "./routes/auth.routes.js"
import connectMongoDB  from "./db/connectMogoDB.js";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT

app.use("/api/auth", authRoutes);

// app.get("/", (req, res) => {
//     res.send("Server is ready");
// });

app.listen(PORT, () => {
    console.log(`Sever is running on port ${PORT}`)
    connectMongoDB();
});