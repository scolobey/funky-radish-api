const jwt = require('jsonwebtoken');
const fs = require('fs');
const config = require('config');
const realmKey = config.get('RealmKey');
const secret = config.get('SECRET')
const publicKey = config.get('PUBLIC')
const privateKey = config.get('PRIVATE')

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

exports.verifyToken = (token, callback) => {
  jwt.verify(token, publicKey, function(err, decoded) {
    if (err) {
      return res.json({
        success: false,
        message: 'Failed to authenticate token.'
      });
    }
    else {
      callback(decoded)
    }
  });
}
