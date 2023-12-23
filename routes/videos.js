const express = require("express");
const {
  getVideos,
  addVideo,
  deleteVideo,
  deleteVideos,
  searchVideos,
  getSingleVideo,
  getRandomVideos,
  getVideosByActor,
  getVideosByCategory,
  getMostPopularVideos,
  getVideosByTag,
  downloadVideo,
  fileExists,
  likeVideo,
  getMostLikedVideos,
  getWasabiVideo,
  getSpecialVideos,
  getPurchasedVideos
} = require("../controllers/videos");
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const cookie = req.headers.cookie;
  const authCookie = cookie
    ? cookie.split(";").find((c) => c.trim().startsWith("token="))
    : null;
  const token = authCookie ? authCookie.split("=")[1] : null;

  if (token == null) return res.status(403).json({ error: "Forbidden" }).stat;

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Forbidden" }).stat;

    req.user = user;

    next();
  });
}

const router = express.Router();

router
  .route("/")
  .get((req, res) => {
    // console.log("List Videos");
    return getVideos(req, res);
  })
  .post((req, res) => {
    // console.log("Add video");
    return addVideo(req, res);
  })
  .delete((req, res) => {
    // console.log("Delete video");
    return deleteVideo(req, res);
  });

router
  .route("/special")
  .get((req, res) => {
    // console.log("List Special Videos");
    return getSpecialVideos(req, res);
  })

router
  .route("/deleteMany")
  .delete((req, res) => {
    // console.log("Delete many videos");
    return deleteVideos(req, res);
  });

router.route("/random").get((req, res) => {
  // console.log("Get random videos");
  return getRandomVideos(req, res);
});

router.route("/getWasabiVideo").get((req, res) => {
  // console.log("Get wasabi video");
  return getWasabiVideo(req, res);
});

router.route("/most-popular").get((req, res) => {
  // console.log("Get most popular videos");
  return getMostPopularVideos(req, res);
});

router.route("/most-liked").get((req, res) => {
  // console.log("Get most liked videos");
  return getMostLikedVideos(req, res);
});

router.route("/getPurchasedVideos").get((req, res) => {
  // console.log("Get getPurchasedVideos videos");
  return getPurchasedVideos(req, res);
});

router.route("/videosByActor").get((req, res) => {
  // console.log("Get videos by actor");
  return getVideosByActor(req, res);
});

router.route("/getVideosByCategory").get((req, res) => {
  // console.log("Get videos by category");
  return getVideosByCategory(req, res);
});

router.route("/download/:blobName").get((req, res) => {
  // console.log("Download video");
  return downloadVideo(req, res);
});

router.route("/fileExists/:blobName").get((req, res) => {
  // console.log("Check if file exists");
  return fileExists(req, res);
});

router.route("/getVideosByTag").get((req, res) => {
  // console.log("Get videos by tag");
  return getVideosByTag(req, res);
});

router.route("/search").get((req, res) => {
  // console.log("Search videos");
  return searchVideos(req, res);
});

router.route("/:videoId").get((req, res) => {
  // console.log("Get Single Video");
  return getSingleVideo(req, res);
});

router.route("/like/:videoId").get((req, res) => {
  // console.log("Like Video");
  return likeVideo(req, res);
});

module.exports = router;