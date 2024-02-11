const axios = require("axios");
const Payment = require("../models/Payment");
const jwt = require("jsonwebtoken");
const User = require("../models/User");


exports.addPayment = async (req, res) => {
    try {
        const { userID, purchasedItem, currency, payAmount } = req.body;

        const nowPaymentsResponse = await axios.post("https://api.nowpayments.io/v1/payment", {
            price_amount: payAmount,
            price_currency: "usd",
            pay_currency: currency,
        }, {
            headers: {
                "x-api-key": "JTHEKWY-6EJ4KN0-PDEABBZ-TZDSGAT",
                "Content-Type": "application/json",
            }
        });

        if (nowPaymentsResponse.data) {
            const paymentData = nowPaymentsResponse.data;

            const gallery = new Payment({
                userID,
                paymentId: paymentData.payment_id,
                purchasedItem: purchasedItem,
                status: paymentData.payment_status,
                payAmount: paymentData.pay_amount,
                pay_address: paymentData.pay_address,
                pay_amount: paymentData.pay_amount,
            });
            await gallery.save();
            res.status(200).send(gallery);
        } else {
            throw new Error('No data received from NOWPayments API');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getSinglePayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await Payment.findOne({ _id: paymentId })

        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

        res.send(payment);
    } catch (err) {
        console.error(err.message);
    }
};