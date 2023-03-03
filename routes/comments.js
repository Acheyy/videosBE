const express = require("express");
const {
    getComments,
    addComment
} = require("../controllers/comments")

const router = express.Router()

router
    .route("/:videoId")
    .get(
        (req, res) => {
            console.log("List comments of a video");
            return getComments(req, res);
        }
    )
    .post(
        (req, res) => {
            console.log("Add comment to a video");
            return addComment(req, res);
        }
    )

module.exports = router