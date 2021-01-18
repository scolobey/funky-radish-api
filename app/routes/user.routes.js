const Auth = require('../controllers/auth.controller.js');

const cors = require('cors');


var whitelist = ['http://www.funkyradish.com/','https://funky-radish-api.herokuapp.com']

var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

module.exports = function (app) {
    const users = require('../controllers/user.controller.js');

    // Create a new User
    app.post('/users', cors(corsOptions), users.create);

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
