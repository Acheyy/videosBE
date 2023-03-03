const mongoose = require("mongoose")
var slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        max: 1024,
    },
    avatar: {
        type: String,
    },
    bio: {
        type: String,
        default: "",
    },
    history: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        },
    ],
    liked: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        },
    ],
})

module.exports = mongoose.model("User", userSchema)