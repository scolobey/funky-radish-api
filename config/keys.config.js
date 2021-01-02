const { generateKeyPair } = require('crypto');
const fs = require('fs');

console.log("it maybe will work then", process.env.SECRET)

generateKeyPair('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: process.env.SECRET
  }
}, (err, public, private) => {
  // Handle errors and use the generated key pair.
  fs.writeFile('publickey.pem', public, function (err) {
    if (err) throw err;
    console.log('Saved!');
  });

  fs.writeFile('privatekey.pem', private, function (err) {
    if (err) throw err;
    console.log('Saved!');
  });
});
