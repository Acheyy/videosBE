const express = require("express");
const { getVideos, addVideo, deleteVideo, searchVideos } = require("../controllers/videos");

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

router.route("/search")
  .get((req, res) => {
    console.log("Search videos");
    return searchVideos(req, res);
  })

module.exports = router;
