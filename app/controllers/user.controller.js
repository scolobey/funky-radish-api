const User = require('../models/user.model.js');
const Recipe = require('../models/recipe.model.js');
const Seed = process.env.SEED;
const jwt    = require('jsonwebtoken');

// Create and Save a new User
exports.create = (req, res) => {
  console.log(req.body)

  // Validate
  if(!req.body.email || !req.body.name || !req.body.password) {
      return res.status(400).send({
          message: "User must have a name, email and password."
      });
  }

  // Create
  const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      admin: req.body.admin || false
  });

  // Save
  user.save()
  .then(userData => {

    // Generate a token
    const payload = {
      admin: userData.admin,
      user: userData._id
    };
    var token = jwt.sign(payload, Seed, {
      expiresIn: 86400 // expires in 24 hours
    });

    // Compile recipes
    var recipeList = []

    for(var i=0 ; i<req.body.recipes.length ; i++){
      // Create and add to queue for saving.
      const recipe = new Recipe({
        realmID: req.body.recipes[i].realmID || "",
        title: req.body.recipes[i].title,
        ingredients: req.body.recipes[i].ingredients,
        directions: req.body.recipes[i].directions,
        _id: req.body.recipes[i]._id,
        updatedAt: req.body.recipes[i].updatedAt,
        author: {_id: userData._id}
      });
      recipeList.push(recipe)
    }

    Recipe.insertMany(recipeList)
      .then(function(recipeData) {
        userData.recipes = recipeData
        res.json({message: "User created successfully.", token: token, userData});
      })
      .catch(function(err) {
        // res.status(500).send({
        //   message: err.message || "Error occurred while creating Recipes."
        // });
        res.json({message: "User created, but recipe creation was incomplete.", token: token, userData});
      });

  }).catch(err => {
      res.status(500).send({
          message: err.message || "Error occurred while creating User."
      });
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
