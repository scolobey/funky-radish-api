const Auth = require('../controllers/auth.controller.js');

module.exports = function (app) {
    const recipes = require('../controllers/recipe.controller.js');

    // Create a new Recipe
    app.post('/recipes', recipes.create);

    // Retrieve all Recipes
    app.get('/recipes', recipes.findAll);

    // Retrieve a single Recipe with recipeId
    app.get('/recipes/:recipeId', recipes.findOne);

    // Update a Recipe with recipeId
    app.put('/recipes/:recipeId', Auth.verifyRecipeOwner, recipes.update);

    // Delete a Recipe with recipeId
    app.delete('/recipes/:recipeId', Auth.verifyRecipeOwner, recipes.delete);
}
