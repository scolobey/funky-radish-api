const Recipe = require('../models/recipe.model.js');
const assert = require('assert');
var fs = require('fs');
const config = require('config');

const { createClient } = require('@supabase/supabase-js');
const { parse } = require('recipe-ingredient-parser-v3');

const supabaseUrl = process.env.SUPABASE_URI || config.get('SUPABASE_URI')
const supabaseKey = process.env.SUPABASE_KEY || config.get('SUPABASE_KEY')

const supabase = createClient(supabaseUrl, supabaseKey)

// Scan ingredients. Collect statistics.
exports.scanIngredients = async (req, res) => {
  console.log("scanning ingredients.")

  // Create a recipe container
  let ingredients = {}

  //first get the recipes.
  const db = req.app.locals.db

  var cursor = db.collection('Recipe')
  .find()

  cursor.on('data', function (data) {
    console.log(Object.keys(ingredients).length);

    data.ing.forEach((ingredient, i) => {
      // TODO: Fix this stupid package
      let cleanedIngredient = ingredient
        .replace(/\s+/g, ' ')
        .replace('.', '')
        .replace(/([0-9]+)g/, "$1 grams")
        .replace(' parts ', ' ')
        .replace(' part ', ' ')
        .replace(/([a-zA-Z]+)\./, "$1 ")
        .replace(' oz ', ' ounce ')
        .replace(', as needed', '')
        .replace(', optional', '')
        .replace(' as needed', '')
        .replace(' medium ', ' ')
        .replace(' large ', ' ')
        .replace(' small ', ' ')
        .replace(' fresh ', ' ')
        .replace(' pure ', ' ')
        .replace('"', ' inches')
        .replace(/ *\([\s\S]*?\)/g, '')
        .trim()
        .toLowerCase()

      try {
        let parsedIng = parse(cleanedIngredient, "eng")

        // make sure there's something there.
        if (parsedIng.ingredient.length > 0) {
          if (ingredients.hasOwnProperty(parsedIng.ingredient)) {
            if ( !ingredients[parsedIng.ingredient].recipes.includes(data._id)) {
              ingredients[parsedIng.ingredient].recipes.push(data._id)
            }
          } else {
            ingredients[parsedIng.ingredient] = {
              name: parsedIng.ingredient,
              recipes: [data._id],
              units: [parsedIng.unit]
            }
          }
        }
      }
      catch(err) {
        console.log("err: " + err);
      }

    })
  });

  cursor.on('end', function () {
    let ingArray = Object.values(ingredients)
    console.log("adding ingredients: " + ingArray.length);

    let dataSummary = JSON.stringify(ingArray);

    fs.writeFile('ingFile.json', dataSummary, 'utf8', function(err) {
      if (err) throw err;
      console.log('complete');
    });

    console.log('List: ', dataSummary);

    addIngredients(ingArray)

    res.send(ingArray.length);
  });

  //       // Run other metrics.
  //       // % of recipes including this ingredient.
  //       // array of units
  //       // similar ingredients
  //

  //       console.log("inserting ing: " + ingArray.length);


}

const addIngredients = async (ingList) => {

  const { error } = await supabase
    .from('ingredients')
    .insert(ingList)

  console.log(error);
};
