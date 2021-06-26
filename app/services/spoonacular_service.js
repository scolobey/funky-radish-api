// const config = require('config');
const fetch = require('node-fetch');

// const spoonacular_key = process.env.SPOONACULAR_API_KEY || config.get('SPOONACULAR_API_KEY'))
const spoonacular_key = 'baf6ca65c5e6461cbdb8f3cc87e1a730'

// https://api.spoonacular.com/recipes/autocomplete?number=6&query=chick&apiKey=baf6ca65c5e6461cbdb8f3cc87e1a730
exports.autocomplete = (query) => {
  const endpoint = "https://api.spoonacular.com/recipes/autocomplete?number=6&query=" + query + "&apiKey=" + spoonacular_key
  return fetch(endpoint, { method: 'get' })
}

// https://api.spoonacular.com/recipes/complexSearch?fillIngredients=true&query=cookies&apiKey=baf6ca65c5e6461cbdb8f3cc87e1a730
exports.recipeSearch = (query) => {
  const endpoint = "https://api.spoonacular.com/recipes/complexSearch?fillIngredients=true&query=" + query + "&apiKey=" + spoonacular_key

  console.log("calling: ", endpoint)
  return fetch(endpoint, { method: 'get' })
}

// https://api.spoonacular.com/recipes/716426/analyzedInstructions?apiKey=baf6ca65c5e6461cbdb8f3cc87e1a730
exports.getRecipe = (recipeID) => {
  const endpoint = "https://api.spoonacular.com/recipes/" + recipeID + "/analyzedInstructions?apiKey=" + spoonacular_key
  return fetch(endpoint, { method: 'get' })
}
