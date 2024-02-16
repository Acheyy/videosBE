const axios = require("axios");
const Gallery = require("../models/Gallery");
const sharp = require("sharp");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Views = require("../models/Views");
const path = require('path');

const watermarkImagePath = path.join(__dirname, '../downloads/skbj_logo.png');

exports.addGallery = async (req, res) => {
    try {
        const files = req.files; // 'files' is an array of images
        const { name, price, actor } = req.body;

        console.log(files.images)

        files.images.forEach(image => {
            console.log(image)
        });

        const tagsArray = req.body["tags[]"].split(",");


        for (let i = 0; i < files.images.length; i++) {
            const thumbnail = files.images[i];

            // const watermark = await sharp(watermarkImagePath)
            //     .resize(200) // Resize watermark to a suitable size
            //     .toBuffer();

            const resizedThumbnail = await sharp(thumbnail.data)
                .resize({ width: 1600 })
                // .composite([{ input: watermark, gravity: 'southeast' }]) // Add watermark
                .toBuffer();

            // Upload the resized thumbnail

            const remoteFileName = `${thumbnail.name}_${i + 1}.webp`;

            await axios.put(
                `https://storage.bunnycdn.com/kbjfreevid/gallery/${name}/${remoteFileName}`,
                resizedThumbnail,
                {
                    "content-type": "application/x-www-form-urlencoded",
                    headers: { AccessKey: `bcf6c056-d8af-4975-ab71056e55aa-c2d5-4297` },
                }
            );
        }

        // Process each image file
        const imageDetails = files.images.map((file, index) => {
            const thumbnail = files.images[index];
            const remoteFileName = `${thumbnail.name}_${index + 1}.webp`;

            return {
                url: `https://kbjfree.b-cdn.net/gallery/${name}/${remoteFileName}`, // or any other file details you need
                width: req.body.imageWidths[index],
                height: req.body.imageHeights[index]
            };
        });

        const gallery = new Gallery({
            name: name,
            cost: price,
            tags: tagsArray,
            actor: actor,
            files: imageDetails,
            thumbnail: imageDetails[0].url
        });
        const views = new Views({
            videoId: gallery._id,
            views: 0,
        });
        gallery.views = views._id;
        await gallery.save();
        await views.save();
        res.status(200).send(gallery);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getGalleries = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = parseInt(req.query.limit) || 10; // default to 10 videos per page
    const sitemap = req.query.sitemap === 'true'; // check if sitemap parameter is true

    try {
        const count = await Gallery.countDocuments();
        let query = Gallery.find();

        if (sitemap) {
            query = query.select('uploadID'); // Select only 'name' field
        } else {
            query = query.populate(["actor", "views"]); // Populate related fields
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

exports.getSingleGallery = async (req, res) => {
    try {
        const cookie = req.headers.cookie;
        const authCookie = cookie
            ? cookie.split(";").find((c) => c.trim().startsWith("token="))
            : null;
        const token = authCookie ? authCookie.split("=")[1] : null;
        const { videoId } = req.params;
        const video = await Gallery.findOne({ slug: videoId })
            .sort({ createdAt: -1 })
            .populate(["actor", "tags", "views"]);

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