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
      unique: true,
      uniqueCaseInsensitive: true,
      match: [/\S+@\S+\.\S+/, 'is invalid']
    },
    password: String,
    recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    admin: Boolean,
    verified: Boolean
}, {
    timestamps: true
});

UserSchema.plugin(uniqueValidator, {message: 'email is already taken.'});

UserSchema.pre('save', function (next) {
  var user = this;

  bcrypt.hash(user.password, 12, function (err, hash){
    if (err) {
      console.log("error in bcrypt hashing")
      return next(err);
    }
    user.password = hash;
    next();
  })
});

const tokenSchema = mongoose.Schema({
    _userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    token: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now, expires: 43200 }
});

module.exports = mongoose.model('User', UserSchema);
