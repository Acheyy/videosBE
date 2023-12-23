const express = require("express");
const {
    getTags,
    addTag
} = require("../controllers/tags")

const router = express.Router()

router
    .route("/")
    .get(
        (req, res) => {
            // console.log("List Tags");
            return getTags(req, res);
        }
    )
    .post(
        (req, res) => {
            // console.log("Add Tag");
            return addTag(req, res);
        }
    )

module.exports = router