module.exports = function (app) {
    const collector = require('../controllers/collector.controller.js');

    app.post('/collector', collector.collect);

    app.get('/collector/autocomplete/', collector.autocomplete);

    app.get('/collector/import/:id', collector.importRecipe);
}
