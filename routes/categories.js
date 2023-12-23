const express = require("express");
const {
    getCategories,
    addCategory
} = require("../controllers/categories")

const router = express.Router()

router
    .route("/")
    .get(
        (req, res) => {
            // console.log("List Categories");
            return getCategories(req, res);
        }
    )
    .post(
        (req, res) => {
            // console.log("Add Category");
            return addCategory(req, res);
        }
    )

module.exports = router