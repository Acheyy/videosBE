const express = require("express");
const {
  getActors,
  addActor,
  getSingleActor,
  getFeaturedActors,
  getMostVieweddActors,
  getMostLikedActors,
  getMostLikedActorsWeekly,
  likeActor,
  getFollowingActors,
} = require("../controllers/actors");

const router = express.Router();

router
  .route("/")
  .get((req, res) => {
    // console.log("List Actors");
    return getActors(req, res);
  })
  .post((req, res) => {
    // console.log("Add Actor");
    return addActor(req, res);
  });
router.route("/get-featured-actors").get((req, res) => {
  // console.log("Get Featured Actors");
  return getFeaturedActors(req, res);
});
router.route("/like/:actorId").get((req, res) => {
  // console.log("Like actor");
  return likeActor(req, res);
});
router.route("/get-most-viewed-actors").get((req, res) => {
  // console.log("Get Most Viewed Actors");
  return getMostVieweddActors(req, res);
});
router.route("/following").get((req, res) => {
  // console.log("Get Following Actors");
  return getFollowingActors(req, res);
});
router.route("/get-most-liked-actors-weekly").get((req, res) => {
  // console.log("Get Most Liked Actors Weekly");
  return getMostLikedActorsWeekly(req, res);
});
router.route("/get-most-liked-actors").get((req, res) => {
  // console.log("Get Most Liked Actors");
  return getMostLikedActors(req, res);
});
router.route("/:actorName").get((req, res) => {
  // console.log("Get Single Actor");
  return getSingleActor(req, res);
});

module.exports = router;
