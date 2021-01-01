const Realm = require('realm');
const constants = require('../../config/realm.config.js');

const IngredientSchema = {
  name: 'Ingredient',
  primaryKey: 'realmID',
  properties: {
    realmID: 'string',
    name: 'string'
  }
}

const DirectionSchema = {
  name: 'Direction',
  primaryKey: 'realmID',
  properties: {
    realmID: 'string',
    text: 'string'
  }
}

const RecipeSchema = {
  name: 'Recipe',
  primaryKey: 'realmID',
  properties: {
    realmID: 'string',
    _id: 'string?',
    title: 'string?',
    updatedAt: 'string?',
    ingredients: 'Ingredient[]',
    directions: 'Direction[]'
  }
}

const UserSchema = {
  name: 'User',
  name: 'User',
  primaryKey: 'email',
  properties: {
    email: 'string?',
    _id: 'string?',
    name: 'string?',
    recipes: 'Recipe[]'
  }
}

exports.configureRealm = (token, userData) => {

  const server_address = "recipe-realm.us1.cloud.realm.io";

  async function main() {

    let creds = credentials = Realm.Sync.Credentials.jwt(token);
    const user = await Realm.Sync.User.login(`https://${server_address}`, creds);
    const realm = await Realm.open({
      schema: [IngredientSchema, DirectionSchema, RecipeSchema, UserSchema],
        sync: {
          user: user,
          url: `realms://${server_address}/~/recipes`,
        }
    });
  }

  main()
}
