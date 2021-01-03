const jwt = require('jsonwebtoken');
const fs = require('fs');
const privKey = fs.readFileSync('./privatekey.pem');
const pubKey = fs.readFileSync('./publickey.pem');

exports.generateToken = (payload) => {
  let currentTime = Date.now();
  let expTime = currentTime + 86400

  payload.sub = payload.user
  //todo: extract constants
  payload.aud = 'funky-radish-twdxv'

  const token = jwt.sign(payload, privKey, {
    algorithm: 'RS256',
    expiresIn: 86400
  })

  return token
}

exports.verifyToken = (token, callback) => {
  jwt.verify(token, pubKey, function(err, decoded) {
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
