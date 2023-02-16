const mongoose = require("mongoose")

const videoSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 3
    },
    slug: {},
    fileName: String,
    uploadID: String,
    thumbnail: String,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
    }],
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Actor",
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

})
module.exports = mongoose.model("Video", videoSchema)