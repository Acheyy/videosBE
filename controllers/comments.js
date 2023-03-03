const axios = require('axios');
const Comment = require("../models/Comment");

exports.getComments = async (req, res) => {
    try {
        console.log("req.params", req.params)
        const { videoId } = req.params;
        const comments = await Comment.find({ videoId: videoId, isReply: false }).populate([{ path: "author" }, { path: "replies", populate: { path: "author" } }]);

        console.log(comments)
        res.send(comments)
    } catch (err) {
        console.error(err.message)
    }
}

exports.addComment = async (req, res) => {
    try {
        // If it's not a reply
        if (!req.body.replyTo) {
            const comment = new Comment({
                commentBody: req.body.commentBody,
                author: req.body.author,
                videoId: req.body.videoId,
            });
            await comment.save();
            console.log(req.body);
            res.send(comment);
        } else {
            const comment = new Comment({
                commentBody: req.body.commentBody,
                author: req.body.author,
                videoId: req.body.videoId,
                isReply: true
            });
            await comment.save();
            const mainComment = await Comment.findById(req.body.replyTo);
            if (!mainComment) {
                throw new Error('Main comment not found');
            }
            console.log("mainComment.replies", mainComment);
            mainComment.replies.push(comment._id);
            await mainComment.save();
            res.send(comment);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

