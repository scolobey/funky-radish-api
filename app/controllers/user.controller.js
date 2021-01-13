const { v4: uuidv4 } = require('uuid');

const User = require('../models/user.model.js');
const Recipe = require('../models/recipe.model.js');
const TokenService = require('../services/token_service.js');
const EmailService = require('../services/email_service.js');

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

  const payload = {
    admin: false,
    user: req.body.name,
    id: uuidv4()
  };

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
        user: userData._id
      };

      console.log("trying that asynch call")

      TokenService.asynchToken(payload)
        .then((token) => {
          EmailService.sendVerificationEmail(userData.email, userData._id, token)
            .then(() => {
              res.json({ message: "Verification email sent.", token: "", error: "" });
            })
            .catch((error) => {
                console.log("Error", error);
                res.json({ message: "Verification email sending failure.", token: "", error: error });
            })
      }).catch((error) => {
          console.log("Error", error);
          res.json({ message: "Token creation failed.", token: "", error: error });
      })

    }).catch(err => {
      res.json({ message: "User creation failed.", token: "", error: err });
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
     if(!req.body.email || !req.body.name || !req.body.password) {
         return res.status(400).send({
             message: "User cannot be empty."
         });
     }

     // Find and update user from request body
     User.findByIdAndUpdate(req.params.userId, {
         name: req.body.name,
         email: req.body.email,
         password: req.body.password,
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
