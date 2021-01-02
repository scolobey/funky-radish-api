import {
  ADD_RECIPE,
  GET_TOKEN,
  GET_RECIPES,
  DELETE_REMOTE_RECIPE,
  LOGIN,
  SIGNUP,
  WARNING,
  GET_RECIPE
} from "../constants/action-types";

import {
  BASE_URL
} from "../constants/api";

import {
  getRecipes,
  updateRecipe,
  deleteLocalRecipe,
  authFailed,
  getToken,
  warning,
  recipesLoaded,
  setUsername,
  toggleLoader,
  warningToggle,
  setRedirect,
  setRecipe
} from "../actions/Actions";

import uuidv1 from "uuid";

import Auth from '../Auth'
import RealmService from '../services/RealmService'
import ServerService from '../services/ServerService'

import RealmApp from '../realm/RealmApp'

const auth = new Auth();
const realm = new RealmService();
const server = new ServerService();

const realmApp = new RealmApp();

var moment = require('moment');

export function loginMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {

      if (action.type === LOGIN) {
        console.log("loginMiddleware")
        dispatch(toggleLoader(true));

        switch (auth.validateCredentials(action.user.email, action.user.password)) {
          case 1:
            break;
          case 2:
            let statement = action.user.newAccount ? "Password needs 8 characters and a number." : "Invalid password.";
            return dispatch(warning(statement));
          case 3:
            return dispatch(warning("Invalid email."));
          default:
            return dispatch(warning("Unidentified validation error."));
        }

        if (action.user.newAccount) {
          console.log("signup")
          server.createUser(action.user)
          .then(data => {
            if (data.message !== "User created successfully.") {
              dispatch(toggleLoader(false));
              dispatch(data.message);
            } else {
              console.log("collected token: %s", data.token)

              realmApp.registerUser(action.user)
              .then(stuff => {
                console.log("collected data: %s", stuff.toString())
              })
              .catch(err => {
                console.log(err)
                return dispatch(warning('Error: ' + err))
              })

              // realm.tokenAuthenticate(data.token)
              // .then(user => {
              //   auth.setSession(data.token, user)
              //   dispatch(setUsername(action.user.email))
              // })
              // .catch(error => {
              //   console.log(error)
              //   dispatch(toggleLoader(false));
              //   dispatch(setRedirect("/signup"));
              //   //TODO: look deeper into the errors provided (User exists? Server malfunction?)
              //   let statement = "User already exists or something."
              //   return dispatch(warning(statement));
              // });
              //
              // dispatch(toggleLoader(false));
              //
              // var recipes = [];
              // return dispatch(recipesLoaded(recipes));
            }
          })
          .catch(err => {
            return dispatch(warning('Error: ' + err))
          })

        }
        else {
          console.log("login")

          server.loginUser(action.user)
          .then(data => {
            console.log(data)
            if (!data.success) {
              dispatch(toggleLoader(false));
              dispatch(data.message);
            } else {

              realm.tokenAuthenticate(data.token)
              .then(user => {
                console.log(user)

                auth.setSession(user.token, user)
                dispatch(setUsername(action.user.email))

                realm.getRecipes(user)
                .then(response => {
                  console.log(response.data.recipes);
                  return dispatch(recipesLoaded(response.data.recipes))
                })
                .catch(error => {
                  dispatch(toggleLoader(false))
                  return dispatch(warning("Error retrieving recipes."));
                });

              })
              .catch(error => {
                console.log(error)
                dispatch(toggleLoader(false));
                dispatch(setRedirect("/login"));
                //TODO: look deeper into the errors provided (User exists? Server malfunction?)
                let statement = action.user.newAccount ? "User already exists." : "Invalid Login.";
                return dispatch(warning(statement));
              });


              dispatch(toggleLoader(false));
              // go to main recipe list.
              var recipes = [];
              return dispatch(recipesLoaded(recipes));
            }
          })
          .catch(err => {
            console.log("here it is")
            return dispatch(warning('Error: ' + err))
          })

        }

      }
      return next(action);
    };
  };
}

export function tokenCollectionMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {

      if (action.type === GET_TOKEN) {
        console.log("tokenCollectionMiddleware")
        let token = auth.getToken();
        let storedUser = auth.getUser();
        let recipe = {
          title: 'butternuts'
        }

        if (token) {
          // Let's try to create a recipe
          // auth.logout()

          console.log("user token: %s", storedUser.token)
          console.log("logged token: %s", token)
          console.log(typeof storedUser)

          realm.tokenAuthenticate(token)
          .then(user => {
            realm.createRecipe(recipe, user)
            .catch(error => {
              console.log("the error be in ye createRecipe")
              console.log(JSON.stringify(error))
              return dispatch(warning(error.message));
            });
          })
          .catch(error => {
            console.log("there hath been an error")
            console.log(error)
            return dispatch(warning(error.statusText));
          });

        }
      }
      return next(action);
    };
  };
}

