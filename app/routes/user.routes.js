const Auth = require('../controllers/auth.controller.js');

module.exports = function (app) {
    const users = require('../controllers/user.controller.js');

    // Create a new User
    app.post('/users', users.create);

    // // // Verify a new User
    // app.put('/verify/:secret', users.verify);
    //
    // // // Resend verification
    // // app.post('/resend', users.resendSecret);

    // Retrieve all Users
    app.get('/users', Auth.verifyAdmin, users.findAll);

    // Retrieve a single User with userId
    app.get('/users/:userId', Auth.verifyUserAction, users.findOne);

    // Update a User with userId
    app.put('/users/:userId', users.update);

    // Delete a User with userId
    app.delete('/users/:userId', Auth.verifyAdmin, users.delete);

    // Update a User's realmUser'
    app.put('/realmUser', Auth.verifyUserAction, users.updateRealmUser);

    // Reset user password
    app.post('/resetPassword/', users.resetPassword);

    // Change user password, if a token is provided.
    app.put('/changePassword/', Auth.verifyUserAction, users.changePassword);
}
