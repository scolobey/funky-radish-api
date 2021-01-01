const User = require('../models/user.model.js');
const Recipe = require('../models/recipe.model.js');
const bcrypt = require('bcrypt');
const TokenService = require('../services/token_service.js');

exports.getToken = (req, res) => {
  User.findOne({
    email: req.body.email
  },
  function(err, user) {
    if (err) throw err;

    if (!user) {
      res.json({
        success: false,
        message: 'Authentication failed. User not found.'
      });
    }
    else if (user) {
      bcrypt.compare(req.body.password, user.password, function (err, result) {
        // if password hashes to user.password
        if (result === true) {
          const payload = {
            admin: user.admin,
            user: user.id
          }

          const token = TokenService.generateToken(payload)

          res.json({
            message: 'Enjoy your token, ya filthy animal!',
            token: token,
            error: ""
          });
        }
        else {
          res.json({
            token: false,
            message: 'Authentication failed. Wrong password.',
            error: 'Incorrect password.'
          });
        }
      })
    }
  });
};

exports.verifyToken = (req, res, next) => {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    TokenService.verifyToken(token, function(decoded) {
      // save decoded token to request for use in other routes
      req.decoded = decoded;
      next();
    });
  }
  else {
    return res.status(403).send({
      success: false,
      message: 'This action requires authentication.'
    });
  }
};

exports.verifyAdmin = (req, res, next) => {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    TokenService.verifyToken(token, function(decoded) {
      if (decoded.admin) {
        req.decoded = decoded;
        next();
      }
      else {
        return res.status(404).send({
          success: false,
          message: 'That which you seek does not exist.'
        });
      }
    });
  }
  else {
    return res.status(403).send({
      success: false,
      message: 'This action requires authentication.'
    });
  }
};

// Check for admin or user owner.
exports.verifyUserOwner = (req, res, next) => {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    TokenService.verifyToken(token, function(decoded) {
      if (decoded.admin) {
        req.decoded = decoded;
        next();
      }
      else if (decoded.user == req.params.userId) {
        // if the user is the same as the provided user id
        req.decoded = decoded;
        next();
      }
      else {
        return res.status(403).send({
          success: false,
          message: 'You are not yourself.'
        });
      }
    });
  }
  else {
    return res.status(403).send({
      success: false,
      message: 'This action requires authentication.'
    });
  }
};

// Check for admin or recipe owner.
exports.verifyRecipeOwner = (req, res, next) => {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    TokenService.verifyToken(token, function(decoded) {
      let recipeId = ""

      // When updating a list of recipes, you must include recipe._id with each recipe in body of request.
      if(Array.isArray(req.body)) {
        recipeId = req.body[0]._id
      }
      else {
        recipeId = req.params.recipeId
      }

      Recipe.findOne({ _id: recipeId })
      .populate('author')
      .then(recipe => {
        if (!recipe) {
          res.json({ success: false, message: 'Recipe not found.' });
        }
        else if (decoded.user == recipe.author._id) {
          req.decoded = decoded;
          next();
        }
        else {
          return res.status(403).send({
            success: false,
            message: 'This action requires authentication.'
          });
        }
      });

    });
  }
  else {
    return res.status(403).send({
      success: false,
      message: 'This action requires authentication.'
    });
  }
};

// Check for admin or owner.
exports.verifyBulkDelete = (req, res, next) => {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    TokenService.verifyToken(token, function(decoded) {

      Recipe.find({
        _id: req.body
      },
      function(err, recipes) {
        if (err) throw err;

        if (recipes.length < 1) {
          res.json({ success: false, message: 'Recipes not found.' });
        }
        else {
          var author = recipes[0]["author"]["_id"]

          //check if all of the recipes have the same ._id
          function checkIds(recipe) {
            return JSON.stringify(recipe.author._id) == JSON.stringify(author)
          }

          var sameIds = recipes.every(checkIds)

          if (sameIds) {
            if (decoded.user == author) {
              // Save to request for use in other routes
              req.decoded = decoded;
              next();
            }
            else {
              return res.status(403).send({
                success: false,
                message: 'You can only delete your own recipes.'
              });
            }
          }
          else {
            return res.status(403).send({
              success: false,
              message: 'These recipes belong to different authors.'
            });
          }
        }
      });
    });
  }
  else {
    return res.status(403).send({
      success: false,
      message: 'This action requires authentication.'
    });
  }
};
