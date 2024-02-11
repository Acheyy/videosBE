const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

    paymentId: String,
    status: String,
    purchasedItem: String,
    pay_address: String,
    itemAddedToUser: Boolean,
    pay_amount: Number,
    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    createdAt: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    },
    updatedAt: {
        type: Date,
        default: () => Date.now()
    },

})
module.exports = mongoose.model("Payment", paymentSchema)