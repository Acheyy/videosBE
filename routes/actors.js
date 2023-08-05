const express = require("express");
const { getActors, addActor, getSingleActor,getFeaturedActors } = require("../controllers/actors");

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
  router
  .route("/get-featured-actors")
  .get((req, res) => {
    console.log("Get Featured Actors")
    return getFeaturedActors(req, res)
  })
router
  .route("/:actorName")
  .get((req, res) => {
    console.log("Get Single Actor")
    return getSingleActor(req, res)
  })

module.exports = router;
