// const { TwitterApi } = require('twitter-api-v2');
//
// const client = new TwitterApi('AAAAAAAAAAAAAAAAAAAAAFzBaQEAAAAAE%2FjyIpJ9Wl6CV5Z7z6054PSpQ3s%3Dbw5QWZger7hwifwaMhf4wwSinkp6Iqz8s3V8DqBdrsPilKSDtm');


const fetch = require('node-fetch');

const token = 'AAAAAAAAAAAAAAAAAAAAAFzBaQEAAAAAE%2FjyIpJ9Wl6CV5Z7z6054PSpQ3s%3Dbw5QWZger7hwifwaMhf4wwSinkp6Iqz8s3V8DqBdrsPilKSDtm';

var Twit = require('twit')
const MongoClient = require('mongodb').MongoClient;

const config = require('config');

var T = new Twit({
  consumer_key:         'mWFMtlyhmIkHwqwMX2Aj83z4d',
  consumer_secret:      'zdSajDpYS7IXd4hKaiylFsGj6z5lGbb2rIh6DYwrvuNTsz97Zt',
  access_token:         '30712452-Fo8lhLulogDjcshA028tPImAiLokf4ZWckRdvCT0o',
  access_token_secret:  '2CT3Srjv1d6Ck1uQ3NbbWTOeGZcvr0D8bgaKeW2GhIPoi',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL:            true,     // optional - requires SSL certificates to be valid.
})


// const qs = require('querystring');
// const request = require('request');
// const readline = require('readline').createInterface({
//   input: process.stdin,
//   output: process.stdout
// });
// const util = require('util');
//
// const get = util.promisify(request.get);
// const post = util.promisify(request.post);

const consumer_key = 'hWQQsToTwGDsHPOrk75Z6zmez';
const consumer_secret = 'Jhk1mrcX4hs7oJWnysyruDmB0zo47P9PToTbESTfyI3uHAyDWl';

const requestTokenURL = new URL('https://api.twitter.com/oauth/request_token');
const accessTokenURL = new URL('https://api.twitter.com/oauth/access_token');
const authorizeURL = new URL('https://api.twitter.com/oauth/authorize');
const endpointURL = new URL('https://api.twitter.com/labs/2/tweets');

const params = {
  query: '#funkyradish',
  'tweet.fields': 'text'
}

// async function input(prompt) {
//   return new Promise(async (resolve, reject) => {
//     readline.question(prompt, (out) => {
//       readline.close();
//       resolve(out);
//     });
//   });
// }
//
// async function requestToken() {
//   const oAuthConfig = {
//     callback: 'oob',
//     consumer_key: consumer_key,
//     consumer_secret: consumer_secret,
//   };
//
//   const req = await post({url: requestTokenURL, oauth: oAuthConfig});
//   if (req.body) {
//     return qs.parse(req.body);
//   } else {
//     throw new Error('Cannot get an OAuth request token');
//   }
// }
//
// async function accessToken({oauth_token, oauth_token_secret}, verifier) {
//   const oAuthConfig = {
//     consumer_key: consumer_key,
//     consumer_secret: consumer_secret,
//     token: oauth_token,
//     token_secret: oauth_token_secret,
//     verifier: verifier,
//   };
//
//   const req = await post({url: accessTokenURL, oauth: oAuthConfig});
//   if (req.body) {
//     return qs.parse(req.body);
//   } else {
//     throw new Error('Cannot get an OAuth request token');
//   }
// }
//
// async function getRequest({oauth_token, oauth_token_secret}) {
//   const oAuthConfig = {
//     consumer_key: consumer_key,
//     consumer_secret: consumer_secret,
//     token: oauth_token,
//     token_secret: oauth_token_secret,
//   };
//
//   const req = await get({url: endpointURL, oauth: oAuthConfig, qs: params, json: true});
//   if (req.body) {
//     return req.body;
//   } else {
//     throw new Error('Cannot get an OAuth request token');
//   }
// }

