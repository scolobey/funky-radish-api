const mongoose = require('mongoose');

const RecipeSchema = mongoose.Schema({
    _id: String,
    title: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ingredients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' }],
    directions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Direction' }]
});

RecipeSchema.pre('findOne', async function() {
  // If the password is not being changed, move along.
  console.log("old: ")
})

module.exports = mongoose.model('Recipe', RecipeSchema);
