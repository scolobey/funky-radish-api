const pluralize = require('pluralize')
const searchConfig = require('../../config/search-config.json')

// query structures and process
// https://docs.google.com/document/d/1_pveDDTd-s2K1POHEsHv09I-D0BL2s_LWXSRw8QSORQ/edit

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
}

function compressQuery(queryList) {
  let mainQuery = {}
  let baseQuery = [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ]

  mainQuery["$or"] = baseQuery
  mainQuery["$and"] = queryList

  return mainQuery
}

function switchQueryType(phrase, phraseConfig) {
  phrase = phrase

  // 1 = title
  switch (phraseConfig.code) {

    case 1: {
      let query = {
          title: { $regex: "(^| +|\\()" + phrase + "( +|$|\\))", $options: "i" }
      }

      return query
    }
    // 2 = category
    case 2: {
      // Add a search clause to search for tagged recipes.
      let query = {
          tags: phrase.trim()
      }

      return query
    }

    // 3 = title + category TODO
    case 3: {
      let query = {
          $or: [{title: { $regex: "(^| +|\\()" + phrase + "( +|$|\\))", $options: "i" }}, {tags: phrase.trim()}]
      }

      return query
    }

    // 4 = ingredient
    case 4: {

      let query = {
          ing: { $regex: phrase, $options: "i" }
      }

      return query
    }

    default: {
      let query = {
          title: { $regex: phrase, $options: "i" }
      }

      return query
    }
  }
}

function generateMongoQuery(expandedQuery) {

  let mappedExpansion = expandedQuery.query.map(phrase => {

    if (phrase.$or) {
      // this checks for those singled out words as added to the expandedPhrase in expandPhrase
      return phrase
    } else {
      // otherwise we handle the phrase structure.
      let phraseString = Object.keys(phrase)[0]
      let phraseDictionary = phrase[Object.keys(phrase)[0]]
      return switchQueryType(phraseString, phraseDictionary)
    }

  })

  return mappedExpansion
}

function expandByMatchAndPluralization(phrase) {
  let pluralArray = []
  pluralArray.push(phrase)

  var pluralExpansion = []

  // Find the plural or singular respectively.
  if (pluralize.isPlural(phrase)) {
    let singular = pluralize.singular(phrase)
    if (singular != phrase) {
        pluralArray.push(singular)
    }
  } else {
    let plural = pluralize.plural(phrase)
    if (plural != phrase) {
        pluralArray.push(plural)
    }
  }

  // Check for matching of either singular or polural
  if (searchConfig[pluralArray[0]]) {
    let phraseObject = {}
    phraseObject[pluralArray[0]] = searchConfig[pluralArray[0]]
    return { expansion: [phraseObject], matched: true}
  } else if (searchConfig[pluralArray[1]]) {
    let phraseObject = {}
    phraseObject[pluralArray[1]] = searchConfig[pluralArray[1]]
    return { expansion: [phraseObject], matched: true}
  } else {
    return { expansion: pluralArray, matched: false}
  }
}

function expandByMatch(phrase) {
  if (searchConfig[phrase]) {

  } else {

  }
}

