const axios = require('axios');
const Actor = require("../models/Actor");
const Video = require("../models/Video");
const FormData = require("form-data");
const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.getActors = async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const skip = (page - 1) * limit;
        const order = req.query.order;
        const sitemap = req.query.sitemap === 'true'; // Check if sitemap parameter is true
        
        const totalActors = await Actor.countDocuments();
        let query = Actor.find();

        let sort = {}; // Define sort object

        switch (order) {
            case 'alphabetic':
                query = query.sort({ name: 1 });
                break;
            case 'most_videos':
                query = query.sort({ totalVideos: -1 }); 
                break;
            case 'most_followers':
                query = Actor.aggregate([
                    {
                        $addFields: {
                            likesLength: {
                                $size: { 
                                    $ifNull: ["$likes", []] // Provides an empty array if 'likes' is missing
                                }
                            }
                        }
                    },
                    { $sort: { likesLength: -1 } }
                    // ... other aggregation stages like $skip and $limit for pagination, if needed
                ]);
                
                break;
        }

        if (sitemap) {
            // Select only the 'name' field if sitemap is true
            query = query.select('name -_id');
        }

        const actors = await query.skip(skip).limit(limit);

        res.send({
            actors: actors,
            currentPage: page,
            perPage: limit,
            totalActors: totalActors,
            totalPages: Math.ceil(totalActors / limit)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: "Internal Server Error" });
    }
};

exports.getFollowingActors = async (req, res) => {
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
            const userDB = await User.findOne({ userName: user.userName }).populate('likedActor');

            // console.log("userDB", userDB.likedActor);

            // Send the populated likedActor field to the frontend
            res.json(userDB.likedActor);
        });
    } catch (err) {
        console.error(err.message)
    }
}

