const Auth = require('../controllers/auth.controller.js');

module.exports = function (app) {
    const recipes = require('../controllers/recipe.controller.js');

    // Recipe Search
    app.get('/recipes/:query/:page', Auth.verifySource, recipes.search);
    app.get('/recipes/:query', Auth.verifySource, recipes.search);

    app.get('/recentRecipes', recipes.recentRecipes);

    // retrieve recipes with duplicate titles
    app.get('/duplicates', Auth.verifyAdmin, recipes.findDuplicates);

    // perfect match search
    app.get('/perfect/:query', Auth.verifySource, recipes.perfectSearch);

    // Retrieve all Recipes belonging to anyone
    app.get('/admin/recipes', recipes.returnAllRecipes);

    // Retrieve all Recipes belonging to you
    app.get('/recipes', Auth.verifyAdmin, recipes.findAll);
    app.get('/', Auth.verifyAdmin, recipes.findAll);

    // Create new Recipe or Recipes
    // app.post('/recipes', Auth.verifyAdmin, recipes.create);

    // app.get('/recipes/:recipeTitle', recipes.findByTitle);

    // Find any user's recipes, if you're admin.
    app.get('/recipesByUser/:userId', Auth.verifyAdmin, recipes.findAllByUser);

    // Retrieve a single Recipe with recipeId
    app.get('/recipe/:recipeId', Auth.verifySource, recipes.findOne);

    // Update a Recipe with recipeId
    app.put('/recipe/:recipeId', Auth.verifyRecipeOwner, recipes.update);

    // Update a list of Recipes`
    app.put('/updateRecipes', Auth.verifyRecipeOwner, recipes.updateMany);

    // Delete a list of Recipes
    app.delete('/deleteRecipes', Auth.verifyBulkDelete, recipes.deleteMany);

    // Delete a Recipe with recipeId
    app.delete('/recipe/:recipeId', Auth.verifyRecipeOwner, recipes.delete);

    // Create a token to claim a recipe.
    app.get('/createRecipeToken/:recipeId', Auth.verifyRecipeOwner, recipes.getRecipeToken);

    // Claim a recipe via a recipe token.
    app.put('/claimRecipe/', Auth.verifyRecipeToken, recipes.claim);

    // Request a recipe .
    app.post('/requestRecipe', recipes.request);
}
