const Recipe = require('../models/recipe.model.js');
const assert = require('assert');
var fs = require('fs');
const config = require('config');

const { createClient } = require('@supabase/supabase-js');
const { parse } = require('recipe-ingredient-parser-v3');

const supabaseUrl = process.env.SUPABASE_URI || config.get('SUPABASE_URI')
const supabaseKey = process.env.SUPABASE_KEY || config.get('SUPABASE_KEY')

const supabase = createClient(supabaseUrl, supabaseKey)

let ingredients = {}

// Add values to Ingredients.
exports.scanIngredients = async (req, res) => {
  console.log("getting ingredients.")
  // get ingredients ordered by count of recipes.
  // that do not have a description.

  // Add a description from the OpenAi API.
  // design prompts for each key
  let descr = {
    description: "",
    nutrition: "",
    history: "",
    production: "",
    image: "",
    types: "",
    brands: "",
    faq: [{q: "", a: ""}]
  }

  res.json({
    message: 'All done!',
    data: {}
  });
}

// Scan ingredients. Collect statistics.
exports.scanIngredients = async (req, res) => {
  console.log("scanning ingredients.")

  //first get the recipes.
  const db = req.app.locals.db
  var cursor = db.collection('Recipe')
  .find()

  cursor.on('data', function (data) {
    console.log(Object.keys(ingredients).length);

    // Iterate ingredients in the recipe.
    data.ing.forEach((ingredient, i) => {
      // TODO: Fix this stupid package
      // WARNING: If you change this, you have to change the frontend as well.
      // Look at components/Recipe.js
      // And you should also change the parser in the ingredient-based search @ ingredient.controller.js exports.search
      let cleanedIngredient = ingredient
        .replace('.', '')
        .replace('-', ' ')
        .replace(/\s+/g, ' ')
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
              ingredients[parsedIng.ingredient].recipesCount ++
            }
          } else {
            ingredients[parsedIng.ingredient] = {
              name: parsedIng.ingredient,
              recipes: [data._id],
              recipesCount: 1,
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
    console.log('Done');

    saveFile()

    let ingArray = Object.values(ingredients)

    // addIngredients(ingArray)

  });

  res.json({
    message: 'All done!',
    data: {}
  });
}

const saveFile = async () => {
  let ingArray = Object.values(ingredients)
  let dataSummary = JSON.stringify(ingArray)
  console.log("saving: " + dataSummary)

  fs.writeFile('ingFile.json', dataSummary, 'utf8', function(err) {
    if (err) throw err;
    console.log('complete');
  });
};

const addIngredients = async (ingList) => {
  const { error } = await supabase
    .from('ingredients')
    .insert(ingList, { upsert: true })

  console.log(error);
};

// const getIngredients = async (ingList) => {
//   const { error } = await supabase
//     .from('ingredients')
//     .insert(ingList, { upsert: true })
//
//     let { data: ingredients, error } = await supabase
//   .from('ingredients')
//   .select('*')
//   .range(0, 9)
//
//   console.log(error);
// };
