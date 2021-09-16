import {
  ADD_RECIPE,
  GET_TOKEN,
  GET_RECIPES,
  VERIFY_EMAIL,
  DELETE_REMOTE_RECIPE,
  LOGIN,
  SIGNUP,
  WARNING,
  GET_RECIPE,
  EXTERNAL_RECIPE_SEARCH,
  AUTOCOMPLETE,
  LOGOUT,
  GRAPHQL
} from "../constants/action-types";

import {
  getRecipes,
  updateRecipe,
  deleteLocalRecipe,
  authFailed,
  getToken,
  setVerified,
  warning,
  recipesLoaded,
  externalRecipesLoaded,
  setUsername,
  toggleLoader,
  warningToggle,
  setRedirect,
  setRecipe,
  importRecipes,
  setImportQueue,
  setSearchSuggestions
} from "../actions/Actions";

import {v1 as uuid} from "uuid";

import Auth from '../Auth'
import RealmService from '../services/RealmService'
import ServerService from '../services/ServerService'
import Recipe from '../models/RecipeModel'
import useRecipes from "../graphql/useRecipes";
import useRecipe from "../graphql/useRecipe";

const auth = new Auth();
const realmService = new RealmService();
const serverService = new ServerService();

var moment = require('moment');

export function loginMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {

      if (action.type === LOGIN) {
        switch (auth.validateCredentials(action.user.email, action.user.password)) {
          case 1:
            return dispatch(getToken({email: action.user.email, password: action.user.password, context: action.context}));
          case 2:
            return dispatch(warning('Invalid password.'));
          case 3:
            return dispatch(warning('Invalid email.'));
          default:
            return dispatch(warning('Unidentified validation error.'));
        }
      }

      return next(action);
    };
  };
}

export function signupMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {

      if (action.type === SIGNUP) {

        switch (auth.validateCredentials(action.user.email, action.user.password)) {
          case 1:
            break;
          case 2:
            return dispatch(warning('Password needs 8 characters and a number.'));
          case 3:
            return dispatch(warning('Invalid email.'));
          default:
            return dispatch(warning('Unidentified validation error.'));
        }

        var params = {
          email: action.user.email,
          password: action.user.password
        };

        dispatch(toggleLoader(true));

        fetch("https://funky-radish-api.herokuapp.com/users", {
          method: 'post',
          headers: new Headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(params)
        })
        .then(res=> {
          return res.clone().json()
        })
        .then(data => {
          if (data.message === "Verification email sent.") {
            dispatch(toggleLoader(false));
            return dispatch(warning("Check your email for a link to help complete your signup."))
          } else {
            dispatch(toggleLoader(false));
            return dispatch(warning(data.message))
          }
        })
        .catch(err => {
          dispatch(toggleLoader(false));
          return dispatch(warning('Error: ' + err))
        })
      }

      return next(action);
    };
  };
}

export function tokenCollectionMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {
      // do your stuff
      if (action.type === GET_TOKEN) {

        if (!action.authData) {
          return dispatch(authFailed("Get failed. Not logged in."));
        }

        var params = {
          email: action.authData.email,
          password: action.authData.password
        };

        var formBody = [];
        for (var property in params) {
          var encodedKey = encodeURIComponent(property);
          var encodedValue = encodeURIComponent(params[property]);
          formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");

        dispatch(toggleLoader(true));

        fetch("https://funky-radish-api.herokuapp.com/authenticate", {
          method: 'post',
          headers: new Headers({
            'Content-Type': 'application/x-www-form-urlencoded'
          }),
          body: formBody
        })
        .then(res => {
          return res.clone().json()
        })
        .then(data => {
          if (data.message === "Enjoy your token, ya filthy animal!") {

            realmService.authenticate(data.token)
            .then(user => {
              auth.setSession(data.token, action.authData.email)
              auth.setRealmUser(user)

              dispatch(setUsername(action.authData.email));
              dispatch(warning("Welcome! Hold on while we collect your recipes."));

              dispatch(toggleLoader(false));

              return dispatch(setRedirect("/"));
            })
            .catch(error => {
              dispatch(toggleLoader(false));
              return dispatch(warning("Realm connect failed: " + error.message));
            });
          }
          else if (data.message === "Email not verified.") {
            dispatch(toggleLoader(false));
            dispatch(setRedirect("/login"));
            return dispatch(warning("Check your email to verify your account."));
          }
          else {
            dispatch(toggleLoader(false));
            dispatch(setRedirect("/login"));
            return dispatch(warning(data.message));
          }
        })
        .catch(error => {
          dispatch(toggleLoader(false));
          return dispatch(warning("Auth failed: " + error.message));
        });
      }
      return next(action);
    };
  };
}

