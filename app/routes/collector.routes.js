const Auth = require('../controllers/auth.controller.js');

module.exports = function (app) {
    const collector = require('../controllers/collector.controller.js');

    app.get('/collector', collector.collect);

    app.get('/collector/autocomplete/', collector.autocomplete);

    app.get('/collector/inspect/:url', collector.inspectRecipe);

    app.get('/collector/import/:id', collector.importRecipe);
}