export function recipeLoadingMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {

      if (action.type === GET_RECIPES) {
        console.log("recipeLoadingMiddleware")

        realm.getRecipes(action.user)
        .then(response => {
          console.log(response);
          response.json()
        })
        .then(json => {
          if (json.message) {
            dispatch(warning(json.message))
            return dispatch(toggleLoader(false));
          }
          else {
            return dispatch(recipesLoaded(json));
          }
        })
        .catch(error => {
          dispatch(toggleLoader(false))
          return dispatch(warning("Error retrieving recipes."));
        });
      }
      return next(action);
    };
  };
}

export function addRecipeMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {
      if (action.type === ADD_RECIPE) {
        console.log("addRecipeMiddleware")

        let token = auth.getToken();

        if (!token) {
          return dispatch(warning("You're not logged in. Recipe will not be saved."));
        }

        // var date = new Date();
        // var formattedDate = moment.utc(date).format("YYYY-MM-DDTHH:mm:ss.sssz").replace(/UTC/, "Z");

        var recipe = {
          // clientID: action.recipe.clientID,
          ingredients: action.recipe.ingredients,
          directions: action.recipe.directions,
          // updatedAt: formattedDate,
          title: action.recipe.title
        }

        let user = auth.getUser()
        realm.createRecipe(recipe, user)
        .then(json => {
          console.log("return accepted")
          console.log(json)
        })
        .catch(error => {
          console.log("return broken")
          console.log(error)
        });
        // if(action.recipe._id) {
        //   let url = BASE_URL + "recipe/" + action.recipe._id;
        //
        //   fetch(url, {
        //     method: 'put',
        //     headers: new Headers({
        //       'Accept': 'application/json',
        //       'Content-Type': 'application/json',
        //       'x-access-token': token
        //     }),
        //     body: JSON.stringify(params)
        //   })
        //   .then(res=> {
        //     return res.clone().json()
        //   })
        //   .then(data => {
        //     if (data.message) {
        //       return dispatch(warning(data.message))
        //     }
        //     return dispatch(updateRecipe(data));
        //   })
        //   .catch(error => dispatch(warning(error)))
        // }
        // else {
        //   params = [params];
        //
        //   fetch( BASE_URL + "recipes", {
        //     method: 'post',
        //     headers: new Headers({
        //       'Accept': 'application/json',
        //       'Content-Type': 'application/json',
        //       'x-access-token': token
        //     }),
        //     body: JSON.stringify(params)
        //   })
        //   .then(res=> {
        //     return res.clone().json()
        //   })
        //   .then(data => {
        //     if (data.message) {
        //       return dispatch(warning(data.message))
        //     }
        //     // update recipe to fill in ._id
        //     return dispatch(updateRecipe(data));
        //   })
        //   .catch(error => dispatch(warning(error)))
        // }
      }
      return next(action);
    };
  };
}

export function getRecipeMiddleware({dispatch}) {
  return function(next) {
    return function(action) {
      if (action.type === GET_RECIPE) {
        console.log("getRecipeMiddleware")

        fetch(BASE_URL + "recipes/" + action.recipeTitle , {
          method: 'get'
        })
        .then(response => response.json())
        .then(json => {
          if (json.message) {
            dispatch(warning(json.message))
            return dispatch(toggleLoader(false));
          }
          else {
            return dispatch(setRecipe(json));
          }
        })
        .catch(error => {
          return dispatch(warning("I can't find that recipe."));
        });

      }
      return next(action);
    };
  };
}

export function deleteRecipeMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {
      if (action.type === DELETE_REMOTE_RECIPE) {

        let token = auth.getToken();

        if (!token) {
          return dispatch("You're not logged in. Recipe will not be removed.");
        }

        let id = action.recipe._id;
        let url = BASE_URL + "recipe/" + id;

        // call to delete recipe.
        fetch(url, {
          method: 'delete',
          headers: new Headers({
            'x-access-token': token
          })
        })
        .then(res=> {
          return res.clone().json()
        })
        .then(data => {
          if (data.message === "Recipe deleted successfully!" || data.message === "Authentication failed. Recipe not found.") {
            return dispatch(deleteLocalRecipe(action.recipe.clientID))
          }
          else {
            return dispatch("Delete failed.")
          }
        })
      }
      return next(action);
    };
  };
}

export function warningCycleMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {

      if (action.type === WARNING) {
        console.log("warningCycleMiddleware")

        setInterval(() => {
          return dispatch(warningToggle());
        }, 3000);

      }
      return next(action);

    };
  };
}
