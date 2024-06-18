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
        unique: true
    },
    credit: {
        type: Number,
        default: 0
    },
    transactionId: {
        type: String,
        unique: true,
        default: ""
    },
    paymentId: {
        type: String,
        unique: true,
        default: null
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
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
    isUserPremium: {
        type: Boolean,
        default: false
    },
    isRouletteSpinned: {
        type: Boolean,
        default: false
    },
    premiumExpiry: {
        type: Date,
        default: null
    },
    lastRewardClaim: {
        type: Date,
        default: null
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    history: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        },
    ],
    purchasedVideos: [
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
    likedActor: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Actor",
        },
    ],
    purchaseIntent: {
        type: String,
        default: ""
    }
})

module.exports = mongoose.model("User", userSchema)