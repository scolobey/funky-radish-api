
module.exports = function (app) {
    const auth = require('../controllers/auth.controller.js');

    // Authenticate a user.
    app.post('/authenticate', auth.getToken);

    // // Verify a new User
    app.put('/verify/:secret', auth.verify);

    // // Resend verification
    // app.post('/resend', users.resendSecret);
}
