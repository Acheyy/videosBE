const mongoose = require("mongoose")
var slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

const viewsSchema = new mongoose.Schema({
    views: {
        type: Number,
        required: true,
    },
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true,
    }
})

module.exports = mongoose.model("Views", viewsSchema)