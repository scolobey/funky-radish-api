
module.exports = function (app) {
    const newsletter = require('../controllers/newsletter.controller.js');

    // Signup for the newsletter.
    app.post('/newsletter/signup', newsletter.signup);

    // Return all subscribers
    app.get('/newsletter/getSubscribers', newsletter.getSubscribers);
}
