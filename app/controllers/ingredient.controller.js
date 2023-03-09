const { createClient } = require('@supabase/supabase-js');
const config = require('config');

const assert = require('assert');

const supabaseUrl = process.env.SUPABASE_URI || config.get('SUPABASE_URI')
const supabaseKey = process.env.SUPABASE_KEY || config.get('SUPABASE_KEY')

const supabase = createClient(supabaseUrl, supabaseKey);

// Scan ingredients. Collect statistics.
exports.search = async (req, res) => {
  console.log("getting ingredient: " + req.params.query);

  const database = req.app.locals.db

  let query = req.params.query
  let data = await getIngredients(query)

  console.log(data[0].recipes.length);

  // collect the recipes.
  let recipeReturn = getRecipes(database, data[0].recipes)

  recipeReturn.toArray(function(err, docs) {
    assert.equal(err, null);

    console.log("recipes collected")

    docs.forEach((item, i) => {
      item.directions = item.direction_list
      item.ingredients = item.ingredient_list

      delete item.direction_list
      delete item.ingredient_list
    });

    console.log("got back the recipe list: ");

    data[0].recipes = docs

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
