const { v4: uuidv4 } = require('uuid');

const User = require('../models/user.model.js');
const Recipe = require('../models/recipe.model.js');
const TokenService = require('../services/token_service.js');
const EmailService = require('../services/email_service.js');

const config = require('config');
const realmKey = config.get('RealmKey');

// Create and Save a new User
exports.create = (req, res) => {
  // Validate
  if(!req.body.email || !req.body.password) {
    return res.status(400).send({
      message: "User must have a name, email and password.", token: ""
    });
  }

  if(!req.body.name) {
    req.body.name = req.body.email
  }

  console.log("create", req.body.email)

  // // Create
  const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      admin: false,
      verified: false
  });

  user.save()
    .then(userData => {
      const payload = {
        admin: userData.admin,
        user: req.body.email,
        sub: userData._id,
        aud: realmKey,
        realmUser: ""
      }


      console.log("trying that asynch call: ", payload.user)

      TokenService.asynchToken(payload)
        .then((token) => {
          EmailService.sendVerificationEmail(userData.email, userData._id, token)
            .then(() => {
              res.json({ message: "Verification email sent.", token: "", error: "" });
            })
            .catch((error) => {
                console.log("Error", error);
                res.json({ message: "Verification email sending failure.", token: "", error: error.message || "error without message" });
            })
      }).catch((error) => {
          console.log("Error", error);
          res.json({ message: "Token creation failed.", token: "", error: error.message || "error without message" });
      })

    }).catch(err => {
      res.json({ message: err.message || "error without message", token: "", error: err.message || "error without message" });
    });
};

// Retrieve and return all users from the database.
exports.findAll = (req, res) => {
  User.find()
     .then(users => {
         res.send(users);
     }).catch(err => {
         res.status(500).send({
             message: err.message || "Error occurred while retrieving Users."
         });
     });
};

// Find a single user with a userId
exports.findOne = (req, res) => {
  User.findById(req.params.userId, { password: 0 })
      .then(user => {
          if(!user) {
              return res.status(404).send({
                  message: "User not found. userId = " + req.params.userId
              });
          }
          res.send(user);
      }).catch(err => {
          if(err.kind === 'ObjectId') {
              return res.status(404).send({
                  message: "No user found with id: " + req.params.userId
              });
          }
          return res.status(500).send({
              message: "Error retrieving user with id: " + req.params.userId
          });
      });
};

// Update a user identified by the userId in the request
exports.update = (req, res) => {
  // Validate
     if(!req.body.email || !req.body.password) {
         return res.status(400).send({
             message: "User cannot be empty."
         });
     }

     // Find and update user from request body
     User.findByIdAndUpdate(req.params.userId, {
         email: req.body.email,
         password: req.body.password,
         realmUser: req.body.realmUser,
         admin: req.body.admin || false
     }, {new: true})
     .then(user => {
         if(!user) {
             return res.status(404).send({
                 message: "User not found. userId = " + req.params.userId
             });
         }
         res.send(user);
     }).catch(err => {
         if(err.kind === 'ObjectId') {
             return res.status(404).send({
                 message: "No user found with id: " + req.params.userId
             });
         }
         return res.status(500).send({
             message: "Error updating user with id: " + req.params.userId
         });
     });
};

// Update a user's realmUSer identified by the userId in the request
exports.updateRealmUser = (req, res) => {
    // If the token has a realmUser, fuggedaboutit.
    if (req.decoded.realmUser.length > 0) {
      console.log("realmUser set: " + req.decoded.realmUser)
      User.findById(req.decoded.sub, { password: 0 })
      .then(user => {
          if(!user) {
              return res.status(404).send({
                  message: "User not found. userId = " + req.params.userId
              });
          }
          res.send(user);
      }).catch(err => {
          if(err.kind === 'ObjectId') {
              return res.status(404).send({
                  message: "No user found with id: " + req.params.userId
              });
          }
          return res.status(500).send({
              message: "Error retrieving user with id: " + req.params.userId
          });
      });
    }
    else {
      // Else, find and update user from request body
      User.findByIdAndUpdate(req.decoded.sub, {
          realmUser: req.body.realmUser
      }, {new: true})
      .then(user => {
          if(!user) {
              return res.status(404).send({
                  message: "User not found. userId = " + req.params.userId
              });
          }
          res.send(user);
      }).catch(err => {
          if(err.kind === 'ObjectId') {
              return res.status(404).send({
                  message: "No user found with id: " + req.params.userId
              });
          }
          return res.status(500).send({
              message: "Error updating user with id: " + req.params.userId
          });
      });
    }
};

// Delete the user specified by the userId in the request
exports.delete = (req, res) => {
  User.findByIdAndRemove(req.params.userId)
      .then(user => {
          if(!user) {
              return res.status(404).send({
                  message: "User not found. userId = " + req.params.userId
              });
          }
          res.send({message: "User deleted successfully!"});
      }).catch(err => {
          if(err.kind === 'ObjectId' || err.name === 'NotFound') {
              return res.status(404).send({
                  message: "User not found. userId = " + req.params.userId
              });
          }
          return res.status(500).send({
              message: "Error deleting user with id: " + req.params.userId
          });
      });
};

exports.resetPassword = (req, res) => {
  console.log("hit the method: " + req.params.userId)
  // Send an email to the user with a link to reset their email.

  let payload = {
    userId: req.params.userId
  }

  User.findById(req.params.userId, { password: 0 })
  .then(user => {
      if(!user) {
          return res.status(404).send({
              message: "User not found. userId = " + req.params.userId
          });
      }
      TokenService.asynchToken(payload)
        .then((token) => {
          EmailService.sendPasswordResetEmail(user.email, token)
            .then(() => {
              res.json({ message: "Password reset email sent.", token: "", error: "" });
            })
            .catch((error) => {
              console.log("Error", error);
              res.json({ message: "Password reset email sending failure.", token: "", error: error.message || "error without message" });
            })
      }).catch((error) => {
          console.log("Error", error);
          res.json({ message: "Token creation failed.", token: "", error: error.message || "error without message" });
      })
  }).catch(err => {
      if(err.kind === 'ObjectId') {
          return res.status(404).send({
              message: "No user found with id: " + req.params.userId
          });
      }
      return res.status(500).send({
          message: "Error retrieving user with id: " + req.params.userId
      });
  });
};

exports.changePassword = (req, res) => {
  // Else, find and update user from request body

  console.log("newPassword: " + req.body.newPassword)
  console.log("user: " + req.decoded.userId)

  User.findByIdAndUpdate(req.decoded.userId, {
    password: req.body.newPassword
  }, {new: false})
  .then(user => {
    if(!user) {
      return res.status(404).send({
        message: "User not found. userId = " + req.decoded.userId
      });
    }
    res.send(user);
  }).catch(err => {
    if(err.kind === 'ObjectId') {
      return res.status(404).send({
        message: "No user found with id: " + req.params.userId
      });
    }
    return res.status(500).send({
      message: "Error updating user with id: " + req.params.userId
    });
  });

};
