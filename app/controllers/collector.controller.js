
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

  axios({
    method: 'get',
    url: url,
    timeout: 3000
  })
  .then(response => {
    const html = response.data;
    const $ = cheerio.load(html);

    let jsonld;

    let nodesList = $('script[type="application/ld+json"]')

    var i = 0;

    while (i < nodesList.length) {
      console.log("checking: " + i);

      const node = nodesList[i]

      //parse the firstChild
      jsonld = JSON.parse(node.firstChild.data)

      // If it's an array of jsonld objects
      if (Array.isArray(jsonld)) {
        console.log("array: " + jsonld);

        let filteredList = jsonld.filter(function(schemaFilter) {
          return schemaFilter["@type"] == "Recipe";
        })

        jsonld = filteredList.pop()
      }

      // If the recipe is at the top.
      if (jsonld && jsonld.recipeIngredient && jsonld.recipeInstructions && jsonld.name) {

        console.log("Top level recipe");

        let dirStringArray = []

        if (!jsonld.recipeInstructions[0].text) {
          console.log("instruction string array")
          if (typeof jsonld.recipeInstructions[0] === 'string') {
            console.log("instruction string array")
            // just a regular string array
            // https%3A%2F%2Fwww.midcenturymenu.com%2Frecipe%2Fcranberry-candle-salad%2F
            dirStringArray = jsonld.recipeInstructions.map((dir) => dir.replace(/<\/?[^>]+(>|$)/g, ""))
          } else {
            console.log("instruction array within array")
            // Instruction array is wrapped in an extra array.
            // https%3A%2F%2Ffood52.com%2Frecipes%2F87220-sambal-potatoes-aioli-recipe
            dirStringArray = jsonld.recipeInstructions[0].map((dir) => dir.text.replace(/<\/?[^>]+(>|$)/g, ""))
          }
        } else {
          console.log("instruction object array")
          dirStringArray = jsonld.recipeInstructions.map((dir) => dir.text.replace(/<\/?[^>]+(>|$)/g, ""))
        }

        return res.json({
          ingredients: jsonld.recipeIngredient.map((ing) => ing.replace(/<\/?[^>]+(>|$)/g, "")),
          directions: dirStringArray,
          title: jsonld.name
        });
      } else {

        // Recipe is nested within @graph type
        if (jsonld["@graph"]){
          console.log("checking in graph");

          let rec = jsonld["@graph"].filter(function(schemaFilter) {
            return schemaFilter["@type"] == "Recipe";
          })

          if (rec.length > 0) {
            console.log("recipe detected in graph: " + JSON.stringify(rec));
            return res.json({
              ingredients: rec[0].recipeIngredient.map((ing) => ing.replace(/<\/?[^>]+(>|$)/g, "")),
              directions: rec[0].recipeInstructions.map((dir) => dir.text.replace(/<\/?[^>]+(>|$)/g, "")),
              title: rec[0].name
            });
          }
        }

      }

      if (i == nodesList.length-1) {
        console.log("over");
        return res.status(500).send({ message: "Couldn't find anything" });
      }

      i++
    }

  })
  .catch((error) => {
    return res.status(500).send({ message: "Can't find recipe page: " + error });
  })

};