function expandPhrase(phrase) {
  console.log("expanding: " + phrase);

  let expandedPhrase = []

  if (!phrase || phrase.length === 0) {
    console.log("nothing to expand");
    return expandedPhrase
  }

  let splitQuery = phrase.split(" ")
  let length = splitQuery.length
  let stageLength = length

  // The following while statement should work like this...
  // ([1,2,3],*[2,3,4]*,[3,4,5])([1]),([5])

  // as long as the stageLength is greater than 0
  // keep goin.
  while (stageLength > 0) {
    let start = 0

    // as long as the stageLength is greater than 0
    // and the specified segment doesn't extend beyond the array
    // we keep goin.
    while (stageLength > 0 && start + stageLength <= length && stageLength != 0)  {

      let currentPhrase = splitQuery.slice(start, start + stageLength).join(' ')
      let pluralMatchExpansion = expandByMatchAndPluralization(currentPhrase)

      //check if the phrase was matched.
      if (pluralMatchExpansion.matched) {
        if (start > 0 && stageLength > 1) {
          // if the subphrase was matched
          // and it does not include the beginning of the parent phrase
          // and the phrase is longer than 1 word
          // add it's expansion to the expandedPhrase array.
          expandedPhrase = expandedPhrase.concat(pluralMatchExpansion.expansion)

          // then expand the surrounding sub phrases.
          let startPhrase = splitQuery.slice(0, start).join(' ')
          let finishPhrase = splitQuery.slice(start + stageLength, length).join(' ')

          let startExpansion = expandPhrase(startPhrase)
          expandedPhrase = expandedPhrase.concat(startExpansion)

          if (finishPhrase.length > 0) {
            let finishExpansion = expandPhrase(finishPhrase)
            expandedPhrase = expandedPhrase.concat(finishExpansion)
          }

          // This stage should be completed.
          stageLength = 0
        }  else {
          // if the subphrase was matched
          // but it either includes the beginning of the parent phrase
          // or the phrase is only 1 word or less
          // add it's expansion to the expandedPhrase array.
          // remove the phrase from the query
          // (start over) set the start to the beginning and reset the length
          expandedPhrase = expandedPhrase.concat(pluralMatchExpansion.expansion)

          splitQuery.splice(start, stageLength)

          start = 0
          length = splitQuery.length

          stageLength = length
        }
      } else {

        if (stageLength === 1) {
          // if the phrase was not matched
          // and the phrase is only 1 word long.
          // add a cue to search for that word and its plural in the title in the expandedPhrase
          let pluralQuery = {
            $or: pluralMatchExpansion.expansion.map(phrase => {
              return {title: {$regex: phrase, $options: "i"}}
            })
          }

          expandedPhrase = expandedPhrase.concat(pluralQuery)
        }

        // if the phrase was not matched
        // but it is loger than 1 word, move the start forward without adding to the expandedPhrase.

        start++
      }

    }
    stageLength--
  }

  return expandedPhrase
}

function expandQuery(query) {
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

  if (withIndex>0 && withoutIndex>0 && (withIndex < withoutIndex)) {
    let segmentA = query.split(" with ")
    let segmentB = segmentA[1].split(" without ")

    segmentedQuery.query.push(segmentA[0].trim())
    segmentedQuery.with.push(segmentB[0].trim())
    segmentedQuery.without.push(segmentB[1].trim())
  }
  else if (withIndex>0 && withoutIndex>0 && (withIndex > withoutIndex)) {
    let segmentA = query.split(" without ")
    let segmentB = segmentA[1].split(" with ")

    segmentedQuery.query.push(segmentA[0].trim())
    segmentedQuery.without.push(segmentB[0].trim())
    segmentedQuery.with.push(segmentB[1].trim())
  }
  else if (withIndex && withoutIndex<0){
    let segment = query.split(" with ")
    segmentedQuery.query.push(segment[0].trim())
    segmentedQuery.with.push(segment[1].trim())
  }
  else if (withIndex<0 && withoutIndex){
    let segment = query.split(" without ")
    segmentedQuery.query.push(segment[0].trim())
    segmentedQuery.without.push(segment[1].trim())
  }
  else {
    console.log("this should never happen");
  }

  return segmentedQuery
}

function removeJunk(query) {
  return query.replace(/ and /g, ' ').replace(/-/g, ' ')
}

function formatQuery(query) {
  let segmentedQuery = {
      query: [],
      with: [],
      without: [],
  }

  let cleanQuery = removeJunk(query)

  if (cleanQuery.includes(" with")) {
    segmentedQuery = handleWithWithout(cleanQuery)
  } else {
    segmentedQuery.query.push(cleanQuery)
  }

  return segmentedQuery
}

