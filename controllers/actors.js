const axios = require('axios');
const Actor = require("../models/Actor");

exports.getActors = async (_, res) => {
    try {
        const actor = await Actor.find()
        console.log(actor)
        res.send(actor)
    } catch (err) {
        console.error(err.message)
    }
}

exports.addActor = async (req, res) => {
    try {
        const actor = new Actor({
            name: req.body.name,
            thumbnail: req.body.thumbnail,
        })
        await actor.save();
        console.log(actor)
        res.send(actor)

    } catch (err) {
        console.error(err.message)
    }
}
