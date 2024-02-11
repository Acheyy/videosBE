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
const User = require("../models/User");
const Tag = require("../models/Tag");
const { blobServiceClient } = require("../azure-storage.js");
const sharp = require("sharp");
const { Readable } = require("stream");
const BetterQueue = require("better-queue");
const clone = require("clone");

const uploadQueue = new BetterQueue(
    async (task, cb) => {
        try {
            await processUpload(task.req, task.res);
            cb(null);
        } catch (err) {
            console.error(err.message);
            cb(err);
        }
    },
    { concurrent: 1 }
);

exports.getVideos = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = parseInt(req.query.limit) || 10; // default to 10 videos per page
    const sitemap = req.query.sitemap === "true"; // check if sitemap parameter is true

    try {
        const count = await Video.countDocuments();
        let query = Video.find();

        if (sitemap) {
            query = query.select("uploadID"); // Select only 'name' field
        } else {
            query = query.populate(["actor", "category", "views"]); // Populate related fields
        }

        const videos = await query
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

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

exports.getSpecialVideos = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = parseInt(req.query.limit) || 10; // default to 10 videos per page

    try {
        // Count only videos with cost greater than 0
        const count = await Video.countDocuments({ cost: { $gt: 0 } });

        // Fetch only videos with cost greater than 0
        const videos = await Video.find({ cost: { $gt: 0 } })
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

exports.getPurchasedVideos = async (req, res) => {
    try {
        const cookie = req.headers.cookie;
        const authCookie = cookie
            ? cookie.split(";").find((c) => c.trim().startsWith("token="))
            : null;
        const token = authCookie ? authCookie.split("=")[1] : null;

        if (token == null) return res.status(403).json({ error: "Forbidden" }).stat;

        jwt.verify(token, process.env.TOKEN_SECRET, async (err, user) => {
            if (err) return res.status(403).json({ error: "Forbidden" }).stat;

            req.user = user;

            // Find the user and populate the likedActor field
            const userDB = await User.findOne({ userName: user.userName }).populate({
                path: "purchasedVideos",
                populate: {
                    path: "actor",
                    model: "Actor", // If it's not in the same Mongoose connection, you need to specify the model name
                },
            });

            // console.log("userDB", userDB.likedActor);

            // Send the populated likedActor field to the frontend
            res.json({ videos: userDB.purchasedVideos });
        });
    } catch (err) {
        console.error(err.message);
    }
};

exports.getVideosByActor = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = parseInt(req.query.limit) || 10; // default to 10 videos per page

    try {
        const actor = await Actor.findOne({ slug: req.query.actor });
        const count = actor?.totalVideos;

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
                { $unwind: "$category" }, // Add this line
            ]);

            res.send({
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalVideos: count,
                videos,
            });
        }
        if (req.query.orderBy == "likes") {
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
                // Add a field called 'likesCount' to store the count of likes
                {
                    $addFields: {
                        likesCount: {
                            $size: {
                                $ifNull: ["$likes", []], // Provide an empty array as default value if 'likes' is missing or null
                            },
                        },
                    },
                },
                // Sort by 'likesCount' instead of 'views.views'
                { $sort: { likesCount: -1 } },
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
                { $unwind: "$category" }, // Add this line
            ]);

            res.send({
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalVideos: count,
                videos,
            });
        }
        if (req.query.orderBy == "vip") {
            // Count the total number of videos with the 'vip' tag
            const totalVipVideos = await Video.aggregate([
                { $match: { actor: actor._id } },
                {
                    $lookup: {
                        from: "tags",
                        localField: "tags",
                        foreignField: "_id",
                        as: "tags",
                    },
                },
                { $match: { "tags.name": "vip" } },
                { $count: "totalVideos" },
            ]);

            const count =
                totalVipVideos.length > 0 ? totalVipVideos[0]?.totalVideos : 0;

            const videos = await Video.aggregate([
                { $match: { actor: actor._id } },
                {
                    $lookup: {
                        from: "tags",
                        localField: "tags",
                        foreignField: "_id",
                        as: "tags",
                    },
                },
                { $match: { "tags.name": "vip" } },
                { $sort: { createdAt: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit },
                {
                    $lookup: {
                        from: "actors",
                        localField: "actor",
                        foreignField: "_id",
                        as: "actor",
                    },
                },
                { $unwind: "$actor" },
                {
                    $lookup: {
                        from: "categories",
                        localField: "category",
                        foreignField: "_id",
                        as: "category",
                    },
                },
                { $unwind: "$category" }, // Add this line
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
                    $project: {
                        // Include all fields except the 'tags' field
                        name: 1,
                        slug: 1,
                        fileName: 1,
                        uploadID: 1,
                        uploadID2: 1,
                        thumbnail: 1,
                        category: 1,
                        snapshots: 1,
                        actor: 1,
                        views: 1,
                        likes: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        duration: 1,
                        // Replace the 'tags' field with an array of tag IDs
                        tags: {
                            $map: {
                                input: "$tags",
                                as: "tag",
                                in: "$$tag._id",
                            },
                        },
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

        // console.log("videos", videos);
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

exports.getMostLikedVideos = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = parseInt(req.query.limit) || 10; // default to 10 videos per page

    try {
        const videos = await Video.aggregate([
            {
                $lookup: {
                    from: "actors",
                    localField: "actor",
                    foreignField: "_id",
                    as: "actor",
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category",
                },
            },
            { $unwind: "$category" }, // Add this line
            {
                $lookup: {
                    from: "views",
                    localField: "views",
                    foreignField: "_id",
                    as: "views",
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    slug: 1,
                    fileName: 1,
                    uploadID: 1,
                    thumbnail: 1,
                    category: 1,
                    snapshots: 1,
                    tags: 1,
                    actor: { $arrayElemAt: ["$actor", 0] },
                    views: { $arrayElemAt: ["$views", 0] },
                    likes: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    duration: 1,
                    likesCount: { $size: { $ifNull: ["$likes", []] } },
                },
            },
            { $sort: { likesCount: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ]);

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
        const cookie = req.headers.cookie;
        const authCookie = cookie
            ? cookie.split(";").find((c) => c.trim().startsWith("token="))
            : null;
        const token = authCookie ? authCookie.split("=")[1] : null;
        const { videoId } = req.params;
        const video = await Video.findOne({ uploadID: videoId })
            .sort({ createdAt: -1 })
            .populate(["actor", "category", "tags", "views"]);

        if (!video) {
            return res.status(404).json({ error: "Video not found" });
        }

        if (token != null) {
            jwt.verify(token, process.env.TOKEN_SECRET, async (err, user) => {
                if (err) return res.status(403).json({ error: "Forbidden" }).stat;

                req.user = user;

                const userDB = await User.findOne({ userName: user.userName });

                // Check if video._id is already present in userDB.history
                const index = userDB.history.indexOf(video._id);

                // If video._id is present, remove it from the array
                if (index !== -1) {
                    userDB.history.splice(index, 1);
                }

                // Add video._id to the beginning of the array
                userDB.history.unshift(video._id);

                // Limit the array to a maximum length of 20 elements
                userDB.history = userDB.history.slice(0, 20);

                // Save the updated user to the database
                await userDB.save();
            });
        }

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

exports.likeVideo = async (req, res) => {
    try {
        const cookie = req.headers.cookie;
        const authCookie = cookie
            ? cookie.split(";").find((c) => c.trim().startsWith("token="))
            : null;
        const token = authCookie ? authCookie.split("=")[1] : null;

        // console.log("token", token);
        if (token == null) return res.status(403).json({ error: "Forbidden" }).stat;

        jwt.verify(token, process.env.TOKEN_SECRET, async (err, user) => {
            if (err) return res.status(403).json({ error: "Forbidden" }).stat;

            req.user = user;

            const userDB = await User.findOne({ userName: user.userName });

            const video = await Video.findOne({ _id: req.params.videoId }).sort({
                createdAt: -1,
            });

            // Check if user's ID is in video.likes array, and add/remove accordingly
            const userIndexInVideoLikes = video.likes.indexOf(userDB._id);
            let isLiked;

            if (userIndexInVideoLikes !== -1) {
                video.likes.splice(userIndexInVideoLikes, 1);
                isLiked = false;
            } else {
                video.likes.push(userDB._id);
                isLiked = true;
            }

            // Check if video's ID is in userDB.liked array, and add/remove accordingly
            const videoIndexInUserLiked = userDB.liked.indexOf(video._id);

            if (videoIndexInUserLiked !== -1) {
                userDB.liked.splice(videoIndexInUserLiked, 1);
            } else {
                userDB.liked.unshift(video._id);
            }

            // Save the updated video and userDB documents
            await video.save();
            await userDB.save();

            if (isLiked) {
                res.send("Liked");
            } else {
                res.send("Unliked");
            }
        });
    } catch (err) {
        console.error(err.message);
    }
};

exports.downloadVideo = async (req, res) => {
    const blobName = req.params.blobName;
    const containerName = "first";

    try {
        const blobClient = blobServiceClient
            .getContainerClient(containerName)
            .getBlobClient(blobName);

        const exists = await blobClient.exists();
        if (!exists) {
            res.status(404).send("File not found");
            return;
        }

        const properties = await blobClient.getProperties();

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${encodeURIComponent(blobName)}"`
        );
        res.setHeader("Content-Type", properties.contentType);
        res.setHeader("Content-Length", properties.contentLength);

        // Pipe the blob's readable stream to the response object
        const downloadResponse = await blobClient.download(0);
        const downloadStream = downloadResponse.readableStreamBody;

        if (downloadStream) {
            downloadStream.pipe(res);
        } else {
            console.error("Error downloading file: Readable stream is null");
            res.status(500).send("Error downloading file");
        }
    } catch (err) {
        console.error("Error downloading file:", err);
        res.status(500).send("Error downloading file");
    }
};

exports.fileExists = async (req, res) => {
    try {
        const blobName = req.params.blobName;
        const containerName = "first"; // Replace with your container name
        // console.log(req.params.blobName);

        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(blobName);

        // Check if the file exists
        const exists = await blobClient.exists();
        // console.log("exists", exists);

        res.json({ exists });
    } catch (error) {
        console.error("Error checking file existence:", error);
        res.status(500).send("Error checking file existence");
    }
};

function removeKoreanCharacters(str) {
    // The regular expression covers the range of Hangul Unicode characters
    // Hangul Syllables (AC00-D7AF), Hangul Jamo (1100-11FF), Hangul Compatibility Jamo (3130-318F)
    const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g;

    // Replace Korean characters with an empty string
    return str.replace(koreanRegex, "");
}

const processUpload = async (req, res) => {
    try {
        // let uploadID2 = "";
        // let server2 = await axios.get(
        //     "https://api.streamhide.com/api/upload/server?key=956panm98wo2rdtonky"
        // );
        // let serverUrl2 = server2.data.result;
        // // console.log("server2.data.result", server2.data.result);
        // const formData2 = new FormData();
        // const file2 = req.files["video"];
        // formData2.append("file", file2.data, file2.name);
        // formData2.append("key", "956panm98wo2rdtonky");
        // // console.log("start upload StreamHide");
        // const response2 = await axios.post(serverUrl2, formData2, {
        //     ...formData2.getHeaders(),
        // });
        // if (response2.data.status == 200) {
        //     // console.log("response StreamHide", response2.data.files[0]);
        //     uploadID2 = response2.data.files[0].filecode;
        // } else {
        //     // console.log("Error uploading to StreamHide");
        // }

        // let uploadID3 = "";
        // let server3 = await axios.get(
        //     "https://api.streamwish.com/api/upload/server?key=183ulosm5q6moj2x4yu"
        // );
        // let serverUrl3 = "https://Y3KpCdvlgSba.sw-cdnstream.com/upload/01";
        // // console.log("server3.data.result", server3.data.result);
        // const formData3 = new FormData();
        // const file3 = req.files["video"];
        // formData3.append("file", file3.data, file3.name);
        // formData3.append("key", "183ulosm5q6moj2x4yu");
        // // console.log("start upload StreamWish");
        // const response3 = await axios.post(serverUrl3, formData3, {
        //     ...formData3.getHeaders(),
        // });
        // if (response3.data.status == 200) {
        //     // console.log("response StreamWish", response3.data.files[0]);
        //     uploadID3 = response3.data.files[0].filecode;
        // } else {
        //     // console.log("Error uploading to StreamWish");
        // }

        // let server = await axios.get(
        //     "https://api.streamsb.com/api/upload/server?key=66418reck8nac228fzn2j"
        // );
        // let serverUrl = server.data.result;
        // // console.log("server.data.result", server.data.result);
        const formData = new FormData();
        const file = req.files["video"];
        formData.append("file", file.data, file.name);
        // formData.append("api_key", "66418reck8nac228fzn2j");
        // formData.append("json", 1);
        // const response = await axios.post(serverUrl, formData, {
        //     ...formData.getHeaders(),
        // });
        // if (response.status !== 200) {
        //     res.send({ message: "Duplicate video" });
        // }
        const randomString = Math.random().toString(36).slice(-10);
        const fileName =
            removeKoreanCharacters(file.name.replace(/[^\w\s]/gi, "")) +
            "-" +
            randomString +
            ".mp4";
        // console.log("fileName", fileName);
        file.name = fileName;

        const config = {
            headers: {
                "Content-Type": file.mimetype,
                AccessKey: "cd2cf0c3-6b4e-4c83-ad3a825c3425-f9b6-4a40",
                accept: "application/json",
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 0, // no timeout
            maxRedirects: 0,
            onUploadProgress: (progressEvent) => {
                console.log(`Bytes uploaded Storage: ${progressEvent.loaded}`);
            },
        };

        const data = {
            title: file.name, // Replace with your video title
        };
        const config2 = {
            headers: {
                "Content-Type": "application/json",
                AccessKey: "93bb85a4-a150-4b7f-9d25de98a447-703c-4c9e", // Replace with your access key
            },
            data,
        };

        const config23 = {
            headers: {
                "Content-Type": file.mimetype,
                AccessKey: "93bb85a4-a150-4b7f-9d25de98a447-703c-4c9e",
                accept: "application/json",
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 0, // no timeout
            maxRedirects: 0,
            onUploadProgress: (progressEvent) => {
                console.log(`Bytes uploaded Player: ${progressEvent.loaded}`);
            },
        };

        console.log("Start upload to bunny video");

        const dataStream = new Readable();
        dataStream._read = () => { };
        dataStream.push(clone(file.data));
        dataStream.push(null);

        const dataStream2 = new Readable();
        dataStream2._read = () => { };
        dataStream2.push(clone(file.data));
        dataStream2.push(null);

        try {
            const storageVideo = await axios.put(
                `https://storage.bunnycdn.com/skbjvid/videos/${file.name}`,
                dataStream,
                config
            );
        } catch (error) {
            console.error("Error during uploading to Bunny storage:", error);
            // optionally throw the error again or return to stop the function
            return;
        }

        let videoIDStream;

        try {
            const responseVideoStream = await axios.post(
                `https://video.bunnycdn.com/library/141502/videos`,
                data,
                config2
            );

            videoIDStream = responseVideoStream.data.guid;

            const responseVideoStream2 = await axios.put(
                `https://video.bunnycdn.com/library/141502/videos/${videoIDStream}`,
                dataStream2,
                config23
            );
            console.log("Finished bunny video upload", responseVideoStream2);
        } catch (error) {
            console.error("Error during uploading to Bunny CDN:", error);
            // optionally throw the error again or return to stop the function
        }

        const thumbnails = [
            req.files["thumbnail1"],
            req.files["thumbnail2"],
            req.files["thumbnail3"],
            req.files["thumbnail4"],
            req.files["thumbnail5"],
            req.files["thumbnail6"],
            req.files["thumbnail7"],
            req.files["thumbnail8"],
        ];

        for (let i = 0; i < thumbnails.length; i++) {
            const thumbnail = thumbnails[i];

            const resizedThumbnail = await sharp(thumbnail.data)
                .resize({ width: 400 })
                .toBuffer();

            // Upload the resized thumbnail
            const remoteFileName = `${file.name}_${i + 1}.webp`;
            // console.log("remoteFileName", remoteFileName);
            await axios.put(
                `https://storage.bunnycdn.com/skbj/videos/${remoteFileName}`,
                resizedThumbnail,
                {
                    "content-type": "application/x-www-form-urlencoded",
                    headers: { AccessKey: `aff796b2-9990-480b-b69778a60b10-b14c-4a29` },
                }
            );
        }

        const tagsArray = req.body["tags[]"].split(",");
        const video = new Video({
            name: req.body.name,
            cost: req.body.price,
            fileName: fileName,
            uploadID: videoIDStream,
            uploadedBy: req.body.uploadedBy,
            thumbnail: `https://skbj.b-cdn.net/videos/${file.name}_1.webp`,
            snapshots: [
                `https://skbj.b-cdn.net/videos/${file.name}_1.webp`,
                `https://skbj.b-cdn.net/videos/${file.name}_2.webp`,
                `https://skbj.b-cdn.net/videos/${file.name}_3.webp`,
                `https://skbj.b-cdn.net/videos/${file.name}_4.webp`,
                `https://skbj.b-cdn.net/videos/${file.name}_5.webp`,
                `https://skbj.b-cdn.net/videos/${file.name}_6.webp`,
                `https://skbj.b-cdn.net/videos/${file.name}_7.webp`,
                `https://skbj.b-cdn.net/videos/${file.name}_8.webp`,
            ],
            category: req.body.category,
            tags: tagsArray,
            actor: req.body.actor,
            duration: req.body.duration,
        });
        // console.log("video", video);
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
        // console.log("video", video);
        // // console.log(views);
        await video.save();
        await views.save();
        res.send(video);
    } catch (err) {
        console.error(err.message);
    }
};

exports.addVideo = async (req, res) => {
    uploadQueue.push({ req, res });
};

exports.deleteVideo = async (req, res) => {
    try {
        // console.log("test", req.query);
        const video = await Video.deleteOne({ uploadID: req.query.videoId });
        const views = await Views.deleteOne({ videoId: req.query.videoId });
        // console.log(video);
        res.send(video);
    } catch (err) {
        console.error(err.message);
    }
};

exports.deleteVideos = async (req, res) => {
    try {
        // Fetch all actors
        const actors = await Actor.find({});

        for (let actor of actors) {
            // Count the number of videos associated with the actor
            const videoCount = await Video.countDocuments({ actor: actor._id });

            // Update the actor's totalVideos
            actor.totalVideos = videoCount;
            await actor.save();
        }

        // console.log('Actors totalVideos updated successfully!');
    } catch (error) {
        console.error("Error updating actors totalVideos:", error.message);
    }
};

exports.searchVideos = async (req, res) => {
    try {
        const searchText = req.query.searchText;
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 20; // Default to 20 items per page if not provided
        const skip = (page - 1) * limit; // Calculate the number of items to skip

        if (searchText) {
            // Count the total number of videos matching the search criteria
            const count = await Video.aggregate([
                {
                    $search: {
                        index: "custom",
                        autocomplete: {
                            path: "name",
                            query: searchText,
                        },
                    },
                },
                {
                    $count: "total",
                },
            ]);

            const totalVideos = count[0] ? count[0].total : 0;

            // Fetch the videos with pagination
            const videos = await Video.aggregate([
                {
                    $search: {
                        index: "custom",
                        autocomplete: {
                            path: "name",
                            query: searchText,
                        },
                    },
                },
                { $skip: skip }, // Skip the documents for pagination
                { $limit: limit }, // Limit the number of documents returned
            ]);

            await Video.populate(videos, [
                { path: "actor" },
                { path: "category" },
                { path: "views" },
            ]);

            res.send({
                currentPage: page,
                totalPages: Math.ceil(totalVideos / limit),
                totalVideos: totalVideos,
                videos,
            });
        } else {
            res.send({ message: "Please send the searchText" });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ message: "Server error" });
    }
};

function generateAccessToken(username) {
    return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: "1800s" });
}
