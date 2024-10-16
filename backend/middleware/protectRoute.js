import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const protectRoute = async ( req, res, next) => {
    try {
        //token이 있는지 확인
        const token = req.cookies.jwt;
        console.log(token)
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No Token Provided"});
        }

        //token이 있으면 secret key를 사용해 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ error: "Unauthorized: Invalid Token"});
        }

        //decoded된 data의 userId를 사용해 DB에 해당 유저가 있는지 확인
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        req.user = user;
        
        //next() 메서드를 사용하면 순서대로 protectRoute()를 실행하고 완료되면 다음 함수인 getMe()를 실행한다.
        next();

    } catch (error) {
        console.log("Error in protectRoute middleware", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};