const mongoose = require("mongoose")
var slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        minLength: 3, 
    },
    slug: { type: String, slug: "name" }
})

module.exports = mongoose.model("Tag", tagSchema)