exports.likeActor = async (req, res) => {
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

            const actor = await Actor.findOne({ _id: req.params.actorId }).sort({
                createdAt: -1,
            });

            // Check if user's ID is in video.likes array, and add/remove accordingly
            const userIndexInVideoLikes = actor.likes.indexOf(userDB._id);
            let isLiked;

            if (userIndexInVideoLikes !== -1) {
                actor.likes.splice(userIndexInVideoLikes, 1);
                isLiked = false;
            } else {
                actor.likes.push(userDB._id);
                isLiked = true;
            }

            // Check if video's ID is in userDB.liked array, and add/remove accordingly
            const videoIndexInUserLiked = userDB.likedActor.indexOf(actor._id);
            // console.log("userDB", videoIndexInUserLiked)
            if (videoIndexInUserLiked !== -1) {
                userDB.likedActor.splice(videoIndexInUserLiked, 1);
            } else {
                userDB.likedActor.unshift(actor._id);
            }

            // Save the updated video and userDB documents
            await actor.save();
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

exports.getFeaturedActors = async (_, res) => {
    try {
        const featuredActors = await Actor.aggregate([
            { $match: { isFeatured: true } },
            { $sample: { size: 30 } }
        ]);
        // // console.log(featuredActors);
        res.send(featuredActors);
    } catch (err) {
        console.error(err.message)
    }
}

exports.getMostVieweddActors = async (_, res) => {
    try {
        // Fetch most viewed actors based on the video views count
        const mostViewedActors = await Video.aggregate([
            {
                $lookup: {
                    from: "views", // Collection name for views model (ensure it's in plural form).
                    localField: "views",
                    foreignField: "_id",
                    as: "videoViews"
                }
            },
            {
                $unwind: "$videoViews" // Flatten the videoViews array.
            },
            {
                $group: {
                    _id: "$actor",
                    totalViews: { $sum: "$videoViews.views" }
                }
            },
            {
                $sort: { totalViews: -1 } // Sort in descending order by views.
            },
            {
                $limit: 20 // Adjust this value based on how many actors you want to fetch.
            },
            {
                $lookup: {
                    from: "actors", // Collection name for actor model (ensure it's in plural form).
                    localField: "_id",
                    foreignField: "_id",
                    as: "actorDetails"
                }
            },
            {
                $unwind: "$actorDetails" // Flatten the actorDetails array.
            },
            {
                $project: { // Beautify the result.
                    actorId: "$_id",
                    name: "$actorDetails.name",
                    thumbnail: "$actorDetails.thumbnail",
                    slug: "$actorDetails.slug",
                    totalViews: 1
                }
            }
        ]);

        res.send(mostViewedActors);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

exports.getMostLikedActors = async (_, res) => {
    try {
        const mostLikedActors = await Video.aggregate([
            {
                $unwind: "$likes" // Expands the array of likes for each video
            },
            {
                $group: {
                    _id: "$actor", // Group by actor ID
                    totalLikes: { $sum: 1 } // Summing up the likes for each actor
                }
            },
            {
                $sort: { totalLikes: -1 } // Sort in descending order based on the number of likes
            },
            {
                $limit: 20 // Adjust this to get the desired number of actors
            },
            {
                $lookup: {
                    from: "actors", // Collection name for actor model (ensure it's in plural form).
                    localField: "_id",
                    foreignField: "_id",
                    as: "actorDetails"
                }
            },
            {
                $unwind: "$actorDetails" // Flatten the actorDetails array.
            },
            {
                $project: { // Beautify the result
                    actorId: "$_id",
                    name: "$actorDetails.name",
                    thumbnail: "$actorDetails.thumbnail",
                    slug: "$actorDetails.slug",
                    totalLikes: 1
                }
            }
        ]);

        res.send(mostLikedActors);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

}

exports.getMostLikedActorsWeekly = async (_, res) => {
    try {
        // Calculate the date from 7 days ago
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const mostLikedActors = await Video.aggregate([
            {
                $match: {
                    createdAt: { $gte: oneWeekAgo } // Filtering videos created in the last 7 days
                }
            },
            {
                $unwind: "$likes" // Expands the array of likes for each video
            },
            {
                $group: {
                    _id: "$actor", // Group by actor ID
                    totalLikes: { $sum: 1 } // Summing up the likes for each actor
                }
            },
            {
                $sort: { totalLikes: -1 } // Sort in descending order based on the number of likes
            },
            {
                $limit: 20 // Adjust this to get the desired number of actors
            },
            {
                $lookup: {
                    from: "actors", // Collection name for actor model (ensure it's in plural form).
                    localField: "_id",
                    foreignField: "_id",
                    as: "actorDetails"
                }
            },
            {
                $unwind: "$actorDetails" // Flatten the actorDetails array.
            },
            {
                $project: { // Beautify the result
                    actorId: "$_id",
                    name: "$actorDetails.name",
                    thumbnail: "$actorDetails.thumbnail",
                    slug: "$actorDetails.slug",
                    totalLikes: 1
                }
            }
        ]);

        res.send(mostLikedActors);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

exports.addActor = async (req, res) => {
    try {
        const file = req.files["video"];
        const formData = new FormData();
        formData.append("file", file.data, file.name);
        const response = await axios.put(`https://storage.bunnycdn.com/kbjfree/actors/${file.name}`, file.data, { 'content-type': 'application/x-www-form-urlencoded', headers: { "AccessKey": `963dc984-f016-4af3-92809144c62a-f1a9-4158` } });

        const actor = new Actor({
            name: req.body.name,
            thumbnail: `https://kbjfree.b-cdn.net/actors/${file.name}`
        })
        await actor.save();
        // console.log(actor)
        res.send(actor)

    } catch (err) {
        console.error(err.message)
    }
}

exports.getSingleActor = async (req, res) => {
    try {
        // console.log(req.params.actorName)
        const actor = await Actor.findOne({ slug: req.params.actorName })
        res.send(actor)
    } catch (err) {
        console.error(err.message)
    }
}