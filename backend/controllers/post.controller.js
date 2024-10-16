import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let { img } = req.body;
        const userId = req.user._id.toString();

        const user = await User.findById(userId);

        //요청하 유저가 DB에 있는지 검증
        if(!user) return res.status(404).json({ message: "User not found"});

        //text, img data 존재 유무 검증
        if(!text && !img) {
            return res.status(400).json({ error: "Post must have text or image" });
        }

        //img가 있으면 cloudinary를 통해 url 생성
        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        //Post 모델 객체 생성하여 db에 저장할 data 생성
        const newPost = new Post( {
            user: userId,
            text,
            img,
        });

        //db에 저장 
        await newPost.save();
        res.status(201).json(newPost);

    } catch (error) {
        res.status(500).json({error: "Internal server error"});
        console.log("Error in createPost controller: ", error)
    }
};

export const deletePost = async (req, res) => {
    try {
        console.log(req.params.id)
        const post = await Post.findById(req.params.id);
        if(!post) {
            return res.status(404).json({error: "Post not found"});
        }

        if(post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({error: "You are not authorized to delete this post"});
        }

        if (post.img) {
            const imgId = post.img.split("/").split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({message: "Post deleted successfully"})

    } catch (error) {
        console.log("Error in deletePost controller:", error)
        res.status(500).json({error: "Internal server error"});
    }
};

export const commentOnPost = async (req, res) => {
    try {
        //get text, postId, userId from req
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._id;

        //text 존재 유무 검증
        if (!text) {
            return res.status(400).json({error: "Text field is required"});
        }
        
        //postId에 해당하는 DATA를 DB에서 얻어온다.
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({error: "Post not found"})
        }

        //user, text를 포함한 comment 생성
        const comment = {user: userId, text }
        console.log("comment in commentOnPost():",comment)
        
        //post에 comment를 추가 후 db 저장
        post.comments.push(comment);
        await post.save();

        //결과 반환
        res.status(200).json(post);
 
    } catch (error) {
        console.log("Error in in commentOnPost controller:", error)
        res.status(500).json({error: "Internal server error"});
    }
};

export const likeUnlikePost = async (req, res) => {
    try {
        //like or unlike 한 유저ID
        const userId = req.user._id;
        console.log("userId in likeUnlikPost()",userId)

        //like ro unlike 한 postId
        const {id: postId} = req.params;
        console.log("postId in likeUnlikPost()",postId)

        //postId로 해당 post 정보를 db로 부터 get 
        const post = await Post.findById(postId);
        console.log("post in likeUnlikPost()",post)
        if(!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        //db에서 get한 post의 likes에 userId가 존재하지는 검증
        const userLikedPost = post.likes.includes(userId);
        console.log("userLikedPost in likeUnlikPost()", userLikedPost)

        //존재하면 이미 liked된 post이기 때문에 pull을 사용해 해당값을 빼내어 unliked 되게 한다.
        if (userLikedPost) {
            //Unlike post
            await Post.updateOne({_id: postId }, { $pull: { likes: userId } });
            await User.updateOne({_id: userId }, { $pull: { likedPosts: postId } });

            //post의 id 값을 매개변수로하여 id와 userId가 일치하지 않는 것만 반환
            const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
            res.status(200).json(updatedLikes)
        } else {
            //Like post
            //post.likes에 userId를 추가한다. 
            post.likes.push(userId);

            //User db에 likedPosts 정보를 추가한다.
            await User.updateOne({_id: userId }, { $push: {likedPosts: postId} });
            await post.save();

            //Notification db에 like 정보 추가
            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like"
            })
            await notification.save();

            const updatedLikes = post.likes;
            res.status(200).json(updatedLikes);
        }
    } catch (error) {
        console.log("Error in likeUnlikePost controller:", error)
        res.status(500).json({error: "Internal server error"});
    }
};

export const getAllPosts = async (req, res) => {
    try {
        //populate()을 통해 post와 매개변수 user와 관계되어 있는 data도 같이 출력된다.
        //populate("user").select("-password")를 아래는 객체형태로 전달
        const posts = await Post.find()
            .sort({ createAt: -1})
            .populate({
                path: "user",
                select: "-password",
            });
        //post의 length 검증
        if (posts.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(posts);

    } catch (error) {
        console.log("Error in getAllPosts controller:", error)
        res.status(500).json({error: "Interal server error"});
    }
};


export const getFollowingPosts = async (req, res) => {
    try {
        //get login userId
        const userId = req.user._id;
        //get user info from DB with userId
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        //get follwing info from user
        const following = user.following;

        // find posts which has following in user
        const feedPosts = await Post.find({ user: { $in: following } })
            .sort({ createdAt: -1 })
            .populate({ 
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });
        
            //return feedPosts with res
        res.status(200).json(feedPosts);

    } catch (error) {
        console.log("Error in getFollowingPosts controller:", error)
        res.status(500).json({error: "Interal server error"});
    }
};

export const getLikedPosts = async (req, res) => {
    //req에서 userId를 받아온다.
    const userId = req.params.id
    try {
        //userId에 해당하는 정보를 db에서 받아온다.
        const user = await User.findById(userId);
        if(!user) return res.status(400).json({ error: "User not found"})

        //Post collection으로 부터 user.likedPosts가 있는 정보를 받아온다.
        //user, comments.user와 관계되어 있는 data도 같이 출력된다.
        const likedPosts = await Post.find({_id: { $in: user.likedPosts } })
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });

        res.status(200).json(likedPosts);

    } catch (error) {
        console.log("Error in getLikedPosts controller:", error)
        res.status(500).json({error: "Interal server error"});
    }
};

export const getUserPosts = async (req, res) => {
    try {
        //username을 findOne()에 객채 형태로 전달
        const { username } = req.params;

        //username으로 user info를 DB로 부터 받아온다.
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json( { error: "User not found" });

        //user._id에 해당하는 post를 Post collection으로 부터 받아온다.
        const posts = await Post.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });
        res.status(200).json(posts);
        
    } catch (error) {
        console.log("Error in getUserProfile:", error.message)
        res.status(500).json({error: error.message});
    }
};








