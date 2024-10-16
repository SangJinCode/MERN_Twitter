import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
    try {
        //login된 유저의 _id를 받아온다.
        const userId = req.user._id;

        //to: userId에 해당하는 data를 Notification db에 받아온다. 
        const notifications = await Notification.find({ to: userId })
            .populate({
                path: "from",
                select: "username profileImg",
            });

            //{ to: userId}에 해당하는 data의 read 값을 true로 변경 즉 읽음으로 변경됨
            await Notification.updateMany({ to: userId}, { read: true });

            res.status(200).json(notifications)

    } catch (error) {
        console.log("Error in getNotifications function", error.message);
        res.status(500).json({ error: "Internal Server Error"});
    }
};

export const deleteNotifications = async(req, res) => {
    try {
        const userId = req.user._id;

        await Notification.deleteMany({ to: userId });

        res.status(200).json({ message: "Notifications deleted successfully" });

    } catch (error) {
        console.log("Error in deleteNotifications function", error.message);
        res.status(500).json({ error: "Internal Server Error"});
    }
};