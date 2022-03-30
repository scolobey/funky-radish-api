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


// query structures and process
// https://docs.google.com/document/d/1_pveDDTd-s2K1POHEsHv09I-D0BL2s_LWXSRw8QSORQ/edit

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

function analyzeQueryStructure(phrase) {
  let phraseArray = phrase.split(" ")
  let phraseArrayLength = phraseArray.length
}

function switchQueryType(phrase, phraseConfig, titleExpansion) {
  // default for unmatched phrases.
  if (!phraseConfig || !phraseConfig.code) {
    let query = {
      $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
      $or: titleExpansion
    }

    return query
  }

  // 1 = title
  switch (phraseConfig.code) {

    case 1: {
      let query = {
        $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
        $or: titleExpansion
      }

      return query
    }
    // 2 = category
    case 2: {
      // Add a search clause to search for tagged recipes.
      let query = {
        $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
        tags: phrase
      }

      return query
    }
    // 3 = title + category TODO (this is still standard implementation)
    case 3: {
      let query = {
        $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
        $or: titleExpansion
      }

      return query
    }
    // 4 = ingredient
    case 4: {
      let query = {
        $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
        ingredients: "62215b9c5e3df2d232fb949b"
      }

      return query
    }
    default: {
      let query = {
        $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
        $or: titleExpansion
      }

      return query
    }
  }
}

exports.build = (query) => {
  let queryAnalysis = analyzeQueryStructure(query)
  let pluralExpansion = pluralExpand(query)
  let mongoQuery = structureMongoQuery(pluralExpansion)

  return mongoQuery
}
