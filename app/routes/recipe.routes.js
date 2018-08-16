const Auth = require('../controllers/auth.controller.js');

module.exports = function (app) {
    const recipes = require('../controllers/recipe.controller.js');

    // Retrieve all Recipes
    app.get('/recipes', recipes.findAll);
    app.get('/', recipes.findAll);

    // Create a new Recipe
    app.post('/recipes', recipes.create);

    app.get('/recipes/:userId', Auth.verifyUserOwner, recipes.findAllByUser);

    // Retrieve a single Recipe with recipeId
    app.get('/recipe/:recipeId', recipes.findOne);

    // Update a Recipe with recipeId
    app.put('/recipe/:recipeId', Auth.verifyRecipeOwner, recipes.update);

    // Delete a Recipe with recipeId
    app.delete('/recipe/:recipeId', Auth.verifyRecipeOwner, recipes.delete);
}
