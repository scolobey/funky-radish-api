const { generateKeyPair } = require('crypto');
const fs = require('fs');
const config = require('config');
const EmailService = require('../app/services/email_service.js');

generateKeyPair('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: process.env.SECRET || 'keyless'
  }
}, (err, public, private) => {
  // Handle errors and use the generated key pair.
  fs.writeFile('publickey.pem', public, function (err) {
    if (err) throw err;
    console.log('Public key saved!');

    console.log("public: " + public)

    // TODO: reserve an admin email and set as a constant.
    EmailService.forwardPublicKey("minedied@gmail.com")
      .then(() => {
        console.log("key sent.")
      })
      .catch((error) => {
          console.log("Error: ", error);
      })

  });

  fs.writeFile('privatekey.pem', private, function (err) {
    if (err) throw err;
    console.log('Private key saved!');
  });
});
