import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

import bcrypt from "bcryptjs";
//
import { v2 as cloudinary} from "cloudinary";

export const getUserProfile = async (req, res) => {
    const { username} = req.params;

    try {
        const user = await User.findOne({ username}).select("-password");
        if (!user) return res.status(404).json({message: "User not found"});

        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getUserProfile:", error.message)
        res.status(500).json({error: error.message});
    }
};

export const followUnfollowUser= async (req, res) => {
    try {
        //id는 following의 id, req.user._id는 follwer의 id
        const { id } = req.params;
        console.log(id)
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);
        
        //req.user._id는 객체라서 toString()을 사용해 string으로 변환
        if (id === req.user._id.toString()) {
            return res.status(400).json({error: "You can't follow/unfollow yourself"})
        }
        if (!userToModify || !currentUser) return res.status(400).json({error: "User not found"});

        //following user에 follower id가 이미 존재하는지 확인
        const isFollowing = currentUser.following.includes(id)

        //이미 존재하면 
        if (isFollowing) {
            //Unfollow the user
            //following id의 followers에 req.user._id를 제거(pull)한다.
            await User.findByIdAndUpdate(id, {$pull: { followers: req.user._id}})
            //follower req.user._id에 following의 id를 제거(pull)한다.
            await User.findByIdAndUpdate(req.user._id, {$pull : {following: id}})

            res.status(200).json({ message: "User unfollowed successfully" })
        } else {
            //Follow the user
            //following id의 followers에 req.user._id를 추가(push)한다.
            await User.findByIdAndUpdate(id, {$push: { followers: req.user._id}})
            //follower req.user._id에 following의 id를 추가(push)한다.
            await User.findByIdAndUpdate(req.user._id, {$push : {following: id}})
            //Send notification to the user
            //Notification 객체를 생성 후 DB에 저장저장
            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: userToModify._id,
                });

            await newNotification.save();

            res.status(200).json({message: "User followed successfully"})
        }
    } catch ( error) {
        console.log("Error in followUnfollowUser:", error.message)
        res.status(500).json({error: error.message});
    }
};

export const getSuggestedUsers = async(req, res) => {
    try {
        const userId = req.user._id;

        //req.user._id의 following에 있는 data를 추출
        const usersFollowedByMe = await User.findById(userId).select("following")

        //aggregate() 합계를 구함, $ne userId가 아닌 것만 가져온다.
        //$sample은 지정된 수 만큼의 문서를 가져온다.
        //users는 요청한 id를 제외한 10개의 유저정보를 담고 있다.
        const users =  await User.aggregate([
            {
                $match: {
                    _id: {$ne: userId},
                },
            },
            {$sample: {size: 10}},
        ]);
        console.log("users in getSuggestedUsers:", users)

        
        //10개의 유저 중 req.user._id가 following 하지않는 user만 filtering 후 배열 반환
        const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id));

        //filtering한 user data 중 0~4번 index에 해당하는 data만 추출 한 배열 반환
        const suggestedUsers = filteredUsers.slice(0,4);

        suggestedUsers.forEach((user) => (user.password = null));

        res.status(200).json(suggestedUsers)

    } catch ( error) {
        console.log("Error in followUnfollowUser:", error.message)
        res.status(500).json({error: error.message});
    }
};



export const updateUser=async(req, res) => {
    const { fullName, email, username, currentPassowrd, newPassword, bio, link} = req.body;
    console.log("fullName, email, username, currentPassowrd, newPassword, bio, link:::",fullName, email, username, currentPassowrd, newPassword, bio, link )
    let { profileImg, coverImg } = req.body;

    const userId = req.user._id;

    try {
        //req.user._id로 해당 유저 정보를 DB 에서 받아온다.
        let user = await User.findById(userId);
        if (!user) return res.status(400).json({message: "User not found"})

        //password 입력 여부 검증
        if ((!newPassword && currentPassowrd) || (!currentPassowrd && newPassword)) {
            return res.status(400).json({error: "Please provide both current password and new password"});
        }

        //현재 암호와 새로운 암호는 bcrypt를 사용해 비교
        if (currentPassowrd && newPassword) {
            const isMatch = await bcrypt.compare(currentPassowrd, user.password);
            if (!isMatch) return res.status(400).json({error: "Current pasword is incorrect"});
            if(newPassword.length < 6) {
                return res.status(400).json({error: "Password must be at least 6 characters"});
            }

            //모든 검증 통과후 새로운 암호 hashing
            const salt= await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        if(profileImg) {
            //기존 user.profielImg이 있으면 cloudinary에서 삭제
            if(user.profileImg) {
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);            
            }

            //cloudinary에 이미지를 전송하고 URL을 받아온다.
            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            profileImg = uploadedResponse.secure_url
        }
        
        if(coverImg) {
            //기존 user.coverImg이 있으면 cloudinary에서 삭제
            if(user.coverImg) {
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
            }

            //cloudinary에 이미지를 전송하고 URL을 받아온다.
            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url
            console.log("coverImg",coverImg)
        }

        //db에 받아온 user 정보를 받고 있는 user에 req로 부터 받아온 정보를 대입한다.
        user.fullName = fullName || user.fullName;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio || user.bio;
		user.link = link || user.link;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;
        
        //업데이트된 user를 db에 저장
        user = await user.save();

        //password should be null in response
        user.password = null;

        return res.status(200).json(user);

    } catch ( error) {
        console.log("Error in updateUser:", error.message)
        res.status(500).json({error: error.message});
    }
};

