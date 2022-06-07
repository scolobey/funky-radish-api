const Auth = require('../controllers/auth.controller.js');

module.exports = function (app) {
    const auth = require('../controllers/auth.controller.js');

    // Authenticate a user.
    app.post('/authenticate', auth.getToken);

    // // Verify a new User
    app.get('/verify/:secret', auth.verify);

    // // Resend verification
    app.post('/resendVerification/', auth.resendSecret);

    // Delete an unverified user
    app.get('/deleteRecord/:userId', auth.deleteUnverifiedUser);

    // // Resend verification
    app.get('/secretToken', Auth.verifyAdmin, auth.claimSpecialToken);
}