export function logoutMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {

      if (action.type === LOGOUT) {
        realmService.logoutRealm()
        return dispatch(setRedirect("/"));
      }

      return next(action);
    };
  };
}

export function emailVerificationMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {

      if (action.type === VERIFY_EMAIL) {
        dispatch(toggleLoader(true));
        const endpoint = "https://funky-radish-api.herokuapp.com/verify/" + action.token

        fetch(endpoint, { method: 'get' })
        .then(res=> {
          return res.clone().json()
        })
        .then(data => {
          console.log("fetch returned.")
          console.log(data)
          dispatch(toggleLoader(false));
          if ( data.message === "Email verified.") {
            return dispatch(setVerified("Welcome to Funky Radish! You can now login from any device."));
          }
          else {
            return dispatch(setVerified(data.message));
          }
        })
        .catch(error => {
          dispatch(toggleLoader(false));
          return dispatch(setVerified("Verification failed: " + error.message));
        });
      }
      return next(action);
    };
  };
}

export function recipeLoadingMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {

      if (action.type === GET_RECIPES) {

        dispatch(toggleLoader(true));
        console.log("get recipes action called")
        dispatch(toggleLoader(false));
        return dispatch(warning("getting recipes"))

        // return fetch("https://funky-radish-api.herokuapp.com/recipes", {
        //   method: 'get',
        //   headers: new Headers({
        //     'x-access-token': action.token
        //   })
        // })
        // .then(response => response.json())
        // .then(json => {
        //   if (json.message) {
        //     dispatch(warning(json.message))
        //     dispatch(toggleLoader(false));
        //     auth.setToken("");
        //     return dispatch(getToken());
        //   }
        //
        //   let user = auth.getUser();
        //   dispatch(setUsername(user));
        //   dispatch(toggleLoader(false));
        //
        //   json.forEach(recipe => recipe.clientID = uuid());
        //   return dispatch(recipesLoaded(json));
        // })
        // .catch(error => {
        //   dispatch(toggleLoader(false));
        //   return dispatch(warning("Recipe load failed."));
        // });
      }
      return next(action);
    };
  };
}

export function addRecipeMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {
      if (action.type === ADD_RECIPE) {
        let token = auth.getToken();

        if (!token) {
          return dispatch(warning("You're not logged in. Recipe will not be saved."));
        }

        var date = new Date();
        var formattedDate = moment.utc(date).format("YYYY-MM-DDTHH:mm:ss.sssz").replace(/UTC/, "Z");

        var params = {
          ingredients: action.recipe.ingredients,
          directions: action.recipe.directions,
          updatedAt: formattedDate,
          title: action.recipe.title,
          clientID: action.recipe.clientID
        }

        if(action.recipe._id) {
          let url = "https://funky-radish-api.herokuapp.com/recipe/" + action.recipe._id;

          fetch(url, {
            method: 'put',
            headers: new Headers({
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-access-token': token
            }),
            body: JSON.stringify(params)
          })
          .then(res=> {
            return res.clone().json()
          })
          .then(data => {
            if (data.message) {
              return dispatch(warning(data.message))
            }
            return dispatch(updateRecipe(data));
          })
          .catch(error => dispatch(warning(error)))
        }
        else {
          params = [params];

          fetch("https://funky-radish-api.herokuapp.com/recipes", {
            method: 'post',
            headers: new Headers({
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-access-token': token
            }),
            body: JSON.stringify(params)
          })
          .then(res=> {
            return res.clone().json()
          })
          .then(data => {
            if (data.message) {
              return dispatch(warning(data.message))
            }
            // update recipe to fill in ._id
            return dispatch(updateRecipe(data));
          })
          .catch(error => dispatch(warning(error)))
        }
      }
      return next(action);
    };
  };
}

