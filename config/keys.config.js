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
}, (err, publicKey, privateKey) => {
  // Handle errors and use the generated key pair.
  fs.writeFile('publickey.pem', publicKey, function (err) {
    if (err) throw err;
    console.log('Saved!');
  });

  fs.writeFile('privatekey.pem', privateKey, function (err) {
    if (err) throw err;
    console.log('Saved!');
  });
});
