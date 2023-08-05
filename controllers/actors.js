const axios = require('axios');
const Actor = require("../models/Actor");
const FormData = require("form-data");
const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');

exports.getActors = async (_, res) => {
    try {
        const actor = await Actor.find()
        console.log(actor)
        res.send(actor)
    } catch (err) {
        console.error(err.message)
    }
}

exports.getFeaturedActors = async (_, res) => {
    try {
        const featuredActors = await Actor.aggregate([
            { $match: { isFeatured: true } },
            { $sample: { size: 30 } }
        ]);        console.log(featuredActors);
        res.send(featuredActors);
    } catch (err) {
        console.error(err.message)
    }
}

exports.addActor = async (req, res) => {
    try {
        const file = req.files["video"];
        const formData = new FormData();
        formData.append("file", file.data, file.name);
        const response = await axios.put(`https://storage.bunnycdn.com/skbj/actors/${file.name}`, file.data, { 'content-type': 'application/x-www-form-urlencoded', headers: { "AccessKey": `aff796b2-9990-480b-b69778a60b10-b14c-4a29` } });

        const actor = new Actor({
            name: req.body.name,
            thumbnail: `https://skbj.b-cdn.net/actors/${file.name}`
        })
        await actor.save();
        console.log(actor)
        res.send(actor)

    } catch (err) {
        console.error(err.message)
    }
}

exports.getSingleActor = async (req, res) => {
    try {
        console.log(req.params.actorName)
        const actor = await Actor.findOne({ slug: req.params.actorName })
        res.send(actor)
    } catch (err) {
        console.error(err.message)
    }
}