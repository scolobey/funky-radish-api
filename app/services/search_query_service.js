const pluralize = require('pluralize')
const searchConfig = require('../../config/search-config.json')



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

function processPhrase(phrase) {
  let analysisArray = []
  // remove last element. remove first element.

  if (searchConfig[phrase]) {
    analysisArray.push(searchConfig[phrase])
  }

  return analysisArray
}

function analyzeQueryStructure(phrases) {

  let analysisArray = []

  phrases.forEach((phrase, i) => {
    let newPhrases = processPhrase(phrase)
    if (newPhrases.length > 0) {
      analysisArray.concat(newPhrases)
    }
  });

  console.log("analysis: " + JSON.stringify(analysisArray))
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





function matchPhrase(phrase) {
  let analysisArray = []
  // remove last element. remove first element.

  if (searchConfig[phrase]) {
    analysisArray.push(searchConfig[phrase])
  }

  return analysisArray
}



// function orderByLength()

function removeDuplicates(phraseSet) {
  let uniquePhraseSet = phraseSet.filter(function(item, pos) {
    return phraseSet.indexOf(item) == pos;
  })

  return uniquePhraseSet
}

// Check each phrase for plurality.
// If plural, singularize.
// Check singular against search-config.json
// if matched, replace the phrase with the config object.
// if not matched, add the corresponding singular/plural alternate to the expansion.
// remove duplicate entries.
function expandByPluralization(phraseSet) {
  var pluralExpansion = phraseSet

  phraseSet.forEach((phrase, i) => {
    let phraseObj = {}

    if (pluralize.isPlural(phrase)) {
      let singular = pluralize.singular(phrase)

      if (searchConfig[singular]) {
        phraseObj[singular] = searchConfig[singular]
        pluralExpansion.splice(i, 1, phraseObj)
      } else {
        pluralExpansion.push(singular)
      }
    } else {
      if (searchConfig[phrase]) {
        phraseObj[phrase] = searchConfig[phrase]
        pluralExpansion.splice(i, 1, phraseObj)
      } else {
        pluralExpansion.push(pluralize.plural(phrase))
      }
    }
  });

  let paredPluralExpansion = removeDuplicates(pluralExpansion)

  return paredPluralExpansion
}

function expandPhrase(phrase) {
  let expandedPhrase = []
  let splitQuery = phrase.split(" ")

  let length = splitQuery.length

  let stageLength

  for (let stageLength = length; stageLength > 0; stageLength--) {
    let start = 0

    while (start + stageLength <= length) {
      expandedPhrase.push(splitQuery.slice(start, start + stageLength).join(' '))
      start++
    }
  }

  let pluralExpandedQuery = expandByPluralization(expandedPhrase)

  return pluralExpandedQuery
}

function expandQuery(query) {
  console.log("query: " + JSON.stringify(query))
  query.query = expandPhrase(query.query[0])
  query.with = expandPhrase(query.with[0])
  query.without = expandPhrase(query.without[0])

  return query
}

function handleWithWithout(query) {
  let segmentedQuery = {
      query: [],
      with: [],
      without: [],
  }

  let withIndex = query.indexOf(" with ")
  let withoutIndex = query.indexOf(" without ")

  console.log("withIndex: " + withIndex);
  console.log("withoutIndex: " + withoutIndex);

  if (withIndex>0 && withoutIndex>0 && (withIndex < withoutIndex)) {
    console.log("with comes first");
    let segmentA = query.split(" with ")
    let segmentB = segmentA[1].split(" without ")

    segmentedQuery.query.push(segmentA[0].trim())
    segmentedQuery.with.push(segmentB[0].trim())
    segmentedQuery.without.push(segmentB[1].trim())
  }
  else if (withIndex>0 && withoutIndex>0 && (withIndex > withoutIndex)) {
    console.log("without comes first");
    let segmentA = query.split(" without ")
    let segmentB = segmentA[1].split(" with ")

    segmentedQuery.query.push(segmentA[0].trim())
    segmentedQuery.without.push(segmentB[0].trim())
    segmentedQuery.with.push(segmentB[1].trim())
  }
  else if (withIndex && withoutIndex<0){
    console.log("no without");
    let segment = query.split(" with ")
    segmentedQuery.query.push(segment[0].trim())
    segmentedQuery.with.push(segment[1].trim())
  }
  else if (withIndex<0 && withoutIndex){
    console.log("no with");
    let segment = query.split(" without ")
    segmentedQuery.query.push(segment[0].trim())
    segmentedQuery.without.push(segment[1].trim())
  }
  else {
    console.log("this shouldnt happen");
  }

  return segmentedQuery
}

function removeJunkWords(query) {
  return query.replace(/ and /g, ' ')
}

function formatQuery(query) {
  let segmentedQuery = {
      query: [],
      with: [],
      without: [],
  }

  let cleanQuery = removeJunkWords(query)

  if (cleanQuery.includes(" with")) {
    segmentedQuery = handleWithWithout(cleanQuery)
  } else {
    segmentedQuery.query.push(cleanQuery)
  }

  return segmentedQuery
}

exports.build = (query) => {
  let structuredQuery = formatQuery(query)
  let expandedQuery = expandQuery(structuredQuery)
  // let phraseMatchedQuery = phraseMatchQuery(expandedQuery)

  console.log("query so far: " + JSON.stringify(expandedQuery))
  // let pluralExpansion = pluralExpand(query)
  // let queryAnalysis = analyzeQueryStructure(pluralExpansion)
  // let mongoQuery = structureMongoQuery(pluralExpansion)

  // return mongoQuery
}
