const Auth = require('../controllers/auth.controller.js');

module.exports = function (app) {
    const admin = require('../controllers/admin.controller.js');

    // Check ingredients task.
    app.post('/scanIngredients', Auth.verifyAdmin, admin.scanIngredients);
}
