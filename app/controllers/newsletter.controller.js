const fs = require('fs');
const readline = require('readline');
const config = require('config');
const {google} = require('googleapis');

// let credentials = require('../../credentials.json');
const credentials = process.env.GCREDENTIALS || config.get('GCREDENTIALS');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return refreshToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function refreshToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);

      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });

      callback(oAuth2Client);
    });
  });
}

function listSubscribers(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: '1Y6GM3h3pUmcC_d2dN2SYs4JBIUvE3mNV8xnUFh6Tcfc',
      range: 'newsletter_queue!A2:C',
    },
    (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const rows = res.data.values;
      if (rows.length) {
        // Print columns A and E, which correspond to indices 0 and 4.
        rows.map((row) => {
          console.log('Email: ' + row[0]);
        });
      } else {
        console.log('No data found.');
      }
    }
  );
}

// const googleToken = process.env.GTOKEN || config.get('GTOKEN');

exports.getSubscribers = (req, res) => {
  console.log("getting subscribers")

  let jwtClient = new google.auth.JWT(
     credentials.client_email,
     null,
     credentials.private_key,
     ['https://www.googleapis.com/auth/spreadsheets']);

  //authenticate request
  jwtClient.authorize(function (err, tokens) {
   if (err) {
     res.status(500).send({ message: 'GSheets API returned an error: ' + err });
   } else {
    console.log("Successfully connected!");

    let spreadsheetId = '1Y6GM3h3pUmcC_d2dN2SYs4JBIUvE3mNV8xnUFh6Tcfc';
    let sheetName = 'newsletter_queue!A2:C'

    let sheets = google.sheets('v4');
    sheets.spreadsheets.values.get({
       auth: jwtClient,
       spreadsheetId: spreadsheetId,
       range: sheetName
    }, function (err, response) {
       if (err) {
         res.status(500).send({ message: 'GSheets API returned an error: ' + err });
       } else {
           console.log('Subscriber list from Google Sheets:');
           let formattedResponse =response.data.values.map((sub) => {
             return {
               email: sub[0],
               corned_beef: sub[1],
               weekly_recipe: sub[2]
             }
           });
           res.json({
             subscribers: formattedResponse
           });
       }
    });
   }
  });

};

exports.signup = (req, res) => {
  let code = req.query.code
  let email = req.query.email

  let jwtClient = new google.auth.JWT( credentials.client_email, null, credentials.private_key, ['https://www.googleapis.com/auth/spreadsheets']);

  //authenticate request
  jwtClient.authorize(function (err, tokens) {
    if (err) {
      res.status(500).send({ message: 'GSheets API returned an error: ' + err });
    } else {
      console.log("Successfully connected!");

      let spreadsheetId = '1Y6GM3h3pUmcC_d2dN2SYs4JBIUvE3mNV8xnUFh6Tcfc';
      let sheetName = 'newsletter_queue!A2:C'

      let sheets = google.sheets('v4');
      var corned_beef = 0
      var weekly_recipe = 0

      if (code == 1) {
        corned_beef = 1
      } else if (code == 2) {
        weekly_recipe = 1
      } else if (code == 3){
        corned_beef = 1
        weekly_recipe = 1
      }

      const request = {
        spreadsheetId: spreadsheetId,
        range: sheetName,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
            "majorDimension": "ROWS",
            "values": [[email, corned_beef, weekly_recipe]]
        },
        auth: jwtClient
      };

      sheets.spreadsheets.values.append(request).then(resp => {
        if(resp && resp.status == 200) {
          res.send({inserted: true});
        } else {
          return res.status(404).send({
            message: "insert failed"
          });
        }

      }).catch(err => {
        return res.status(500).send({
          message: "Error inserting email"
        });
      });
   }
  });

};