// Discard useless words
// Divide query data into (query / with / without) phrase
// Expand each phrase
//  a. Split phrase into words
//  b. iterate all possible word combinations ([1,2,3,4,5]), ([1,2,3,4],[2,3,4,5]), ([1,2,3],[2,3,4],[3,4,5])
//    1. Obtain pluralization alternate.
//    2. Check borh singular and plural for match to search-config.js dictionary.
//    3. If match, divide the query around the phrase. Push matched phrase object to extendedPhrase array.
//    4. Continue checking remaining phrases which were not included in the match.
//    5. If phrase includes only one word and is not matched in the dictionary, add both plural and singular to extendedPhrase array.
//    6. Remove duplicate phrases.
//  c. Translate to mongo queries
//  d. Combine queries
//  e. Compile with and without
//  f. ranking


exports.build = (query) => {
  let structuredQuery = formatQuery(query)
  let expandedQuery = expandQuery(structuredQuery)

  console.log("query after expansion: " + JSON.stringify(expandedQuery))

  let mongoQuery = generateMongoQuery(expandedQuery)

  let compressedQuery = compressQuery(mongoQuery)

  console.log("returning query: " + JSON.stringify(compressedQuery))

  return compressedQuery
}

function matchConfig(plural, singular) {
  if (searchConfig[plural]) {
    return searchConfig[plural]
  } else if (searchConfig[singular]) {
    return searchConfig[singular].description
  } else {
    return ""
  }
}

function findConfig(pluralities) {
  let mainPhraseConfig = {}

  pluralities.forEach((item, i) => {
    if (searchConfig[item]) {
      // If you don't clone the segment, editing will end up persisting until reload.
      mainPhraseConfig = JSON.parse(JSON.stringify(searchConfig[item]))
    }
  });

  return mainPhraseConfig
}

function expandByPluralization(query) {
  let pluralities = []

  if (pluralize.isPlural(query)) {
    let singular = pluralize.singular(query)
    pluralities = [query, singular]
  } else {
    let plural = pluralize.plural(query)
    pluralities = [plural, query]
  }

  if (pluralities[0] == pluralities[1]) {
    pluralities.pop()
    return pluralities
  } else {
    return pluralities
  }
}

exports.getDescription = (query) => {
  console.log("summarizing: " + query);
  // if (pluralize.isPlural(query)) {
  //   let singular = pluralize.singular(query)
  //   return checkForDescription(query, singular)
  // } else {
  //   let plural = pluralize.plural(query)
  //   return checkForDescription(plural, query)
  // }
}

exports.checkSearchConfig = (query) => {
  let pluralities = expandByPluralization(query)
  let phraseConfig = findConfig(pluralities)
  return phraseConfig
}

exports.checkRecipeSearchConfig = (tags) => {
  var config = {}
  //TODO: This can certainly be more efficient.
  for (int in tags) {
    var temporaryConfig = this.checkSearchConfig(tags[int])

    delete temporaryConfig.description

    if (!config.parents && temporaryConfig.parents) {
      temporaryConfig.parents.push(tags[int])
      config = temporaryConfig
    } else if (config.parents && (temporaryConfig.parents.length > config.parents.length)) {
      temporaryConfig.parents.push(tags[int])
      config = temporaryConfig
    }
  }

  return config
}

exports.matchTags = (title) => {

  if (!title || title.length === 0) {
    return {}
  }

  let splitTitle = title.toLowerCase().split(" ")

  let length = splitTitle.length
  let stageLength = length

  while (stageLength > 0) {
    let start = 0

    while (stageLength > 0 && start + stageLength <= length)  {

      let currentPhrase = splitTitle.slice(start, start + stageLength).join(' ')
      let pluralMatchExpansion = expandByMatchAndPluralization(currentPhrase)

      if (pluralMatchExpansion.matched) {
        let returnedTitleConfig = this.checkRecipeSearchConfig(expandByPluralization(Object.keys(pluralMatchExpansion.expansion[0])[0]))
        return returnedTitleConfig
      } else {
        start++
      }
    }
    stageLength--
  }

  return {}
}
