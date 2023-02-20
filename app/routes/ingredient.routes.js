const Auth = require('../controllers/auth.controller.js');

module.exports = function (app) {
    const ingredients = require('../controllers/ingredient.controller.js');

    // Ingredient Search
    app.get('/ingredients/:query', Auth.verifySource, ingredients.search);
}
