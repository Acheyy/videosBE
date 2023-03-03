const mongoose = require("mongoose")
var slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

const commentSchema = new mongoose.Schema({
    commentBody: {
        type: String,
        minLength: 3,
        required: true
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true,
    },
    createdAt: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    },
    updatedAt: {
        type: Date,
        default: () => Date.now()
    },
    isReply: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model("Comment", commentSchema)