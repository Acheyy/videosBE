const express = require("express");
const {
    getUsers,
    addUser,
    loginUser,
    refreshAccessToken,
    getAccountInfo,
    getUserHistory,
    getUserLiked,
    upgradeToPremium,
    upgradeToPremium2,
    sendConfirmation,
    forgotPassword,
    resetPassword,
    addCoinsToUser,
    setPurchaseIntent,
    purchaseVideo
} = require("../controllers/users")

const router = express.Router()

router
    .route("/")
    .get(
        (req, res) => {
            // console.log("List Users");
            return getUsers(req, res);
        }
    )
    .post(
        (req, res) => {
            // console.log("Add User");
            return addUser(req, res);
        }
    )
router
    .route("/login")
    .post(
        (req, res) => {
            // console.log("Login User");
            return loginUser(req, res);
        }
    )
router
    .route("/refreshToken")
    .post(
        (req, res) => {
            // console.log("Refresh Access Token")
            return refreshAccessToken(req, res)
        }
    )
router
    .route("/getInfo")
    .get(
        (req, res) => {
            // console.log("Get User Information")
            return getAccountInfo(req, res)
        }
    )
router
    .route("/getUserHistory")
    .get(
        (req, res) => {
            // console.log("Get User History")
            return getUserHistory(req, res)
        }
    )
router
    .route("/getUserLiked")
    .get(
        (req, res) => {
            // console.log("Get User Liked")
            return getUserLiked(req, res)
        }
    )

router
    .route("/upgradeToPremium")
    .post(
        (req, res) => {
            // console.log("Upgrade to premium")
            return upgradeToPremium(req, res)
        }
    )
router
    .route("/upgradeToPremium2")
    .post(
        (req, res) => {
            console.log("Upgrade to premium2")
            return upgradeToPremium2(req, res)
        }
    )
router
    .route("/set-purchase-intent")
    .post(
        (req, res) => {
            console.log("Set purchase intent")
            return setPurchaseIntent(req, res)
        }
    )

router
    .route("/addCoinsToUser")
    .post(
        (req, res) => {
            // console.log("Add Coins to user")
            return addCoinsToUser(req, res)
        }
    )

router
    .route("/purchaseVideo")
    .post(
        (req, res) => {
            // console.log("Purchase video")
            return purchaseVideo(req, res)
        }
    )

router
    .route("/sendConfirmation")
    .post(
        (req, res) => {
            // console.log("Send confirmation email")
            return sendConfirmation(req, res)
        }
    )

router
    .route("/forgotPassword")
    .post(
        (req, res) => {
            // console.log("Forgot password")
            return forgotPassword(req, res)
        }
    )
    
router
    .route("/resetPassword")
    .post(
        (req, res) => {
            // console.log("Reset password confirmation")
            return resetPassword(req, res)
        }
    )



module.exports = router