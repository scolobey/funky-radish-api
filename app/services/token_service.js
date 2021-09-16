const jwt = require('jsonwebtoken');
const fs = require('fs');
const config = require('config');
const realmKey = config.get('RealmKey');

const secret = process.env.SECRET || config.get('SECRET');
// const publicKey = process.env.PUBLIC || config.get('PUBLIC');
// const privateKey = process.env.PRIVATE || config.get('PRIVATE');


const publicKey = fs.readFileSync("publickey.pem");
const privateKey = fs.readFileSync("privatekey.pem");

exports.asynchToken = (payload) => {
  console.log("token call asynch ", secret)
  let currentTime = Date.now();
  let expTime = currentTime + 86400

  payload.sub = payload.user
  payload.aud = realmKey


  let tokenPromise = new Promise(function(resolve, reject) {
    console.log("signing token")
    console.log("key: " + privateKey)
    console.log("phrase: " + secret)
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

  console.log("verifying token.")
  console.log("pubKey: " + publicKey)
  console.log("token: " + token)

  let tokenVerificationPromise = new Promise(function(resolve, reject) {

    jwt.verify(token, publicKey, { format: 'PKCS8', algorithms: ['RS256'], ignoreExpiration: true }, function(err, decoded) {
      console.log("decoded: " + decoded)
      if (err) {
        console.log("verification error")
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
