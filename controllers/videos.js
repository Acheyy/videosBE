const axios = require("axios");
const FormData = require("form-data");
const Video = require("../models/Video");
const { param } = require("../routes/actors");
const mongoose = require("mongoose");

exports.getVideos = async (_, res) => {
    try {
        const video = await Video.find().sort({ createdAt: -1 });
        console.log(video);
        res.send(video);
    } catch (err) {
        console.error(err.message);
    }
};

exports.addVideo = async (req, res) => {
    try {
        const server = await axios.get(
            "https://api.streamsb.com/api/upload/server?key=66418reck8nac228fzn2j"
        );
        const serverUrl = server.data.result;
        const file = req.files["video"];
        const formData = new FormData();
        formData.append("file", file.data, file.name);
        formData.append("api_key", "66418reck8nac228fzn2j");
        formData.append("json", 1);
        const response = await axios.post(serverUrl, formData, {
            ...formData.getHeaders(),
        });
        if (response.status !== 200) {
            res.send({ message: "Duplicate video" });
        }
        console.log(response.data.result[0].code);

        const tagsArray = req.body["tags[]"].split(",");
        const video = new Video({
            name: req.body.name,
            fileName: file.name,
            uploadID: response.data.result[0].code,
            thumbnail: `https://akamai-cdn-images.com/${response.data.result[0].code}_t.jpg`,
            category: req.body.category,
            tags: tagsArray,
            actor: req.body.actor,
        });
        console.log(video);
        await video.save();
        res.send(video);
    } catch (err) {
        console.error(err.message);
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        console.log("test", req.query);
        const video = await Video.deleteOne({ uploadID: req.query.videoId });
        console.log(video);
        res.send(video);
    } catch (err) {
        console.error(err.message);
    }
};

exports.searchVideos = async (req, res) => {
    try {
        if (req.query.searchText) {
            const videos = await Video.aggregate([
                {
                    $search: {
                        index: "custom",
                        "autocomplete": {
                            "path": "name",
                            "query": req.query.searchText
                        }
                    }
                },
                {
                    $limit: 20
                },

            ])
            console.log(videos);
            res.send(videos);
        } else {
            res.send({ message: "Please send the searchText" })
        }
    } catch (err) {
        console.error(err.message);
    }
};
