const mongoose = require("mongoose")

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
    }
})

module.exports = mongoose.model("Actor", actorSchema)