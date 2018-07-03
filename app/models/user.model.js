const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcrypt');

const UserSchema = mongoose.Schema({
    name: {
      type: String,
      lowercase: true
    },
    email: {
      type: String,
      lowercase: true,
      unique: true, 
      match: [/\S+@\S+\.\S+/, 'is invalid']
    },
    password: String,
    recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    admin: Boolean
}, {
    timestamps: true
});

UserSchema.plugin(uniqueValidator, {message: 'email is already taken.'});

UserSchema.pre('save', function (next) {
  var user = this;

  bcrypt.hash(user.password, 12, function (err, hash){
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  })
});

module.exports = mongoose.model('User', UserSchema);
