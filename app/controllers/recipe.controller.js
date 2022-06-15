const Recipe = require('../models/recipe.model.js');
const User = require('../models/user.model.js');
const EmailService = require('../services/email_service.js');

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const config = require('config');
const DBHost = process.env.DBHost || config.get('DBHost');

const TokenService = require('../services/token_service.js');
const SpoonacularService = require('../services/spoonacular_service.js');
const SearchQueryService = require('../services/search_query_service.js');
const ContentRetrievalService = require('../services/content_retrieval_service.js');

// Recipe Search API.
exports.search = async (req, res) => {
  console.log("Searching for recipes.")

  MongoClient.connect(DBHost, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
    assert.equal(null, err);

    const db = client.db("funky_radish_db")

    let query = req.params.query.replace("(", "").replace(")", "")
    let page = req.params.page || 1

    let mongoQuery = SearchQueryService.build(query)
    let phraseConfig = SearchQueryService.checkSearchConfig(query)

    var cursor = db.collection('Recipe')
    .find(mongoQuery)
    .skip((page-1)*30)
    .limit(30)
    .toArray(function(err, docs) {
      assert.equal(err, null);

      docs.forEach((item, i) => {
        item.directions = item.direction_list
        item.ingredients = item.ingredient_list

        delete item.direction_list
        delete item.ingredient_list
      });

      let response = {
        recipes: docs
      }

      if (phraseConfig) {
        response.config = phraseConfig
      }

      if (phraseConfig.content) {
        ContentRetrievalService.getContent(phraseConfig.content)
        .then(markdown => {
          response.config.content = markdown
          res.send(response);
        }).catch(err => {
          res.send(response);
        });
      } else {
        res.send(response);
      }
    })
  });
}

// Retrieve all recipes if you have admin privileges.
exports.returnAllRecipes = (req, res) => {
  Recipe.find({author: {_id: req.params.userId}})
    .populate('author')
    .then(recipes => {
      res.send(recipes);
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Error occurred while retrieving Recipes for user " + req.params.userId
      });
    });

  MongoClient.connect(DBHost, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
    assert.equal(null, err);
    const db = client.db("funky_radish_db")

    var cursor = db.collection('Recipe').aggregate([
        {
           $lookup: {
             from: "Ingredient",
             localField: "ingredients",
             foreignField: "_id",
             as: "ingredient_list"
           }
        },
        {
           $lookup: {
             from: "Direction",
             localField: "directions",
             foreignField: "_id",
             as: "direction_list"
           }
        },
       {
          $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$ingredient_list", 0 ] }, "$$ROOT" ] } }
       },
       { $project: { fromItems: 0 } }
    ])
    .toArray(function(err, docs) {
      assert.equal(err, null);

      docs.forEach((item, i) => {
        item.directions = item.direction_list
        item.ingredients = item.ingredient_list

        delete item.direction_list
        delete item.ingredient_list
      });

      res.send(docs);
    })
  });
}

// Retrieve recipes owned by user specified in token.
exports.findAll = (req, res) => {
  Recipe.find({author: {_id: req.decoded.user}})
  .populate('author')
  .then(recipes => {
    res.send(recipes);
  })
  .catch(err => {
    res.status(500).send({ message: err.message || "Error retrieving Recipes." });
  });
}

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
  let query = req.params.recipeId.replace(/-/g, ' ').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

  MongoClient.connect(DBHost, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
    assert.equal(null, err);

    const db = client.db("funky_radish_db")

    var ObjectID = require("mongodb").ObjectID

    if (ObjectID.isValid(query) && !query.includes(" ")) {
      db.collection('Recipe')
      .findOne({
        _id: query
      }, function(err, item) {
        assert.equal(null, err);

        if (item == null) {
          return res.status(500).send({ message: "No recipe matches that title." });
        }

        if (item.tags && item.tags.length > 0) {
          let tagConfig = SearchQueryService.checkRecipeSearchConfig(item.tags)
          item.tags = tagConfig
        }

        res.send(item)
      });
    }
    else {
      db.collection('Recipe')
      .findOne({
        $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
        title : { '$regex' : query, '$options' : 'iu' }
      }, function(err, item) {
        assert.equal(null, err);

        if (item == null) {
          return res.status(500).send({ message: "No recipe matches that title." });
        }

        if (item.tags && item.tags.length > 0) {
          let tagConfig = SearchQueryService.checkRecipeSearchConfig(item.tags)
          item.tags = tagConfig

          if (item.tags.content) {
            ContentRetrievalService.getContent(item.tags.content)
            .then(markdown => {
              item.tags.content = markdown
              res.send(item);
            }).catch(err => {
              res.send(item);
            });
          }
        } else {
          let matchedTag = SearchQueryService.matchTags(item.title)
          item.tags = matchedTag

          if (item.tags.content) {
            ContentRetrievalService.getContent(item.tags.content)
            .then(markdown => {
              item.tags.content = markdown
              res.send(item);
            }).catch(err => {
              res.send(item);
            });
          }
        }

      });
    }
  });
};

