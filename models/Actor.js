const mongoose = require("mongoose")
var slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

const actorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        minLength: 3, 
    },
    thumbnail: {
        type: String,
        required: true
    },
    slug: { type: String, slug: "name" },
    totalVideos: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model("Actor", actorSchema)