function embolden(text) {
  let diff;
  if (/[A-Z]/.test (text))
  {
      diff = "𝗔".codePointAt (0) - "A".codePointAt (0);
  }
  else
  {
      diff = "𝗮".codePointAt (0) - "a".codePointAt (0);
  }
  return String.fromCodePoint (text.codePointAt (0) + diff);
}

function tweetStorm(thread, replyTo) {
  // remove the first tweet from the thread, tweet it, and on the callback,
  // if the thread has more tweets, send it down the line with the next id.
  let tweet = thread.shift()

  if (replyTo) {
    T.post('statuses/update', { status: tweet, in_reply_to_status_id: replyTo }, function(err, data, response) {
      console.log("response from post: " + JSON.stringify(response))
      console.log("data from post: " + JSON.stringify(data))
      if (thread.length > 0) {
        console.log
        tweetStorm(thread, data.id_str)
      } else {
        console.log("I think I finished.")
      }
    })
  }
  else {
    T.post('statuses/update', { status: tweet, in_reply_to_status_id: replyTo }, function(err, data, response) {
      if (thread.length > 0) {
        tweetStorm(thread, null)
      } else {
        console.log("I think I'm done.'")
      }
    })
  }
}

function divideDirections(text) {

  let base = text.split(' ')
  var tweet1 = ''
  var tweet2 = ''

  base.forEach((word, i) => {
    if (tweet1.length + word.length < 270) {
      tweet1 = tweet1 + ' ' + word
    } else {
      tweet2 = tweet2 + ' ' + word
    }
  });

  let tweetArray = [tweet1]

  if(tweet2.length < 270) {
    tweetArray.push(tweet2)
  }
  else {
    let brokenTweet = divideDirections(tweet2)
    tweetArray.push(brokenTweet[0])
    tweetArray.push(brokenTweet[1])
  }

  return tweetArray
}

function divideIngredients(text) {

  let base = text.split('\n')
  var tweet1 = ''
  var tweet2 = ''

  base.forEach((line, i) => {
    if (tweet1.length + line.length < 270) {
      tweet1 = tweet1 + '\n' + line
    } else {
      tweet2 = tweet2 + '\n' + line
    }
  });

  let tweetArray = [tweet1]

  if(tweet2.length < 270) {
    tweetArray.push(tweet2)
  }
  else {
    let brokenTweet = divideIngredients(tweet2)
    tweetArray.push(brokenTweet[0])
    tweetArray.push(brokenTweet[1])
  }

  return tweetArray
}

function formatTweet(recipe) {
  let tweet = []

  let ing = recipe.ingredients.join('\n')

  let ti = recipe.title.replace(/[A-Za-z]/g, embolden);

  var lead = ti + '\n' + ing

  lead = lead
    .replace(' butter', ' 🧈' )
    .replace(' Butter', ' 🧈' )
    .replace(' salt', ' 🧂' )
    .replace(' Salt', ' 🧂' )
    .replace(' garlic', ' 🧄' )
    .replace(' Garlic', ' 🧄' )
    .replace(' onion', ' 🧅' )
    .replace(' Onion', ' 🧅' )
    .replace(' lemon', ' 🍋' )
    .replace(' Lemon', ' 🍋' )
    .replace(' tomato', ' 🍅' )
    .replace(' Tomato', ' 🍅' )
    .replace(' avocado', ' 🥑' )
    .replace(' Avocado', ' 🥑' )
    .replace(' egg', ' 🥚' )
    .replace(' Egg', ' 🥚' )
    .replace(' bacon', ' 🥓' )
    .replace(' Bacon', ' 🥓' )
    .replace(' carrot', ' 🥕' )
    .replace(' Carrot', ' 🥕' )
    .replace(' carrot', ' 🥕' )
    .replace(' Carrot', ' 🥕' )

  if (lead.length > 270) {
    divideIngredients(lead).forEach((item, i) => {
      tweet.push(item)
    });
  } else {
    tweet.push(lead)
  }

  recipe.directions.forEach((dir, i) => {
    if (dir.length < 270) {
      tweet.push((i+1) + '. ' + dir)
    }
    else {
      divideDirections(dir).forEach((item, i) => {
        tweet.push(item)
      });
    }
  });

  tweetStorm(tweet, '1506018080908283905')
}

