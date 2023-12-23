const axios = require('axios');
const Category = require("../models/Category");

exports.getCategories = async (_, res) => {
    try {
        const category = await Category.find()
        res.send(category)
    } catch (err) {
        console.error(err.message)
    }
}

exports.addCategory = async (req, res) => {
    try {
        const category = new Category({
            name: req.body.name,
        })
        await category.save();
        // console.log(category)
        res.send(category)

    } catch (err) {
        console.error(err.message)
    }
}
