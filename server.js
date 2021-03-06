const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('config');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 8080

// create express app
const app = express();

var corsOptions = {
    origin: 'http://www.funkyradish.com',
    optionsSuccessStatus: 200 // For legacy browser support
}

// Then pass them to cors:
app.use(cors(corsOptions));

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "http://www.funkyradish.com/"); // update to match the domain you will make the request from
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(bodyParser.json())

// Connect to the database
mongoose.Promise = global.Promise;
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

// Connect to db.
mongoose.connect(config.DBHost, { useNewUrlParser: true, useUnifiedTopology: true })
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
require('./app/routes/collector.routes.js')(app);

// listen for requests
app.listen(PORT, () =>
  console.log(`Listening on ${ PORT }`)
);
