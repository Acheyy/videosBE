const axios = require("axios");
const FormData = require("form-data");
const Video = require("../models/Video");
const Views = require("../models/Views");
const Actor = require("../models/Actor");
const { param } = require("../routes/actors");
const mongoose = require("mongoose");
const https = require("https"); // or 'https' for https:// URLs
const fs = require("fs");
const Axios = require("axios");
const jwt = require("jsonwebtoken");
const Category = require("../models/Category");
const View = require("../models/Views");
const Tag = require("../models/Tag");

exports.getVideos = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = parseInt(req.query.limit) || 10; // default to 10 videos per page

    try {
        const count = await Video.countDocuments();
        const videos = await Video.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate(["actor", "category", "views"]);

        res.send({
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalVideos: count,
            videos,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getVideosByActor = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = parseInt(req.query.limit) || 10; // default to 10 videos per page

    try {
        const actor = await Actor.findOne({ slug: req.query.actor });
        const count = actor.totalVideos;

        if (req.query.orderBy == "date") {
            const videos = await Video.find({ actor: actor._id })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate(["actor", "category", "views"]);

            res.send({
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalVideos: count,
                videos,
            });
        }
        if (req.query.orderBy == "views") {
            console.log("here");
            const videos = await Video.aggregate([
                { $match: { actor: actor._id } },
                {
                    $lookup: {
                        from: "views",
                        localField: "views",
                        foreignField: "_id",
                        as: "views",
                    },
                },
                { $unwind: "$views" },
                {
                    $lookup: {
                        from: "actors",
                        localField: "actor",
                        foreignField: "_id",
                        as: "actor",
                    },
                },
                { $unwind: "$actor" },
                { $sort: { "views.views": -1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit },
                {
                    $lookup: {
                        from: "categories",
                        localField: "category",
                        foreignField: "_id",
                        as: "category",
                    },
                },
            ]);

            res.send({
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalVideos: count,
                videos,
            });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getVideosByCategory = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = parseInt(req.query.limit) || 10; // default to 10 videos per page

    try {
        const category = await Category.findOne({ slug: req.query.category });

        const videos = await Video.find({ category: category._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate(["actor", "category", "views"]);

        const count = await Video.countDocuments({ category: category._id });

        res.send({
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalVideos: count,
            videos,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getVideosByTag = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = parseInt(req.query.limit) || 10; // default to 10 videos per page

    try {
        const tag = await Tag.findOne({ slug: req.query.tag });
        console.log("slug: req.query.tag", tag)

        const videos = await Video.find({ tags: tag._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate(["actor", "category", "views"]);

        const count = await Video.countDocuments({ tags: tag._id });

        res.send({
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalVideos: count,
            videos,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getRandomVideos = async (req, res) => {
    try {
        const videos = await Video.aggregate([
            {
                $sample: { size: 10 },
            },
        ]);
        await Video.populate(videos, [
            { path: "actor" },
            { path: "category" },
            { path: "views" },
        ]);
        res.send(videos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getMostPopularVideos = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = parseInt(req.query.limit) || 10; // default to 10 videos per page

    try {
        const videos = await View.find()
            .sort({ views: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: "videoId",
                populate: [{ path: "actor" }, { path: "category" }, { path: "views" }],
            });

        res.send({
            currentPage: page,
            totalPages: Math.ceil(120 / limit),
            totalVideos: 120,
            videos,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getSingleVideo = async (req, res) => {
    try {
        const token = generateAccessToken({ username: "testUser" });
        console.log(token);

        const { videoId } = req.params;
        const video = await Video.findOne({ uploadID: videoId })
            .sort({ createdAt: -1 })
            .populate(["actor", "category", "tags", "views"]);

        if (!req.cookies.cookieVideoId?.includes(videoId)) {
            const views = await Views.findOneAndUpdate(
                { _id: video.views },
                {
                    $inc: { views: 1 },
                }
            );
        }

        res.send(video);
    } catch (err) {
        console.error(err.message);
    }
};

exports.addVideo = async (req, res) => {
    try {
        let server = await axios.get(
            "https://api.streamsb.com/api/upload/server?key=66418reck8nac228fzn2j"
        );
        let serverUrl = server.data.result;
        console.log("server.data.result", server.data.result);
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
        console.log("response.data", response.data);

        const videoInfo = await axios.get(
            `https://api.streamsb.com/api/file/info?key=66418reck8nac228fzn2j&file_code=${response.data.result[0].code}`
        );

        const axiosResponse = await Axios({
            url: `https://akamai-cdn-images.com/${response.data.result[0].code}.jpg`,
            method: "GET",
            responseType: "stream",
        });

        await new Promise((resolve, reject) => {
            axiosResponse.data
                .pipe(fs.createWriteStream("file.jpg"))
                .on("error", reject)
                .once("close", () => resolve("file.jpg"));
        });

        const imageToUpload = fs.readFileSync("file.jpg", { encoding: "base64" });
        var img = Buffer.from(imageToUpload, "base64");
        fs.writeFileSync("new-path.jpg", img);
        const response2 = await axios.put(
            `https://storage.bunnycdn.com/skbj/videos/${response.data.result[0].code}.jpg`,
            img,
            {
                "content-type": "application/x-www-form-urlencoded",
                headers: { AccessKey: `aff796b2-9990-480b-b69778a60b10-b14c-4a29` },
            }
        );

        const tagsArray = req.body["tags[]"].split(",");
        const video = new Video({
            name: req.body.name,
            fileName: file.name,
            uploadID: response.data.result[0].code,
            thumbnail: `https://skbj.b-cdn.net/videos/${response.data.result[0].code}.jpg`,
            category: req.body.category,
            tags: tagsArray,
            actor: req.body.actor,
            duration: videoInfo.data.result[0].file_length,
        });
        const views = new Views({
            videoId: video._id,
            views: 0,
        });
        const actor = await Actor.findOneAndUpdate(
            { _id: req.body.actor },
            {
                $inc: { totalVideos: 1 },
            }
        );
        video.views = views._id;
        console.log(video);
        console.log(views);
        await video.save();
        await views.save();
        res.send(video);
    } catch (err) {
        console.error(err.message);
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        console.log("test", req.query);
        const video = await Video.deleteOne({ uploadID: req.query.videoId });
        const views = await Views.deleteOne({ videoId: req.query.videoId });
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
                        autocomplete: {
                            path: "name",
                            query: req.query.searchText,
                        },
                    },
                },
                {
                    $limit: 20,
                },
            ]);
            await Video.populate(videos, [
                { path: "actor" },
                { path: "category" },
                { path: "views" },
            ]);
            console.log(videos);
            res.send(videos);
        } else {
            res.send({ message: "Please send the searchText" });
        }
    } catch (err) {
        console.error(err.message);
    }
};

function generateAccessToken(username) {
    return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: "1800s" });
}
