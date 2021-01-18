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
    app.get('/users/:userId', Auth.verifyUserOwner, users.findOne);

    // Update a User with userId
    app.put('/users/:userId', users.update);

    // Delete a User with userId
    app.delete('/users/:userId', Auth.verifyAdmin, users.delete);
}
