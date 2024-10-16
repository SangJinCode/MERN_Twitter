import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js"

export const signup = async (req, res) => {
    try {
        const { fullName, username, email, password} = req.body;
        console.log(fullName, username, email, password)

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)) {
            return res.status(400).json({error: "Invalid email format"});
        }

        const existingUser = await User.findOne({ username })
        if(existingUser) {
            return res.status(400).json({ error: "Username is already taken" });
        }
        const existingEmail = await User.findOne({ email })
        if(existingEmail) {
            return res.status(400).json({ error: "Email is already taken" });
        }
        if(password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }

        //hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //DB에 저장하기위해 res에서 추출한 fullName, username, email, password을 인자로 model User의 객체인 newUser생성
        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword
        })
        console.log("$$newUser$$",newUser)

        if (newUser) {
            //token 생성 함수 호출
            generateTokenAndSetCookie(newUser._id, res)

            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                followers: newUser.followers,
                following: newUser.following,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg,         
            })
        } else {
            return res.status(400).json({ error: "Invaild user data" });
        }

    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const login = async (req,res) => {
     try {
        const {username, password} = req.body;
        const user = await User.findOne({username});
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        if(!user || !isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        //JWT token 생성 및 res.cookie에 주입
        generateTokenAndSetCookie(user._id, res)
        
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg,         
        })

    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    } 
};

export const logout = async (req,res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    } 
};

export const getMe = async (req, res) => {
    try {
        //"-password"를 사용하면 pasword는 제외하고 전달
        //req.user._id는 middleware인 protectRoute() 로부터 검증 후 전달 받은 것이다.
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getMe controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};