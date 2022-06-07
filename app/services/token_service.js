const jwt = require('jsonwebtoken');
const fs = require('fs');
const config = require('config');

//TODO: This is an issue when the process is not set.
const secret = process.env.SECRET || config.get('SECRET');
const publicKey = process.env.PUBLIC || config.get('PUBLIC');
const privateKey = process.env.PRIVATE || config.get('PRIVATE');

// Swap comments if you want to test keys output by
// const publicKey = fs.readFileSync("publickey.pem");
// const privateKey = fs.readFileSync("privatekey.pem");

exports.asynchToken = (payload) => {
  let currentTime = Date.now();
  let expTime = currentTime + 86400

  let tokenPromise = new Promise(function(resolve, reject) {
    const token = jwt.sign(payload, { key: privateKey, passphrase: secret }, { algorithm: 'RS256', expiresIn: 86400 }, function(err, token) {
      if (err) {
        reject(err);
      }
      else {
        resolve(token)
      }
    });
  });

  return tokenPromise
}

exports.specialToken = (payload) => {
  let tokenPromise = new Promise(function(resolve, reject) {
    const token = jwt.sign(payload, { key: privateKey, passphrase: secret }, { algorithm: 'RS256' }, function(err, token) {
      if (err) {
        reject(err);
      }
      else {
        resolve(token)
      }
    });
  });

  return tokenPromise
}

// TODO: I believe this is basically deprecated in favor of asynchToken

// exports.generateToken = (payload) => {
//   let currentTime = Date.now();
//   let expTime = currentTime + 86400
//
//   payload.sub = payload.user
//   payload.aud = realmKey
//
//   const token = jwt.sign(payload, privateKey, {
//     algorithm: 'RS256',
//     expiresIn: 86400
//   })
//   return token
// }

exports.verifyToken = (token) => {
  //TODO: This is why expiration rarely occurs. Ignore Expiration is set to true.
  let tokenVerificationPromise = new Promise(function(resolve, reject) {
    jwt.verify(token, publicKey, { format: 'PKCS8', algorithms: ['RS256'], ignoreExpiration: true }, function(err, decoded) {
      if (err) {
        console.log(err)
        reject(err)
      }
      else {
        resolve(decoded)
      }
    });
  });

  return tokenVerificationPromise
}

exports.asynchRecipeToken = (payload) => {
  let currentTime = Date.now();
  // TODO: Verify that this is 1 day, and use this instead of the har-dcoded number below.
  let expTime = currentTime + 86400

  let tokenPromise = new Promise(function(resolve, reject) {
    const token = jwt.sign(payload, { key: privateKey, passphrase: secret }, { algorithm: 'RS256', expiresIn: 86400 }, function(err, token) {
      if (err) {
        reject(err);
      }
      else {
        resolve(token)
      }
    });
  });

  return tokenPromise
}