exports.findRecipe = (query) => {
    // query for a recipe
    MongoClient.connect(config.DBHost, { useNewUrlParser: true, useUnifiedTopology: true }, function(dbErr, client) {

      if (dbErr == null) {
        const db = client.db("funky_radish_db")

        db.collection('Recipe')
        .find({
          $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
          title : { '$regex' : query, '$options' : 'i' }
        })
        .limit(1)
        .toArray(function(searchErr, docs) {

          if (searchErr == null && docs.length > 0) {
            let retrievedRecipe = {
              title: docs[0].title,
              ingredients: [],
              directions: []
            }

            db.collection('Ingredient')
            .find({
              _id : { $in : docs[0].ingredients}
            })
            .toArray(function(ingErr, ings) {
              if (ingErr == null) {
                let ingredients = ings.map((ing) => {
                  retrievedRecipe.ingredients.push(ing.name)
                })

                db.collection('Direction')
                .find({
                  _id : { $in : docs[0].directions}
                })
                .toArray(function(dirErr, dirs) {
                  if (dirErr == null) {
                    let ingredients = dirs.map((dir) => {
                      retrievedRecipe.directions.push(dir.text)
                    })

                    console.log("retrieved recipe")

                    formatTweet(retrievedRecipe)
                  } else {
                    console.log("dir retrieve error")
                  }
                })

              } else {
                console.log("ing retrieve error")
              }
            })

          }
          else {
            console.log("twitter ingredient search error: " + searchErr)
          }

        })
      } else {
        console.log("twitter mongo error: " + dbErr)
      }
    });
}

exports.replyWithRecipe = (user, query) => {
  console.log("user: " + user + ", query: " + query)
}

exports.findRecipeRequests = async (query) => {
  const endpoint = "https://api.twitter.com/2/tweets/search/recent?query=%23funkyradish";

  // const params = {
  //   'query': 'the ancient mariner',
  //   'tweet.fields': 'text'
  // }

  // console.log(params)

  let response = fetch(endpoint, {
      method: 'GET',
      headers: {
        "User-Agent": "v2RecentSearchJS",
        "authorization": `Bearer ${token}`
      },
      json: true
  })

  let data = await response
  return data;

  // try {
  //
  //   // Get request token
  //   const oAuthRequestToken = await requestToken();
  //
  //   // Get authorization
  //   authorizeURL.searchParams.append('oauth_token', oAuthRequestToken.oauth_token);
  //   console.log('Please go here and authorize:', authorizeURL.href);
  //   const pin = await input('Paste the PIN here: ');
  //
  //   // Get the access token
  //   const oAuthAccessToken = await accessToken(oAuthRequestToken, pin.trim());
  //
  //   // Make the request
  //   const response = await getRequest(oAuthAccessToken);
  //   console.log(response);
  // } catch(e) {
  //   console.error(e);
  //   process.exit(-1);
  // }
  // process.exit();
}

// bearer_token:  'AAAAAAAAAAAAAAAAAAAAAFzBaQEAAAAAMNl0Bm%2BG1kxT8Zpj1%2BrlV%2FPDHdA%3DzQanMvQ5eFnwDOU0mCce2dPmcdya7ZwxZm1s5yr14FwgSoCaSF',


exports.initializeTweetStream = () => {

  console.log("initializing tweet streamer.")

  var stream = T.stream('statuses/filter', { track: '#funkyradish', language: 'en' })

  stream.on('tweet', function (tweet) {
    console.log("incoming tweet: " + tweet)

    let query = tweet.text.replace('#funkyradish', '').trim()
    let replyTo = tweet.id

    console.log("querying: " + query)

    findRecipe(query)
  })

}
