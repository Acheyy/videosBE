const axios = require("axios");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const mailer = require('../mailer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

exports.getUsers = async (_, res) => {
    try {
        const tag = await User.find();
        console.log(tag);
        res.send(tag);
    } catch (err) {
        console.error(err.message);
    }
};

exports.addUser = async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already in use" });
        }

        const user = new User({
            userName: req.body.userName,
            email: req.body.email,
            password: req.body.password,
        });
        await user.save();
        console.log(user);
        res.send(user);
    } catch (err) {
        console.error(err.message);
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { userName, password } = req.body;
        const user = await User.findOne({ userName: userName });
        if (!user || user.password != password) {
            return res.status(401).send("Incorrect userName or password");
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        return res.send({ accessToken, refreshToken, user });
    } catch (err) {
        console.error(err.message);
    }
};

exports.getAccountInfo = async (req, res) => {
    try {
        const cookie = req.headers.cookie;
        const authCookie = cookie
            ? cookie.split(";").find((c) => c.trim().startsWith("token="))
            : null;
        const token = authCookie ? authCookie.split("=")[1] : null;
        console.log("token", token);
        if (token == null) return res.status(403).json({ error: "Forbidden" }).stat;

        jwt.verify(token, process.env.TOKEN_SECRET, async (err, user) => {
            if (err) return res.status(403).json({ error: "Forbidden" }).stat;

            req.user = user;

            const userDB = await User.findOne({ userName: user.userName });
            return res.send({ userDB });
        });
    } catch (err) {
        console.error(err.message);
    }
};

exports.upgradeToPremium = async (req, res) => {
    try {
        const userId = req.body.userId; // Assuming the user ID is available in the req.user object
        const transactionId = req.body.transactionId; // Assuming the user ID is available in the req.user object
        const premiumDuration = 30; // Duration of the premium subscription in days
        const currentDate = new Date();
        const premiumExpiry = new Date(
            currentDate.setDate(currentDate.getDate() + premiumDuration)
        );

        await User.findByIdAndUpdate(userId, {
            isUserPremium: true,
            premiumExpiry: premiumExpiry,
            transactionId: transactionId
        });

        res.status(200).json({ message: "User upgraded to premium successfully." });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
};


exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        // Verify user's email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Generate a unique token
        const token = crypto.randomBytes(20).toString('hex');

        // Set token and expiration time to the user's account
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        console.log(user)
        await user.save();

        // Send an email to the user containing the token and a link to reset the password
        const resetUrl = `https://skbj.tv/reset-password?token=${token}`;
        const message = `Hello <strong>${user.userName}</strong>. Please click the following link to reset your password: ${resetUrl}`;

        await mailer.sendMail({
            from: 'SBKJ <contact@skbj.tv>',
            to: email,
            subject: "Password Reset Request",
            html: message
        });
        res.status(200).json({ message: 'A password reset email has been sent.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
};


exports.resetPassword = async (req, res) => {
    try {
        const { newPassword, token } = req.body;
        // Verify the token and check if it's still valid
        const user = await User.findOne({
            resetPasswordToken: token,
        });
        console.log(user)

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Allow the user to set a new password
        user.password = newPassword;

        // Save the new password and clear the reset token and expiration time
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};


exports.sendConfirmation = async (req, res) => {
    const { to, subject, text, username } = req.body;

    try {
        // Render the EJS template
        const templatePath = path.resolve(__dirname, '..', 'views', 'account_created.ejs');

        // Check if the file exists
        if (!fs.existsSync(templatePath)) {
            return res.status(500).json({ success: false, message: `Template file not found at ${templatePath}` });
        }

        const html = await ejs.renderFile(templatePath, { username });

        const info = await mailer.sendMail({
            from: 'SBKJ <contact@skbj.tv>',
            to,
            subject: "Confirmation Email",
            html: html, // Send the rendered HTML as the email content
        });

        res.status(200).json({ success: true, message: 'Email sent', info });
    } catch (error) {
        console.error('Error details:', error);
        res.status(500).json({ success: false, message: 'Error sending email', error: error.message || error });
    }

};

exports.getUserHistory = async (req, res) => {
    try {
        const cookie = req.headers.cookie;
        const authCookie = cookie
            ? cookie.split(";").find((c) => c.trim().startsWith("token="))
            : null;
        const token = authCookie ? authCookie.split("=")[1] : null;

        console.log("token", token);
        if (token == null) return res.status(403).json({ error: "Forbidden" }).stat;

        jwt.verify(token, process.env.TOKEN_SECRET, async (err, user) => {
            if (err) return res.status(403).json({ error: "Forbidden" }).stat;

            req.user = user;

            const userDB = await User.findOne({ userName: user.userName }).populate({
                path: "history",
                model: "Video", // Specify the model name for the video collection
                populate: [
                    { path: "actor" },
                    { path: "category" },
                    { path: "views" },
                ],
            });

            console.log(userDB.history);

            res.send({
                videos: userDB.history,
            });
        });
    } catch (err) { }
};

exports.getUserLiked = async (req, res) => {
    try {
        const cookie = req.headers.cookie;
        const authCookie = cookie
            ? cookie.split(";").find((c) => c.trim().startsWith("token="))
            : null;
        const token = authCookie ? authCookie.split("=")[1] : null;

        console.log("token", token);
        if (token == null) return res.status(403).json({ error: "Forbidden" }).stat;

        jwt.verify(token, process.env.TOKEN_SECRET, async (err, user) => {
            if (err) return res.status(403).json({ error: "Forbidden" }).stat;

            req.user = user;

            const userDB = await User.findOne({ userName: user.userName }).populate({
                path: "liked",
                model: "Video", // Specify the model name for the video collection
                populate: [
                    { path: "actor" },
                    { path: "category" },
                    { path: "views" },
                ],
            });

            console.log(userDB.liked);

            res.send({
                videos: userDB.liked,
            });
        });
    } catch (err) { }
};

exports.refreshAccessToken = async (req, res) => {
    try {
        const newAccessToken = await refreshAccessToken(req.body.refresh_token);

        return res.send({ newAccessToken: newAccessToken });
    } catch (err) {
        console.error(err.message);
    }
};

function generateAccessToken(user) {
    const accessToken = jwt.sign(
        { userName: user.userName },
        process.env.TOKEN_SECRET,
        { expiresIn: "30d" }
    );
    return accessToken;
}

function generateRefreshToken(user) {
    const refreshToken = jwt.sign(
        { userName: user.userName },
        process.env.REFRESH_TOKEN_SECRET
    );
    return refreshToken;
}

async function refreshAccessToken(refreshToken) {
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        console.log("decoded", decoded);

        const user = await User.findOne({ userName: decoded.userName });
        if (!user) {
            console.log("User not found");
        }

        const accessToken = generateAccessToken(user);
        return accessToken;
    } catch (err) {
        console.log(err);
        console.log("Invalid token");
    }
}
