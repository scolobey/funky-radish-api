const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('config');
const authConfig = require('./config/authentication.config.js');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 8080

// create express app
const app = express();

app.use(cors());

 // Todo: set this up once gone live.
// var whitelist = ['https://funkyradish.com', 'http://localhost:3000']
//
// var corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
// }
//
// // Then pass them to cors:
// app.use(cors(corsOptions));

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // update to match the domain you will make the request from
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

// Connect to production or test db, depending on environment variables.
console.log(config.DBHost)
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
require('./app/routes/collector.routes.js')(app);

// listen for requests
app.listen(PORT, () =>
  console.log(`Listening on ${ PORT }`)
);
