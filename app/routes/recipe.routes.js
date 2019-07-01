const Auth = require('../controllers/auth.controller.js');

module.exports = function (app) {
    const recipes = require('../controllers/recipe.controller.js');

    // Retrieve all Recipes belonging to you
    app.get('/recipes', recipes.findAll);
    app.get('/', recipes.findAll);

    // Create new Recipe or Recipes
    app.post('/recipes', recipes.create);

    // app.get('/recipes/:recipeTitle', recipes.findByTitle);
    app.get('/recipes/:recipeTitle', recipes.findByTitle);

    // Find any user's recipes, if you're admin.
    app.get('/recipesByUser/:userId', Auth.verifyAdmin, recipes.findAllByUser);

    // Retrieve a single Recipe with recipeId
    app.get('/recipe/:recipeId', recipes.findOne);

    // Update a Recipe with recipeId
    app.put('/recipe/:recipeId', Auth.verifyRecipeOwner, recipes.update);

    // Update a list of Recipes
    app.put('/updateRecipes', Auth.verifyRecipeOwner, recipes.updateMany);

    // Delete a list of Recipes
    app.delete('/deleteRecipes', Auth.verifyBulkDelete, recipes.deleteMany);

    // Delete a Recipe with recipeId
    app.delete('/recipe/:recipeId', Auth.verifyRecipeOwner, recipes.delete);
}
