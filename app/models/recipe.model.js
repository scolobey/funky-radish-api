const mongoose = require('mongoose');

const RecipeSchema = mongoose.Schema({
    title: String,
    ingredients: [String],
    directions: [String],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Recipe', RecipeSchema);
