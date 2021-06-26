const Recipe = require('../models/recipe.model.js');

exports.create = (req, res) => {
  // Is it a list of recipes?
  if(Array.isArray(req.body)) {
    var recipeList = []

    for(var i=0 ; i<req.body.length ; i++){
      if(req.body[i].directions.length == 0 && !req.body[i].title && req.body[i].ingredients.length == 0 ) {
        return res.status(400).send({ message: "Detected an incomplete recipe."});
      }

      // Create and add to queue.
      const recipe = new Recipe({
        realmID: req.body[i].realmID || "",
        title: req.body[i].title,
        ingredients: req.body[i].ingredients,
        directions: req.body[i].directions,
        author: {_id: req.decoded.user}
      });

      recipeList.push(recipe)
    }

    // Save queue.
    Recipe.insertMany(recipeList)
    .then(function(data) {
      res.send(data);
    })
    .catch(function(err) {
      res.status(500).send({ message: err.message || "Error occurred while creating Recipes." });
    });
  }

  // Or a single recipe?
  else {
    if(req.body.directions.length == 0 && !req.body.title && req.body.ingredients.length == 0 ) {
      return res.status(400).send({ message: "Recipe cannot be empty." });
    }

    // Create
    const recipe = new Recipe({
      title: req.body.title,
      realmId: req.body.realmID || "",
      ingredients: req.body.ingredients,
      directions: req.body.directions,
      author: {_id: req.decoded.user}
    });

    // Save
    recipe
    .populate('author')
    .save()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Error occurred while uploading Recipe." });
    });
  }

};

// Retrieve all recipes if you have admin privileges.
exports.returnAllRecipes = (req, res) => {
  Recipe.find({})
  .populate('author')
  .then(recipes => {
    res.send(recipes);
  })
  .catch(err => {
    res.status(500).send({ message: err.message || "Error retrieving Recipes." });
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

// Find a single recipe with a recipeId
exports.findByTitle = (req, res) => {
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
