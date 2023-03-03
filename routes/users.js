const express = require("express");
const {
    getUsers,
    addUser,
    loginUser,
    refreshAccessToken,
    getAccountInfo
} = require("../controllers/users")

const router = express.Router()
  
router
    .route("/")
    .get(
        (req, res) => {
            console.log("List Users");
            return getUsers(req, res);
        }
    )
    .post(
        (req, res) => {
            console.log("Add User");
            return addUser(req, res);
        }
    )
router
    .route("/login")
    .post(
        (req, res) => {
            console.log("Login User");
            return loginUser(req, res);
        }
    )
router
    .route("/refreshToken")
    .post(
        (req, res) => {
            console.log("Refresh Access Token")
            return refreshAccessToken(req, res)
        }
    )
router
    .route("/getInfo")
    .get(
        (req, res) => {
            console.log("Get User Information")
            return getAccountInfo(req, res)
        }
    )
module.exports = router