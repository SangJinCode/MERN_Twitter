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

        const usersFollowedByMe = await User.findById(userId).select("follwoing")
        //aggregate() 합계를 구함, $ne userId가 아닌 것만 가져온다.
        //$sample은 지정된 수 만큼의 문서를 가져온다.
        const users =  await User.aggregate([
            {
                $match: {
                    _id: {$ne: userId},
                },
            },
            {$sample: {size: 10}},
        ]);
        console.log("users in getSuggestedUsers:", users)

        const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id));
        const suggestedUsers = filteredUsers.slice(0,4);
    } catch ( error) {
        console.log("Error in followUnfollowUser:", error.message)
        res.status(500).json({error: error.message});
    }
}



export const updateUser=(req, res) => {

}