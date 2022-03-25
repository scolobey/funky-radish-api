const fetch = require('node-fetch');

const Twit = require('twit')
const MongoClient = require('mongodb').MongoClient;

const config = require('config');

const DBHost = process.env.DBHost || config.get('DBHost');

const consumer_key = process.env.twit_consumer_key || config.get('twit_consumer_key');
const consumer_secret = process.env.twit_consumer_secret || config.get('twit_consumer_secret');
const access_token = process.env.twit_access_token || config.get('twit_access_token');
const access_token_secret = process.env.twit_access_token_secret || config.get('twit_access_token_secret');

var T = new Twit({
  consumer_key:         consumer_key,
  consumer_secret:      consumer_secret,
  access_token:         access_token,
  access_token_secret:  access_token_secret,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL:            true,     // optional - requires SSL certificates to be valid.
})

function embolden(text) {
  let diff;
  if (/[A-Z]/.test (text)) {
      diff = "𝗔".codePointAt (0) - "A".codePointAt (0);
  }
  else {
      diff = "𝗮".codePointAt (0) - "a".codePointAt (0);
  }
  return String.fromCodePoint (text.codePointAt (0) + diff);
}

function tweetStorm(thread, replyTo) {
  // remove the first tweet from the thread, tweet it, and on the callback,
  // if the thread has more tweets, send it down the line with the next id.
  let tweet = thread.shift()

  console.log("sending thread: " + replyTo + " length: " + thread.length)

  if (replyTo) {
    T.post('statuses/update', { status: tweet, in_reply_to_status_id: replyTo }, function(err, data, response) {
      if (thread.length > 0) {
        console.log(JSON.stringify(data))
        tweetStorm(thread, data.id_str)
      }
    })
  }
  else {
    T.post('statuses/update', { status: tweet, in_reply_to_status_id: replyTo }, function(err, data, response) {
      if (thread.length > 0) {
        tweetStorm(thread, null)
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

function formatTweet(recipe, replyTo) {
  let tweet = []
  let ing = recipe.ingredients.join('\n')
  let recipeTitle = recipe.title.replace(/[A-Za-z]/g, embolden);

  var lead = recipeTitle + '\n' + ing

  // Emojis can save characters and they look kinda exciting.
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
    .replace(' tomatoes', " 🍅" )
    .replace(' Tomatoes', " 🍅" )
    .replace(' avocado', ' 🥑' )
    .replace(' Avocado', ' 🥑' )
    .replace(' egg', ' 🥚' )
    .replace(' Egg', ' 🥚' )
    .replace(' bacon', ' 🥓' )
    .replace(' Bacon', ' 🥓' )
    .replace(' carrot', ' 🥕' )
    .replace(' Carrot', ' 🥕' )
    .replace(' carrots', ' 🥕' )
    .replace(' Carrots', ' 🥕' )

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

  tweetStorm(tweet, replyTo)
}

function findRecipe(query, replyTo) {
    // query for a recipe
    MongoClient.connect(DBHost, { useNewUrlParser: true, useUnifiedTopology: true }, function(dbErr, client) {
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
                    formatTweet(retrievedRecipe, replyTo)
                  }
                })
              }
            })
          }
          else {
            if (searchErr == null) {
              console.log("twitter search error: " + searchErr)
            } else {
              console.log("twitter bot couldn't find a recipe.")
            }
          }
        })
      } else {
        console.log("twitter mongo error: " + dbErr)
      }
    });
}

exports.initializeTweetStream = () => {
  console.log("initializing tweet streamer.")

  var stream = T.stream('statuses/filter', { track: '#funkyradish', language: 'en' })

  stream.on('connect', function (request) {
    console.log("tweet connect")
  })

  stream.on('connected', function (response) {
    console.log("tweet connected")
  })

  stream.on('disconnect', function (disconnectMessage) {
    console.log("tweet disconnect")
  })

  stream.on('limit', function (limitMessage) {
    console.log("tweet limit")
  })

  stream.on('message', function (msg) {
    console.log("event incoming: " + msg)
  })

  stream.on('tweet', function (tweet) {
    console.log("tweet incoming: " + JSON.stringify(tweet))

    let idOfEnd = ""
    let query = ""
    let replyTo = tweet.id_str

    if (tweet.extended_tweet) {
      idOfEnd = tweet.extended_tweet.full_text.indexOf('#funkyradish') + 12
      query = tweet.extended_tweet.full_text.slice(idOfEnd).trim();
    } else {
      idOfEnd = tweet.text.indexOf('#funkyradish') + 12
      query = tweet.text.slice(idOfEnd).trim();
    }

    console.log("query: " + query)

    findRecipe(query, replyTo)
  })
}
