const express = require("express");
const { getVideos, addVideo, deleteVideo, searchVideos, getSingleVideo, getRandomVideos, getVideosByActor } = require("../controllers/videos");
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const cookie = req.headers.cookie;
  const authCookie = cookie ? cookie.split(';').find(c => c.trim().startsWith('token=')) : null;
  const token = authCookie ? authCookie.split('=')[1] : null;

  if (token == null) return res.status(403).json({ error: "Forbidden" }).stat

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {

    if (err) return res.status(403).json({ error: "Forbidden" }).stat

    req.user = user

    next()
  })
}

const router = express.Router();

router
  .route("/")
  .get((req, res) => {
    console.log("List Videos");
    return getVideos(req, res);
  })
  .post((req, res) => {
    console.log("Add video");
    return addVideo(req, res);
  })
  .delete((req, res) => {
    console.log("Delete video");
    return deleteVideo(req, res);
  });

  router.route("/random")
  .get((req, res) => {
    console.log("Get random videos");
    return getRandomVideos(req, res);
  })

router.route("/videosByActor")
  .get((req, res) => {
    console.log("Get random videos");
    return getVideosByActor(req, res);
  })

router.route("/search")
  .get((req, res) => {
    console.log("Search videos");
    return searchVideos(req, res);
  })

router.route("/:videoId")
  .get((req, res) => {
    console.log("Get Single Video");
    return getSingleVideo(req, res);
  })

module.exports = router;