// Find a single recipe with a recipeId
exports.findByTitle = (req, res) => {

  // TODO: should probably rename this method if it only returns the directions.

  // Check if this is an external recipe.
  if ( req.params.recipeTitle.substring(0, 3) === "sp-") {
    // Call Spoonacular API
    SpoonacularService.getRecipe(req.params.recipeTitle.substring(3))
      .then(res=> {
        return res.clone().json()
      })
      .then(data => {
        if (data[0].error != "" && data[0].error != null) {
          return res.status(500).send({ message: data[0].error || "Error occurred while importing Recipe." });
        }

        var directions = data[0].steps.map((step) => {
          return step["step"]
        })

        return directions
      })
      .then(directions => {
        return res.json({
          message: 'Have a recipe, punk!',
          recipe: directions,
          error: ""
        });
      })
      .catch(err => {
        res.status(500).send({ message: err.message || "Error occurred while importing Recipe." });
      });
  }
  else {
    let title = req.params.recipeTitle.replace(/-/g, " ");

    Recipe.findOne({ 'title': title })
      .populate('author')
      .then(recipe => {
        if(!recipe) {
          return res.status(404).send({
            message: "No recipe found with the title: " + title
          });
        }
        res.send(recipe);
      })
      .catch(err => {
        return res.status(404).send({
          message: "No recipe found with the title: " + title
        });
      });
  }
};

// Update the recipe identified by the recipeId in the request
exports.update = (req, res) => {

  // Validate
  if(!req.body.directions && !req.body.title && !req.body.ingredients && !req.body.updatedAt) {
    return res.status(400).send({
      message: "One of your recipes appears to be missing some information."
    });
  }

  // Find and update recipe from request body
  Recipe.findByIdAndUpdate(req.params.recipeId, {
    $set: {
      title: req.body.title || "Untitled",
      realmID: req.body.realmID || "",
      clientID: req.body.clientID || "",
      ingredients: req.body.ingredients,
      directions: req.body.directions,
      updatedAt: req.body.updatedAt
    }
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

// Update the list of recipes identified by recipeId's in the request
exports.updateMany = (req, res) => {

  var bulkOps = []

  for(var i=0 ; i<req.body.length ; i++){
    // Validate
    if(req.body[i].directions.length == 0 && !req.body[i].title && req.body[i].ingredients.length == 0 && req.body[i]._id.length == 0 ) {
      return res.status(400).send({
        message: "Detected an incomplete recipe."
      });
    }

    bulkOps.push({
      updateOne :
        {
          "filter" : { "_id" : req.body[i]._id },
          "update" : {
            $set : {
              title: req.body[i].title || "Untitled",
              realmID: req.body[i].realmID || "",
              clientID: req.body[i].clientID || "",
              ingredients: req.body[i].ingredients,
              directions: req.body[i].directions,
              updatedAt: req.body[i].updatedAt
            }
          }
        }
    })
  }

  Recipe.bulkWrite(bulkOps)
  .then(data => {
    res.send(data);
  })
  .catch(err => {
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

// Delete the recipes specified by the array of Id's in the request body
exports.deleteMany = (req, res) => {
  Recipe.deleteMany({_id: {$in: req.body}})
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      return res.status(500).send({
          message: "Error deleting recipes"
      });
    })
};

// Create a token for recipe access
exports.getRecipeToken = (req, res) => {
  const payload = {
    recipeID: req.params.recipeId
  }

  TokenService.asynchRecipeToken(payload)
  .then((token) => {
      res.json({
        message: 'Share this token to share your recipe. It expires in X days.',
        token: token,
        error: ""
      });
  }).catch((error) => {
      console.log("Error", error);
      res.json({
        message: "Recipe token creation failed.",
        token: "",
        error: error.message || "no message"
      });
  })
}

// Connect a user to a recipe
exports.claim = (req, res) => {

  let info = req.decoded
  let member = req.member

  console.log("connect user: " + member)
  console.log("to recipe: " + info.recipeID)
  console.log("type?: " + typeof(info.recipeID))
  console.log("stringified?: " + JSON.stringify(info.recipeID))

  if(!info.recipeID || info.recipeID == null) {
    console.log("no id")
    return res.status(404).send({
      message: "no recipe indicated."
    });
  }

  // Alright. Now we gotta basically add the user id to the recipe's
  User.findByIdAndUpdate(member, {
    $push: {
      recipes: info.recipeID
    }
  })
  .then(user => {
    console.log("user came back though?")
    if(!user) {
      return res.status(404).send({
        message: "User not found. Id = " + member
      });
    }
    res.send(user);
  }).catch(err => {
    if(err.kind === 'ObjectId') {
      return res.status(404).send({
        message: "No user found with id: " + member
      });
    }
    return res.status(500).send({
      message: "Error updating recipe with id: " + member
    });
  });

}

// Request for a recipe with a provided email address
exports.request = (req, res) => {

  let query = req.body.query
  let email = req.body.email

  console.log("recipe requested: " + query)

  // TODO: ...
  // Is the email in the system already?
  // Has the user requested a recipe today?

  // Send an email to me with the email and request?
  EmailService.sendRecipeRequestEmail(query, email)
    .then(() => {
      res.json({ message: "Email sent.", token: "", error: "" });
    })
    .catch((error) => {
        res.json({ message: "Email sending failure.", token: "", error: error.message || "error without message" });
    })

}
