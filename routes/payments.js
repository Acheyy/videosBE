const express = require("express");
const {
  addPayment,
  getPayments,
  getSinglePayment,
} = require("../controllers/payments");

const router = express.Router();

router
  .route("/")
  .get((req, res) => {
    // console.log("List Videos");
    return getPayments(req, res);
  })
  .post((req, res) => {
    // console.log("Add video");
    return addPayment(req, res);
  })
  
router.route("/:paymentId").get((req, res) => {
    // console.log("Get Single Video");
    return getSinglePayment(req, res);
  });
  
module.exports = router;