const { createClient } = require('@supabase/supabase-js');
const config = require('config');
const assert = require('assert');
const { parse } = require('recipe-ingredient-parser-v3');

const supabaseUrl = process.env.SUPABASE_URI || config.get('SUPABASE_URI')
const supabaseKey = process.env.SUPABASE_KEY || config.get('SUPABASE_KEY')

const supabase = createClient(supabaseUrl, supabaseKey);

// Scan ingredients. Collect statistics.
exports.search = async (req, res) => {

  const database = req.app.locals.db

  let query = req.params.query
  let data = await getIngredients(query)

  // collect the recipes.
  let recipeReturn = getRecipes(database, data[0].recipes)

  recipeReturn.toArray(function(err, docs) {
    assert.equal(err, null);

    let ingredientFrequency = {}

    docs.forEach((item, i) => {

      if (item.ing.length > 0) {
        item.ing.forEach((ing, i) => {
          let cleanedIngredient = ing
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

          let parsedIng = parse(cleanedIngredient, "eng")

          if ( ingredientFrequency[parsedIng.ingredient] ) {
            ingredientFrequency[parsedIng.ingredient] = ingredientFrequency[parsedIng.ingredient] + 1
          } else {
            ingredientFrequency[parsedIng.ingredient] = 1
          }
        })
      }
    });

    let keys = Object.keys(ingredientFrequency)
    let ingFreqList = []

    keys.forEach((item, i) => {
      let count = ingredientFrequency[item]
      if (count > 1) {
        ingFreqList.push([item, count])
      }
    })

    data[0].recipes = docs
    data[0].ingredientFrequency = ingFreqList.sort(function(a, b){return a[1] - b[1]});
    res.send(JSON.stringify(data))
  })

}

const getIngredients = async (ingName) => {
  const { data, error } = await supabase
    .from('ingredients')
    .select()
    .eq('name', ingName)
    .ilike('name', '%' + ingName + '%')

  return data
};

const getRecipes = (db, ingredients) => {
  // let page = req.params.page || 1
  let mongoQuery ={_id: { $in: ingredients }}

  return db.collection('Recipe')
  .find(mongoQuery)
  // .skip((page-1)*30)
  .limit(30)

};
