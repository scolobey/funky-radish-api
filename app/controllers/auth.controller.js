const User = require('../models/user.model.js');
const Recipe = require('../models/recipe.model.js');
const Seed = process.env.SEED;
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

// Create a token
exports.getToken = (req, res) => {
  // find the user
  User.findOne({
      email: req.body.email
    },
    function(err, user) {

      if (err) throw err;

      if (!user) {
        res.json({ success: false, message: 'Authentication failed. User not found.' });
      }
      else if (user) {
        // check if password hashes correctly
        bcrypt.compare(req.body.password, user.password, function (err, result) {
          if (result === true) {

            console.log(Seed);

            // if user is found and password is correct
            // create a token with the given payload
            const payload = {
              admin: user.admin,
              user: user.id
            };

            var token = jwt.sign(payload, Seed, {
              expiresIn: 86400 // expires in 24 hours
            });

            // return the information including token as JSON
            res.json({
              success: true,
              message: 'Enjoy your token, ya filthy animal!',
              token: token
            });
          }
          else {
            res.json({ success: false, message: 'Authentication failed. Wrong password.' });
          }
        })
      }
    }
  );

};

// Check for a token.
exports.verifyToken = (req, res, next) => {

  // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode the token
    if (token) {

      // verifies secret and checks exp
      jwt.verify(token, Seed, function(err, decoded) {
        if (err) {
          return res.json({ success: false, message: 'Failed to authenticate token.' });
        }
        else {
          // if everything is good, save to request for use in other routes
          req.decoded = decoded;
          next();
        }
      });

    } else {
      // if there is no token
      // return an error
      return res.status(403).send({
          success: false,
          message: 'This action requires authentication.'
      });
    }

};

// Check for an admin token.
exports.verifyAdmin = (req, res, next) => {

  // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode the token
    if (token) {

      // verifies secret and checks exp
      jwt.verify(token, Seed, function(err, decoded) {
        if (err) {
          return res.status(403).send({
              success: false,
              message: 'This action requires authentication.'
          });
        }
        else {
          if (decoded.admin) {
            // if everything is good, save to request for use in other routes
            req.decoded = decoded;
            next();
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
          message: 'This action requires authentication.'
      });
    }

};

// Check for admin or owner.
exports.verifyUserOwner = (req, res, next) => {

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
          if (decoded.admin) {
            // if everything is good, save to request for use in other routes
            req.decoded = decoded;
            next();
          }
          else if (decoded.user == req.params.userId) {
            // if everything is good, save to request for use in other routes
            req.decoded = decoded;
            next();
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
          message: 'This action requires authentication.'
      });
    }

};

// Check for admin or owner.
exports.verifyRecipeOwner = (req, res, next) => {
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
        let recipeId = ""

        // When updating a list of recipes, you must include recipe._id with each recipe in body of request.
        if(Array.isArray(req.body)) {
          recipeId = req.body[0]._id
        }
        else {
          recipeId = req.params.recipeId
        }

        Recipe.findOne({
            _id: recipeId
          },
          function(err, recipe) {
            if (err) throw err;

            if (!recipe) {
              res.json({ success: false, message: 'Authentication failed. Recipe not found.' });
            }
            else if (decoded.user == recipe.author._id) {
              // if everything is good, save to request for use in other routes
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
      }
    });

  }
  else {
    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: 'This action requires authentication.'
    });
  }
};

// Check for admin or owner.
exports.verifyBulkDelete = (req, res, next) => {
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

        Recipe.find({
            _id: req.body
          },
          function(err, recipes) {
            if (err) throw err;

            if (recipes.length < 1) {
              res.json({ success: false, message: 'Authentication failed. Recipes not found.' });
            }
            else {
              var author = recipes[0]["author"]["_id"]
              //check if all of the recipes have the same _id
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
                  message: 'Recipe authors are not all the same.'
                });
              }
            }
        });
      }
    });
  }
  else {
    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: 'This action requires authentication.'
    });
  }
};
