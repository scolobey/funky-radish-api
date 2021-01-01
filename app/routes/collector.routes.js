module.exports = function (app) {
    const collector = require('../controllers/collector.controller.js');

    // Get the recipe
    app.post('/collector', collector.collect);

}
