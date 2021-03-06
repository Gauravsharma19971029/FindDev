const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

//Load profile model
const Profile = require("../../models/Profile");

//Load User model
const User = require("../../models/User");

//Load Profile validator
const validateProfileInput = require("../../validation/profile");

//Load Experience validator
const validateExperienceInput = require("../../validation/experience");

//Load Experience validator
const validateEducationInput = require("../../validation/education");

//@route GET api/profile/test
//@desc  Test Profile route
//@access Public

router.get("/test", (req, res) => {
  res.json({ msg: "Profile Works" });
});

//@route GET api/profile
//@desc  Get Current users profile
//@access Private

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    console.log("get user profile");
    const errors = {};
    Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "avatar"])
      .then((profile) => {
        console.log("Profile", profile);
        if (!profile) {
          console.log("inside");
          errors.noprofile = "There is no Profile for this user";
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch((err) => {
        console.log("Error", err);
        res.status(404).send(err);
      });
  }
);

//@route Get api/profile/handle/:handle
//@desc  Get profile by handle
//@access Public
router.get("/all", (req, res) => {
  Profile.find({})
    .populate("user", ["name", "avatar"])
    .then((profiles) => res.json(profiles))
    .catch((err) =>
      res.status(404).json({ profile: "There is no profile present" })
    );
});

//@route Get api/profile/handle/:handle
//@desc  Get profile by handle
//@access Public

router.get("/handle/:handle", (req, res) => {
  const errors = {};
  console.log("Inside getting profile by handle");
  Profile.findOne({ handle: req.params.handle })
    .populate("user", ["name", "avatar"])
    .then((profile) => {
      if (!profile) {
        errors.noprofile = "No profile for user";
        res.status(404).json(errors);
      } else {
        res.json(profile);
      }
    })
    .catch((err) =>
      res.status(404).json({ profile: "There is no profile for user" })
    );
});

//@route Get api/profile/user/:userId
//@desc  Get profile by handle
//@access Public

router.get("/users/:userId", (req, res) => {
  const errors = {};
  Profile.findOne({ user: req.params.userId })
    .populate("user", ["name", "avatar"])
    .then((profile) => {
      if (!profile) {
        errors.noprofile = "No profile for user";
        res.status(404).json(errors);
      } else {
        res.json(profile);
      }
    })
    .catch((err) =>
      res.status(404).json({ profile: "There is no profile for user" })
    );
});

//@route Post api/profile
//@desc  Post Current users profile
//@access Private

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    console.log("req.body = ", req.body);
    const { errors, isValid } = validateProfileInput(req.body);

    //Check Validation
    if (!isValid) {
      //Return any errors
      return res.status(400).json(errors);
    }

    //Get fields
    const profileFields = {};
    profileFields.user = req.user.id;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.status) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.githubusername)
      profileFields.githubusername = req.body.githubusername;

    //Skills - Split into array
    if (typeof req.body.skills !== "undefined") {
      profileFields.skills = req.body.skills.split(",");
    }

    //Social
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id }).then((profile) => {
      if (profile) {
        console.log("inside profile update");
        //Update
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields }
        ).then((profile) => res.json(profile));
      } else {
        //Create

        //Check if handle exists
        Profile.findOne({ handle: profileFields.handle }).then((profile) => {
          if (profile) {
            errors.handle = "That handle already exists";
            res.status(400).json(errors);
          } else {
            //Save profile
            new Profile(profileFields)
              .save()
              .then((profile) => res.json(profile));
          }
        });
      }
    });
  }
);

//@route Post api/profile/experience
//@desc  Post Experience of user
//@access Private

router.post(
  "/experience",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then((profile) => {
      console.log("req.body = ", req.body);
      const { errors, isValid } = validateExperienceInput(req.body);

      //Check Validation
      if (!isValid) {
        //Return any errors
        return res.status(400).json(errors);
      }

      let current = false;
      if (!req.body.to) {
        current = true;
      }

      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current,
        description: req.body.description,
      };

      //Add to Experience array
      profile.experience.unshift(newExp);
      profile
        .save()
        .then((profile) => res.json(profile))
        .catch((err) => {
          console.log("Error", err);
          res.status(500).json("Error in adding experience");
        });
    });
  }
);

//@route Post api/profile/education
//@desc  Post Education of user
//@access Private

router.post(
  "/education",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then((profile) => {
      console.log("req.body = ", req.body);
      const { errors, isValid } = validateEducationInput(req.body);

      //Check Validation
      if (!isValid) {
        //Return any errors
        return res.status(400).json(errors);
      }

      const newEdu = {
        school: req.body.school,
        degree: req.body.degree,
        fieldofstudy: req.body.fieldofstudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description,
      };

      //Add to Education array
      profile.education.unshift(newEdu);
      profile
        .save()
        .then((profile) => res.json(profile))
        .catch((err) => {
          console.log("Error", err);
          res.status(500).json("Error in adding education");
        });
    });
  }
);

//@route DELETE api/profile/experience/:expId
//@desc  delete Experience of user
//@access Private

router.delete(
  "/experience/:expId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Profile.findOne({ user: req.user.id }).then((profile) => {
      //Get Remove index
      const removeIndex = profile.experience
        .map((item) => item.id)
        .indexOf(req.params.expId);

      //Splice out of array
      profile.experience.splice(removeIndex, 1);

      //Save
      profile
        .save()
        .then((profile) => res.json(profile))
        .catch((err) => res.status(404).json({ experiencedelete: err }));
    });
  }
);

//@route DELETE api/profile/education/:eduId
//@desc  delete Education of user
//@access Private

router.delete(
  "/education/:eduId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Profile.findOne({ user: req.user.id }).then((profile) => {
      //Get Remove index
      const removeIndex = profile.education
        .map((item) => item.id)
        .indexOf(req.params.eduId);

      //Splice out of array
      profile.education.splice(removeIndex, 1);

      //Save
      profile
        .save()
        .then((profile) => res.json(profile))
        .catch((err) => res.status(404).json({ educationdelete: err }));
    });
  }
);

//@route DELETE api/profile/
//@desc  delete Education of user
//@access Private

router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOneAndRemove({ user: req.user.id })
      .then(() => {
        User.findOneAndRemove({ _id: req.user.id })
          .then(() => res.json({ success: true }))
          .catch((err) => {
            console.log("Error", err);
            res.status(500).send(err);
          });
      })
      .catch((err) => {
        console.log("Error", err);
        res.status(500).send(err);
      });
  }
);

module.exports = router;
