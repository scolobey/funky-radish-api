
const SpoonacularService = require('../services/spoonacular_service.js');
const Recipe = require('../models/recipe.model.js');

const axios = require('axios');
const cheerio = require('cheerio');

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

exports.inspectRecipe = (req, res) => {
  let url = req.params.url
  console.log("crawling: " + url)

  axios(url)
    .then(response => {

      const html = response.data;
      const $ = cheerio.load(html);

      let jsonld;

      const node = $('script[type="application/ld+json"]').get(0);

      try {
        jsonld = JSON.parse(node.firstChild.data)

        // jsonld presents as an array of jsonld objects
        if (Array.isArray(jsonld)) {
          let filteredList = jsonld.filter(function(schemaFilter) {
            return schemaFilter["@type"] == "Recipe";
          })

          jsonld = filteredList.pop()
        }

        // Simplest format. Top level recipe
        if (jsonld && jsonld.recipeIngredient && jsonld.recipeInstructions && jsonld.name) {

          // Rare issue. Instruction array is wrapped in an extra array.
          // https%3A%2F%2Ffood52.com%2Frecipes%2F87220-sambal-potatoes-aioli-recipe
          if (!jsonld.recipeInstructions[0].text) {
            jsonld.recipeInstructions = jsonld.recipeInstructions[0]
          }

          res.json({
            ingredients: jsonld.recipeIngredient.map((ing) => ing.replace(/<\/?[^>]+(>|$)/g, "")),
            directions: jsonld.recipeInstructions.map((dir) => dir.text.replace(/<\/?[^>]+(>|$)/g, "")),
            title: jsonld.name
          });
        }
        // Recipe is nested within @graph type
        else if (jsonld["@graph"]){
          let rec = jsonld["@graph"].filter(function(schemaFilter) {
            return schemaFilter["@type"] == "Recipe";
          })

          if (rec.length > 0) {

            res.json({
              ingredients: rec[0].recipeIngredient.map((ing) => ing.replace(/<\/?[^>]+(>|$)/g, "")),
              directions: rec[0].recipeInstructions.map((dir) => dir.text.replace(/<\/?[^>]+(>|$)/g, "")),
              title: rec[0].name
            });
          } else {
            res.status(500).send({ message: "Can't find recipe markup." });
          }
        }
        else {
          console.log("jsonld: " + JSON.stringify(jsonld))
          res.status(500).send({ message: "Recipe markup missing" });
        }
      } catch (err) {
        console.log(err)
        // In case of error, you can try to debug by logging the node
        res.status(500).send({ message: "Can't find recipe markup." });
      }

    })
    .catch(console.error);
};
