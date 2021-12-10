const User = require('../models/user.model.js');
const Recipe = require('../models/recipe.model.js');
const bcrypt = require('bcrypt');
const TokenService = require('../services/token_service.js');
const EmailService = require('../services/email_service.js');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const config = require('config');
const realmKey = config.get('RealmKey');

exports.getToken = (req, res) => {
  User.findOne({
    email: req.body.email
  },
  function(err, user) {
    if (err) {
      console.log(err)
      res.json({
        message: "Token creation failed.",
        token: "",
        error: "Authentication error."
      });
    }

    if (!user) {
      res.json({
        message: "Token creation failed.",
        token: "",
        error: "User not found"
      });
    }
    else if (user && user.verified) {
      bcrypt.compare(req.body.password, user.password, function (err, result) {
        // if password hashes to user.password

        if (result === true) {
          console.log("user keys: " + Object.keys(user))
          console.log("email: " + user.email)
          console.log("id: " + user._id)

          const payload = {
            admin: user.admin,
            user: user.email,
            sub: user._id,
            aud: realmKey,
            author: user.author || ""
          }

          TokenService.asynchToken(payload)
            .then((token) => {
              res.json({
                message: 'Enjoy your token, ya filthy animal!',
                token: token,
                error: ""
              });
          }).catch((error) => {
              console.log("Error", error);
              res.json({
                message: "Token creation failed.",
                token: "",
                error: error.message || "no message"
              });
          })
        }
        else {
          res.json({
            token: '',
            message: 'Authentication failed. Wrong password.',
            error: 'Incorrect password.'
          });
        }
      })
    }
    else {
      res.json({
        success: false,
        message: 'Email not verified.'
      });
    }
  });
};

// TODO: This no longer works. Ditch it!
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
    TokenService.verifyToken(token)
      .then((decoded) => {
        console.log(decoded)
        if (decoded.admin) {
          req.decoded = decoded;
          next();
        }
        else {
          res.json({ message: "You need admin privileges for that.", token: "" });
        }
      }).catch((error) => {
          res.json({ message: "Invalid token.", token: "", error: error });
      })
  }
  else {
    return res.status(403).send({
      success: false,
      message: 'This action requires authentication.'
    });
  }
};

// Check the token.
exports.verifyUserAction = (req, res, next) => {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    console.log("found a token: " + token)
    TokenService.verifyToken(token)
      .then((decoded) => {
          console.log("decoded: " + JSON.stringify(decoded))

          req.decoded = decoded;
          next();
        }).catch((error) => {
            res.json({ message: "Invalid token.", token: "", error: error });
        })
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
  console.log("verifying recipe owner.")
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    TokenService.verifyToken(token)
    .then((decoded) => {
      recipeId = req.params.recipeId

      console.log("figure out how to match these")
      console.log("rec id: " + recipeId)
      console.log("decoded user: " + decoded.user)
      console.log("decoded sub: " + decoded.sub)

      MongoClient.connect(config.DBHost, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
        assert.equal(null, err);

        const db = client.db("funky_radish_db")


        var cursor = db.collection('Recipe').findOne({_id: recipeId}, function(err, result) {
          if (err) throw err;

          if (!result) {
            res.json({ success: false, message: 'Nothing found.' });
          }
          else {
            console.log("found something: " + result.author)

          }

        });
      });
    }).catch((error) => {
        console.log("Error", error);
        res.json({
          message: "Recipe token verification failed.",
          token: "",
          error: error.message || "no message"
        });
    })
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

