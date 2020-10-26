const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

//Load post model
const Post = require("../../models/Post");

const Profile = require("../../models/Profile");

//Load User model
const User = require("../../models/User");

//Load Post validator
const validatePostInput = require("../../validation/post");

//Load comment validator
const validateCommentInput = require("../../validation/comment");

//@route GET api/posts/test
//@desc  Test Posts route
//@access Public

router.get("/test", (req, res) => {
  res.json({ msg: "Post Works" });
});

//@route Get api/posts
//@desc  get Posts
//@access Public

router.get("/", (req, res) => {
  const errors = {};
  Post.find()
    .sort({ date: -1 })
    .then((posts) => res.json(posts))
    .catch((err) => {
      errors.nopostfound = "No Post found ";
      res.status(500).json({ errors });
    });
});

//@route Get api/posts/:id
//@desc  get Posts
//@access Public

router.get("/:id", (req, res) => {
  const errors = {};
  Post.findById(req.params.id)
    .then((post) => {
      if (!post) {
        res.status(404).json(errors);
      }
      res.json(post);
    })
    .catch((err) => {
      errors.nopostfound = "No Post found for id";
      res.status(500).json({ errors });
    });
});

//@route Post api/posts
//@desc  Create Post
//@access Private

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    //Check Validation
    if (!isValid) {
      //Return any errors
      return res.status(400).json(errors);
    }
    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id,
    });

    newPost
      .save()
      .then((post) => res.json(post))
      .catch((err) => res.status(500).send(err));
  }
);

//@route Post api/posts/like/:postId
//@desc  Like Post
//@access Private

router.post(
  "/like/:postId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Post.findById(req.params.postId)
      .then((post) => {
        if (
          post.likes.filter((like) => like.user.toString() === req.user.id)
            .length > 0
        ) {
          return res
            .status(400)
            .json({ alreadyliked: "User Already liked this post" });
        }

        //Add user id to likes array
        post.likes.unshift({ user: req.user.id });
        post
          .save()
          .then((post) => res.json(post))
          .catch((err) => res.status(500).send(err));
      })
      .catch((err) => {
        errors.nopostfound = "No Post found for id";
        res.status(500).send(errors);
      });
  }
);

//@route Post api/posts/unlike/:postId
//@desc  unlike Post
//@access Private

router.post(
  "/unlike/:postId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Post.findById(req.params.postId)
      .then((post) => {
        if (
          post.likes.filter((like) => like.user.toString() === req.user.id)
            .length === 0
        ) {
          return res.status(400).json({ notliked: "User Not liked this post" });
        }

        //Add remove index
        const removeIndex = post.likes
          .map((item) => item.user.toString())
          .indexOf(req.user.id);

        //Splice out of array
        post.likes.splice(removeIndex, 1);
        post
          .save()
          .then((post) => res.json(post))
          .catch((err) => res.status(500).send(err));
      })
      .catch((err) => {
        errors.nopostfound = "No Post found for id";
        console.log("Error", err);
        res.status(500).send(errors);
      });
  }
);

//@route Delete api/posts/:id
//@desc  delete Post
//@access Private

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Post.findById(req.params.id)
      .then((post) => {
        //Check for post owner
        if (post.user.toString() !== req.user.id) {
          res.status(401).json({ notauthorized: "User not authorized" });
        }

        //Delete Post
        post.remove().then(() => res.json({ success: true }));
      })
      .catch((err) => {
        errors.postnotfound = "No Post Found";
        res.status(404).json(errors);
      });
  }
);

//@route Post api/posts/comment/:postId
//@desc  add comment to Post
//@access Private

router.post(
  "/comment/:postId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateCommentInput(req.body);

    //Check Validation
    if (!isValid) {
      //Return any errors
      return res.status(400).json(errors);
    }
    Post.findById(req.params.postId)
      .then((post) => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id,
        };

        //Add comments to array
        post.comments.unshift(newComment);

        //save
        post
          .save()
          .then((post) => res.json(post))
          .catch((err) => res.status(500).send(err));
      })
      .catch((err) => {
        errors.nopostfound = "No Post found for id";
        console.log("Error", err);
        res.status(500).send(errors);
      });
  }
);

//@route Delete api/posts/comment/:postId/:commentId
//@desc  delete comment from Post
//@access Private

router.delete(
  "/comment/:postId/:commentId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Post.findById(req.params.postId)
      .then((post) => {
        //Check if comment exists
        if (
          post.comments.filter(
            (comment) => comment._id.toString() === req.params.commentId
          ).length === 0
        ) {
          errors.commentnotexists = "Comment doesn't exists";
          return res.status(404).json(errors);
        }

        //Get remove index
        const removeIndex = post.comments
          .map((comment) => comment._id)
          .indexOf(req.params.commentId);

        //Splice out of array
        post.comments.splice(removeIndex, 1);
        post
          .save()
          .then((post) => res.json(post))
          .catch((err) => res.status(500).send(err));
      })
      .catch((err) => {
        errors.nopostfound = "No Post found for id";
        console.log("Error", err);
        res.status(500).send(errors);
      });
  }
);

module.exports = router;
