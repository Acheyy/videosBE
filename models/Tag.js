const mongoose = require("mongoose")

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        minLength: 3, 
    },
})

module.exports = mongoose.model("Tag", tagSchema)