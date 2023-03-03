const axios = require('axios');
const User = require("../models/User");
const jwt = require('jsonwebtoken');

exports.getUsers = async (_, res) => {
    try {
        const tag = await User.find()
        console.log(tag)
        res.send(tag)
    } catch (err) {
        console.error(err.message)
    }
}

exports.addUser = async (req, res) => {
    try {
        const user = new User({
            userName: req.body.userName,
            email: req.body.email,
            password: req.body.password,
        })
        await user.save();
        console.log(user)
        res.send(user)

    } catch (err) {
        console.error(err.message)
    }
}

exports.loginUser = async (req, res) => {
    try {
        const { userName, password } = req.body;
        const user = await User.findOne({ userName: userName });
        if (!user || user.password != password) {
            return res.status(401).send("Incorrect userName or password");
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user)

        return res.send({ accessToken, refreshToken, user })
    } catch (err) {
        console.error(err.message)
    }
}

exports.getAccountInfo = async (req, res) => {
    try {
        const cookie = req.headers.cookie;
        const authCookie = cookie ? cookie.split(';').find(c => c.trim().startsWith('token=')) : null;
        const token = authCookie ? authCookie.split('=')[1] : null;
        console.log("token", token)
        if (token == null) return res.status(403).json({ error: "Forbidden" }).stat

        jwt.verify(token, process.env.TOKEN_SECRET, async (err, user) => {

            if (err) return res.status(403).json({ error: "Forbidden" }).stat

            req.user = user

            const userDB = await User.findOne({ userName: user.userName });
            return res.send({ userDB })
        })

    } catch (err) {
        console.error(err.message)
    }
}

exports.refreshAccessToken = async (req, res) => {
    try {

        const newAccessToken = await refreshAccessToken(req.body.refresh_token)

        return res.send({ newAccessToken: newAccessToken })
    } catch (err) {
        console.error(err.message)
    }
}

function generateAccessToken(user) {
    const accessToken = jwt.sign({ userName: user.userName }, process.env.TOKEN_SECRET, { expiresIn: '7d' });
    return accessToken;
}

function generateRefreshToken(user) {
    const refreshToken = jwt.sign({ userName: user.userName }, process.env.REFRESH_TOKEN_SECRET);
    return refreshToken;

}

async function refreshAccessToken(refreshToken) {
    try {

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        console.log("decoded", decoded)

        const user = await User.findOne({ userName: decoded.userName });
        if (!user) {
            console.log('User not found');
        }

        const accessToken = generateAccessToken(user);
        return accessToken;
    } catch (err) {
        console.log(err);
        console.log('Invalid token');
    }
}
