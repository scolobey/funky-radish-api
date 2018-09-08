const Auth = require('../controllers/auth.controller.js');

module.exports = function (app) {
    const recipes = require('../controllers/recipe.controller.js');

    // Retrieve all Recipes belonging to you
    app.get('/recipes', recipes.findAll);
    app.get('/', recipes.findAll);

    // Create a new Recipe
    app.post('/recipes', recipes.create);

    // Find any user's recipes, if you're admin.
    app.get('/recipes/:userId', Auth.verifyAdmin, recipes.findAllByUser);

    // Retrieve a single Recipe with recipeId
    app.get('/recipe/:recipeId', recipes.findOne);

    // Update a Recipe with recipeId
    app.put('/recipe/:recipeId', Auth.verifyRecipeOwner, recipes.update);

    // Delete a Recipe with recipeId
    app.delete('/recipe/:recipeId', Auth.verifyRecipeOwner, recipes.delete);
}
