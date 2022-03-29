const pluralize = require('pluralize')
const searchConfig = require('../../config/search-config.json')

function pluralExpand(query) {
  var pluralExpansion = [query]

  if (pluralize.isPlural(query)) {
    pluralExpansion.push(pluralize.singular(query))
  } else {
    pluralExpansion.push(pluralize.plural(query))
  }

  return pluralExpansion
}


// query structures
// 1. title
// {
//   $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
//   $or: [{title : { '$regex' : phrase, '$options' : 'i' }}, {title : { '$regex' : phrase, '$options' : 'i' }}]
// }

// 2. category
// {
//   $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
//   tags: { $elemMatch: phrase }
// }

// Query process
// Expand plurals
// structure query

function structureMongoQuery(queries) {
  let baseQuery
  let mongoQuery
  let phraseConfig
  let matchedPhrase

  let mappedExpansion = queries.map(phrase => {
    // Check if the phrase is there
    if (searchConfig[phrase]) {
      phraseConfig = searchConfig[phrase]
      matchedPhrase = phrase
    }
    return {title : { '$regex' : phrase, '$options' : 'i' }}
  })

  mongoQuery = switchQueryType(matchedPhrase, phraseConfig, mappedExpansion)

  return mongoQuery
}

function switchQueryType(phrase, phraseConfig, expansion) {

  if (!phraseConfig || !phraseConfig.code) {
    let query = {
      $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
      $or: expansion
    }

    return query
  }

  switch (phraseConfig.code) {
    case 1: {
      let query = {
        $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
        $or: expansion
      }

      return query
    }
    case 2: {
      // Add a search clause to search for tagged recipes.
      let query = {
        $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
        tags: phrase
      }

      return query
    }
    case 4: {
      let query = {
        $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
        $or: expansion
      }

      return query
    }
    default: {
      let query = {
        $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
        $or: expansion
      }

      return query
    }
  }

}

exports.build = (query) => {
  let pluralExpansion = pluralExpand(query)
  let mongoQuery = structureMongoQuery(pluralExpansion)

  return mongoQuery
}
