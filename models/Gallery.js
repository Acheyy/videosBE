const mongoose = require("mongoose");
var slug = require("mongoose-slug-generator");
mongoose.plugin(slug);

const gallerySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 3,
    },
    slug: {},
    fileName: String,
    uploadID: String,
    uploadID2: String,
    uploadID3: String,
    thumbnail: String,
    files: [
        {
            url: String,
            width: Number,
            height: Number,
        },
    ],
    cost: {
        type: Number,
        default: 0,
    },
    tags: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tag",
        },
    ],
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Actor",
    },
    views: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Views",
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    createdAt: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
    },
    updatedAt: {
        type: Date,
        default: () => Date.now(),
    },
    duration: Number,
    slug: { type: String, slug: "name", unique: true },
});
module.exports = mongoose.model("Gallery", gallerySchema);