// Verify a new user with the token they got in their email.
exports.verify = (req, res) => {
  var token = req.params.secret
  console.log("verifying user")

  if (token) {
    TokenService.verifyToken(token)
    .then(decoded => {
      console.log("token checks out: " + decoded.sub)
      User.findByIdAndUpdate(decoded.sub, {
          verified: true
      })
      .then(user => {
        if(!user) {
          return res.status(404).send({
            message: "User not found. userId = " + req.params.userId
          });
        }
        return res.send({
          message: "Email verified.",
          token: token,
          user: user
        });
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
    }).catch(err => {
      return res.status(500).send({
        message: "Validation error: " + err
      });
    });
  }
  else {
    return res.status(403).send({
      success: false,
      message: 'This action requires a secret key.'
    });
  }
};

exports.resendSecret = (req, res) => {

  if(!req.body.email) {
    return res.status(400).send({
      message: "Email must be provided.", token: ""
    });
  }

  var userEmail = req.body.email

  if (userEmail) {
    User.findOne({
      email: req.body.email
    })
      .then(user => {
        if(!user) {
          return res.status(404).send({
            message: "User not found: " + userEmail
          });
        }

        if(user.verified) {
          return res.status(404).send({
            message: "User already verified: " + userEmail
          });
        }

        const payload = {
          admin: user.admin,
          user: user.email,
          sub: user._id,
          aud: realmKey,
          author: user.author || ""
        }

        TokenService.asynchToken(payload)
          .then((token) => {
            EmailService.sendVerificationEmail(user.email, user._id, token)
              .then(() => {
                res.json({ message: "Verification email sent.", token: "", error: "" });
              })
              .catch((error) => {
                  console.log("Error", error);
                  res.json({ message: "Verification email sending failure:", token: "", error: error });
              })
          }).catch((error) => {
              console.log("Error", error);
              res.json({ message: "Token creation failed: ", token: "", error: error });
          })
      })
      .catch(err => {
            if(err.kind === 'ObjectId') {
                return res.status(404).send({
                    message: "Email not found: " + userEmail
                });
            }
            console.log(err)
            return res.status(500).send({
                message: "Email not found."
            });
      });
  }
  else {
    return res.status(403).send({
      success: false,
      message: 'Parameter missing: userId.'
    });
  }
};

exports.deleteUnverifiedUser = (req, res) => {
  var userId = req.params.userId

  if (userId) {
    User.findById(userId, { password: 0 })
      .then(user => {
        if(!user) {
          return res.status(404).send({
            message: "User not found. userId = " + userId
          });
        }

        if(user.verified != true) {
          user.deleteOne()
          res.json({ message: "User succesfully removed." });
        }
        else {
          return res.status(404).send({
            message: "User has already been verified. Contact help@funkyradish.com for assistance."
          });
        }
      })
      .catch(err => {
            if(err.kind === 'ObjectId') {
                return res.status(404).send({
                    message: "No user found with id: " + userId
                });
            }
            return res.status(500).send({
                message: "Error retrieving user with id: " + userId
            });
      });
  }
  else {
    return res.status(403).send({
      success: false,
      message: 'Parameter missing: userId.'
    });
  }
};

exports.createRecipeToken = (req, res) => {
  // User.findOne({
  //   email: req.body.email
  // },
  // function(err, user) {
  //   if (err) {
  //     console.log(err)
  //     res.json({
  //       message: "Token creation failed.",
  //       token: "",
  //       error: "Authentication error."
  //     });
  //   }
  //
  //   if (!user) {
  //     res.json({
  //       message: "Token creation failed.",
  //       token: "",
  //       error: "User not found"
  //     });
  //   }
  //   else if (user && user.verified) {
  //     bcrypt.compare(req.body.password, user.password, function (err, result) {
  //       // if password hashes to user.password
  //       if (result === true) {
  //         const payload = {
  //           admin: user.admin,
  //           user: user.email
  //         }
  //
  //         TokenService.asynchToken(payload)
  //           .then((token) => {
  //             res.json({
  //               message: 'Enjoy your token, ya filthy animal!',
  //               token: token,
  //               error: ""
  //             });
  //         }).catch((error) => {
  //             console.log("Error", error);
  //             res.json({
  //               message: "Token creation failed.",
  //               token: "",
  //               error: error.message || "no message"
  //             });
  //         })
  //       }
  //       else {
  //         res.json({
  //           token: '',
  //           message: 'Authentication failed. Wrong password.',
  //           error: 'Incorrect password.'
  //         });
  //       }
  //     })
  //   }
  //   else {
  //     res.json({
  //       success: false,
  //       message: 'Email not verified.'
  //     });
  //   }
  // });
};

// Verify a new user with the token they got in their email.
exports.verifyRecipeToken = (req, res) => {
  var token = req.params.recipeToken
  console.log("verifying user")

  if (token) {
    TokenService.verifyToken(token)
    .then(decoded => {
      console.log("decoded: " + decoded)
      // User.findByIdAndUpdate(decoded.user, {
      //     verified: true
      // })
      // .then(user => {
      //   if(!user) {
      //     return res.status(404).send({
      //       message: "User not found. userId = " + req.params.userId
      //     });
      //   }
      //   return res.send({
      //     message: "Email verified.",
      //     token: token,
      //     user: user
      //   });
      // }).catch(err => {
      //   if(err.kind === 'ObjectId') {
      //     return res.status(404).send({
      //       message: "No user found with id: " + req.params.userId
      //     });
      //   }
      //   return res.status(500).send({
      //     message: "Error updating user with id: " + req.params.userId
      //   });
      // });
    }).catch(err => {
      return res.status(500).send({
        message: "Validation error: " + err
      });
    });
  }
  else {
    return res.status(403).send({
      success: false,
      message: 'This action requires a secret key.'
    });
  }
};
