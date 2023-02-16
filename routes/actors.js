const express = require("express");
const { getActors, addActor } = require("../controllers/actors");

const router = express.Router();

router
  .route("/")
  .get((req, res) => {
    console.log("List Actors");
    return getActors(req, res);
  })
  .post((req, res) => {
    console.log("Add Actor");
    return addActor(req, res);
  });

module.exports = router;
