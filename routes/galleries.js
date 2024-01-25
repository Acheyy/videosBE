const express = require("express");
const {
  addGallery,
  getGalleries,
  getSingleGallery,
} = require("../controllers/galleries");

const router = express.Router();

router
  .route("/")
  .get((req, res) => {
    // console.log("List Videos");
    return getGalleries(req, res);
  })
  .post((req, res) => {
    // console.log("Add video");
    return addGallery(req, res);
  })
  
router.route("/:videoId").get((req, res) => {
    // console.log("Get Single Video");
    return getSingleGallery(req, res);
  });
  
module.exports = router;