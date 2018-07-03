
module.exports = function (app) {
    const auth = require('../controllers/auth.controller.js');

    // Authenticate a user.
    app.post('/authenticate', auth.getToken);
}
