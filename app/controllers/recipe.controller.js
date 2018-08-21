const Recipe = require('../models/recipe.model.js');
const Seed = require('../../config/authentication.config.js').secret;
const jwt    = require('jsonwebtoken');

// Create and Save a new Recipe
exports.create = (req, res) => {
  // Validate
  if(req.body.directions.length == 0 && !req.body.title && req.body.ingredients.length == 0 ) {
      return res.status(400).send({
          message: "Recipe cannot be empty."
      });
  }

  // Create
  const recipe = new Recipe({
      title: req.body.title,
      ingredients: req.body.ingredients,
      directions: req.body.directions,
      author: req.body.author
  });

  // Save
  recipe
  .populate('author')
  .save()
  .then(data => {
      res.send(data);
  }).catch(err => {
      res.status(500).send({
          message: err.message || "Error occurred while creating Recipe."
      });
  });
};

// Retrieve and return all recipes from the database belonging to the user specified in the token.
exports.findAll = (req, res) => {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode the token
    if (token) {

      // verify secret and check expiration
      jwt.verify(token, Seed, function(err, decoded) {
        if (err) {
          return res.status(403).send({
              success: false,
              message: 'This action requires authentication.'
          });
        }
        else {
          if (decoded) {
            // if everything is good, save to request for use in other routes
            Recipe.find({author: {_id: decoded.user}})
              .populate('author')
              .then(recipes => {
                res.send(recipes);
              }).catch(err => {
                res.status(500).send({
                  message: err.message || "Error occurred while retrieving Recipes."
                });
              });
            }
          else {
            return res.status(403).send({
                success: false,
                message: 'This action requires authentication.'
            });
          }
        }
      });

    } else {
      // if there is no token
      // return an error
      return res.status(403).send({
          success: false,
          message: 'This action requires an authentication token.'
      });
    }
};

// Retrieve and return all recipes corresponding to a specific user from the database.
exports.findAllByUser = (req, res) => {
  Recipe.find({author: {_id: req.params.userId}})
    .populate('author')
    .then(recipes => {
      res.send(recipes);
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Error occurred while retrieving Recipes for user " + req.params.userId
      });
    });
};

// Find a single recipe with a recipeId
exports.findOne = (req, res) => {
  Recipe.findById(req.params.recipeId)
    .populate('author')
    .then(recipe => {

      if(!recipe) {
        return res.status(404).send({
          message: "Recipe not found. recipeId = " + req.params.recipeId
        });
      }
      res.send(recipe);

    }).catch(err => {
      if(err.kind === 'ObjectId') {
        return res.status(404).send({
          message: "No recipe found with id: " + req.params.recipeId
        });
      }
      return res.status(500).send({
        message: "Error retrieving recipe with id: " + req.params.recipeId
      });
    });
};

// Update the recipe identified by the recipeId in the request
exports.update = (req, res) => {
  // Validate
     if(!req.body.directions && !req.body.title && !req.body.ingredients) {
         return res.status(400).send({
             message: "Recipe cannot be empty."
         });
     }

     // Find and update recipe from request body
     Recipe.findByIdAndUpdate(req.params.recipeId, {
         title: req.body.title || "Untitled",
         ingredients: req.body.ingredients,
         directions: req.body.directions,
         author: req.body.author
     }, {new: true})
     .populate('author')
     .then(recipe => {
         if(!recipe) {
             return res.status(404).send({
                 message: "Recipe not found. recipeId = " + req.params.recipeId
             });
         }
         res.send(recipe);
     }).catch(err => {
         if(err.kind === 'ObjectId') {
             return res.status(404).send({
                 message: "No recipe found with id: " + req.params.recipeId
             });
         }
         return res.status(500).send({
             message: "Error updating recipe with id: " + req.params.recipeId
         });
     });
};

// Delete the recipe specified by the recipeId in the request
exports.delete = (req, res) => {
  Recipe.findByIdAndRemove(req.params.recipeId)
      .then(recipe => {
          if(!recipe) {
              return res.status(404).send({
                  message: "Recipe not found. recipeId = " + req.params.recipeId
              });
          }
          res.send({message: "Recipe deleted successfully!"});
      }).catch(err => {
          if(err.kind === 'ObjectId' || err.name === 'NotFound') {
              return res.status(404).send({
                  message: "Recipe not found. recipeId = " + req.params.recipeId
              });
          }
          return res.status(500).send({
              message: "Error deleting recipe with id: " + req.params.recipeId
          });
      });
};
