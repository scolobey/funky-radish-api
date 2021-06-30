const jwt = require('jsonwebtoken');
const fs = require('fs');
const config = require('config');
const realmKey = config.get('RealmKey');
const secret = process.env.SECRET || config.get('SECRET');
const publicKey = process.env.PUBLIC || config.get('PUBLIC');
const privateKey = process.env.PRIVATE || config.get('PRIVATE');

exports.asynchToken = (payload) => {
  console.log("token call asynch ", secret)
  let currentTime = Date.now();
  let expTime = currentTime + 86400

  payload.sub = payload.user
  payload.aud = realmKey

  let tokenPromise = new Promise(function(resolve, reject) {
    const token = jwt.sign(payload, { key: privateKey, passphrase: secret }, { algorithm: 'RS256', expiresIn: 86400 }, function(err, token) {
      if (err) {
        console.log("rejected")
        reject(err);
      }
      else {
        console.log("resolved")
        resolve(token)
      }
    });
  });

  return tokenPromise
}

exports.generateToken = (payload) => {
  let currentTime = Date.now();
  let expTime = currentTime + 86400

  payload.sub = payload.user
  payload.aud = realmKey

  const token = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: 86400
  })

  return token
}

exports.verifyToken = (token) => {

  let tokenVerificationPromise = new Promise(function(resolve, reject) {
    jwt.verify(token, publicKey, function(err, decoded) {
      if (err) {
        reject(err)
      }
      else {
        resolve(decoded)
      }
    });
  });

  return tokenVerificationPromise
}
