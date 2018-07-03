const express = require('express');
const bodyParser = require('body-parser');
const config = require('config');
const authConfig = require('./config/authentication.config.js');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 8080

// create express app
const app = express();

// set the secret key for authentication
app.set('secret', authConfig.secret);

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(bodyParser.json())

// Connect to the database
mongoose.Promise = global.Promise;

// Connect to production or test db, depending on environment variables.
mongoose.connect(config.DBHost)

.then(() => {
    console.log("Database connection successful");
}).catch(err => {
    console.log('Database connection failed. Exiting now.');
    process.exit();
});

// Define routes
require('./app/routes/authenticate.routes.js')(app);
require('./app/routes/user.routes.js')(app);
require('./app/routes/recipe.routes.js')(app);

// listen for requests
app.listen(PORT, () =>
  console.log(`Listening on ${ PORT }`)
);
