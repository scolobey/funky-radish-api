const SpoonacularService = require('../services/spoonacular_service.js');
const Recipe = require('../models/recipe.model.js');


exports.autocomplete = (req, res) => {
  //TODO: handle overloaded api code.
  SpoonacularService.autocomplete(req.query.query)
    .then(res=> {
      return res.clone().json()
    })
    .then(data => {
      res.json({
        message: 'Here ya go, punk!',
        suggestions: data,
        error: ""
      });
    })
};

exports.collect = (req, res) => {
  //TODO: handle overloaded api code.
  SpoonacularService.recipeSearch(req.query.query)
    .then(res=> {
      return res.clone().json()
    })
    .then(data => {
      res.json({
        message: 'Here ya go, punk!',
        recipes: data,
        error: ""
      });
    })
    .catch(error => {
      console.log(error)
      res.status(500).send({ message: err.message || "Error occurred while searching." });
    });
};

exports.importRecipe = (req, res) => {

  let id = req.params.id

  SpoonacularService.getRecipe(id)
    .then(res=> {
      return res.clone().json()
    })
    .then(data => {

      res.json({
        message: 'Have a recipe, punk!',
        recipe: data[0],
        error: ""
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Error occurred while importing Recipe." });
    });
};
