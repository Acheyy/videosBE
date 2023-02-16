const axios = require('axios');
const Tag = require("../models/Tag");

exports.getTags = async (_, res) => {
    try {
        const tag = await Tag.find()
        console.log(tag)
        res.send(tag)
    } catch (err) {
        console.error(err.message)
    }
}

exports.addTag = async (req, res) => {
    try {
        const tag = new Tag({
            name: req.body.name,
        })
        await tag.save();
        console.log(tag)
        res.send(tag)

    } catch (err) {
        console.error(err.message)
    }
}
