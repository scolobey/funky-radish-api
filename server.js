const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('config');
const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;
const PORT = process.env.PORT || 8080;
const DBHost = process.env.DBHost || config.get('DBHost');

const SchedulerService = require('./app/services/scheduler_service.js');

// create express app
const app = express();

var corsOptions = {
    origin: /\.funkyradish\.com$/,
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
mongoose.connect(DBHost, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log("Database connection successful");
}).catch(err => {
    console.log('Database connection failed. Exiting now.');
    process.exit();
});

// Define routes
require('./app/routes/authenticate.routes.js')(app);
require('./app/routes/user.routes.js')(app);
require('./app/routes/admin.routes.js')(app);
require('./app/routes/recipe.routes.js')(app);
require('./app/routes/ingredient.routes.js')(app);
require('./app/routes/collector.routes.js')(app);
require('./app/routes/newsletter.routes.js')(app);

// Launch scheduled launchScheduledTasks
SchedulerService.launchScheduledTasks()

MongoClient.connect(DBHost, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  if (err) {
    logger.warn(`Failed to connect to the database. ${err.stack}`);
  }

  app.locals.db = client.db("funky_radish_db");

  // listen for requests
  app.listen(PORT, () =>
    console.log(`Listening on ${ PORT }`)
  );
});
