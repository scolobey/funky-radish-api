const { generateKeyPair } = require('crypto');
const fs = require('fs');
const config = require('config');

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
    passphrase: 'passphrase'
  }
}, (err, public, private) => {
  // Handle errors and use the generated key pair.
  fs.writeFile('publickey.pem', public, function (err) {
    if (err) throw err;
    console.log('Public key saved!');
  });

  fs.writeFile('privatekey.pem', private, function (err) {
    if (err) throw err;
    console.log('Private key saved!');
  });
});