export function getRecipeMiddleware({dispatch}) {
  return function(next) {
    return function(action) {
      if (action.type === GET_RECIPE) {

        console.log("fetching recipe: " + action.recipeTitle)

        // TODO: This isn't the prettiest solution, but it would take some thought to find a better one.
        // Currently, prepending with '-sp' means it's a recipe from the spoonacular API.
        // Otherwise, it's a recipe that's in your Realm account, and so we don't have to hit the funkyradish api
        //
        if (action.recipeTitle.substring(0, 3) === "sp-") {
          fetch("https://funky-radish-api.herokuapp.com/recipes/" + action.recipeTitle , {
            method: 'get'
          })
          .then(response => response.json())
          .then(json => {
            if (json.error.length > 0) {
              dispatch(warning(json.error))
              return dispatch(toggleLoader(false));
            }
            else {
              return dispatch(setRecipe(json));
            }
          })
          .catch(error => {
            console.log("a error here: " + error)
            return dispatch(warning("the error"));
          });
        }
        else {
          console.log("here we must retrieve the gql")

          const { loading, data } = useRecipe();
        }

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
          return dispatch(warning("You're not logged in. Recipe will not be removed."));
        }

        let id = action.recipe._id;
        let url = "https://funky-radish-api.herokuapp.com/recipe/" + id;

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
            return dispatch(warning("Delete failed."))
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
      // do your stuff
      if (action.type === WARNING) {
        setInterval(() => {
          return dispatch(warningToggle());
        }, 3000);
      }
      return next(action);
    };
  };
}

// export function importRecipesMiddleware({ dispatch }) {
//   return function(next) {
//     return function(action) {
//       if (action.type === IMPORT_RECIPES) {
//         console.log("importing recipes - query: " + action.query)
//
//         dispatch(toggleLoader(true));
//         const endpoint = "https://api.spoonacular.com/recipes/complexSearch?apiKey=baf6ca65c5e6461cbdb8f3cc87e1a730&query=" + action.query
//
//         fetch(endpoint, { method: 'get' })
//         .then(res=> {
//           return res.clone().json()
//         })
//         .then(data => {
//           //handle overloaded api code.
//
//           console.log("fetch returned.")
//
//           data.results.forEach(myFunction);
//
//           function myFunction(value, index, array) {
//             var rec = new Recipe(value.title)
//             console.log(rec.title)
//             console.log(value.title)
//           }
//
//
//
//           dispatch(toggleLoader(false));
//           // if ( data.message === "Email verified.") {
//           //   return dispatch(setVerified("Welcome to Funky Radish! You can now login from any device."));
//           // }
//           // else {
//           //   return dispatch(setVerified(data.message));
//           // }
//         })
//         .catch(error => {
//           dispatch(toggleLoader(false));
//           return dispatch(setVerified("Verification failed: " + error.message));
//         });
//
//         // dispatch(setImportQueue(["coookies", "butter"]));
//       }
//       return next(action);
//     };
//   };
// }

export function externalSearchMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {
      if (action.type === EXTERNAL_RECIPE_SEARCH) {
        // dispatch(toggleLoader(true))

        console.log("calling search: " + action.query)

        serverService.searchRecipes(action.query)
        .then(res=> {
          console.log("recipes: ", res.recipes)
          // dispatch(toggleLoader(false))
          return dispatch(externalRecipesLoaded(res.recipes.results))
        })
        .catch(err => {
          // dispatch(toggleLoader(false))
          console.log("here's the error: " + err)
          return dispatch(warning('Error: ' + err))
        })
      }
      return next(action);
    };
  };
}

export function autocompleteMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {
      if (action.type === AUTOCOMPLETE) {
        serverService.searchAutocomplete(action.query)
        .then(res=> {
          // I hate this. But it works. (see also services/ServerService.js)
          // I return a false response when the query is empty.
          // That false response doesn't need to be cloned like the normal fetch Promise
          // So I just check if it's already got the .suggestions key before returning.
          // Possible solutions:
          // 1. Fake the response with something that can be cloned.
          // 2. Research debounce to se if I can use it to cancel related threads.
          // 3. Research threads to see if there's a way to cancel the class of threads generated by the autocomplete query.

          if (res.suggestions) {
            return res
          } else {
            return res.clone().json()
          }
        })
        .then(data => {
          return dispatch(setSearchSuggestions(data.suggestions))
        })
        .catch(err => {
          return dispatch(warning('Error: ' + err))
        })
      }
      return next(action);
    };
  };
}

export function graphqlMiddleware({ dispatch }) {
  return function(next) {
    return function(action) {
      if (action.type === GRAPHQL) {
        console.log("graph callin middleware")
      }
      return next(action);
    };
  };
}
