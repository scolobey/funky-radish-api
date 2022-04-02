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

function expandByMatchAndPluralization(phrase) {
  var pluralExpansion = []
  let phraseObj = {}
  let matched = false

  if (pluralize.isPlural(phrase)) {
    console.log("plural");
    let singular = pluralize.singular(phrase)

    if (searchConfig[singular]) {
      phraseObj[singular] = searchConfig[singular]
      pluralExpansion.push(phraseObj)
      matched = true
    } else {
      console.log("no match: " + phrase + " : " + singular);
      pluralExpansion.push(phrase)
      pluralExpansion.push(singular)
    }
  } else {
    console.log("not plural");
    if (searchConfig[phrase]) {
      phraseObj[phrase] = searchConfig[phrase]
      pluralExpansion.push(phraseObj)
      matched = true
    } else {
      pluralExpansion.push(phrase)
      pluralExpansion.push(pluralize.plural(phrase))
    }
  }

  let paredPluralExpansion = removeDuplicates(pluralExpansion)

  let returnExpansion = {
    expansion: paredPluralExpansion,
    matched: matched
  }

  return returnExpansion
}

function expandPhrase(phrase) {
  let expandedPhrase = []
  if (!phrase || phrase.length === 0) {
    return expandedPhrase
  }
  
  let splitQuery = phrase.split(" ")
  console.log("expanding: " + splitQuery)

  let length = splitQuery.length
  let stageLength = length

  console.log("entering | length: " + length + ", stage length: " + stageLength )

  // split the phrase by word
  // iterate possible word combinations ([1, 2, 3]), ([1, 2], [2,3]), ([1], [2], [3])
  // iterate possible word combinations ([1,2,3,4,5]), ([1,2,3,4],[2,3,4,5]), ([1,2,3],[2,3,4],[3,4,5])

  while (stageLength > 0) {

    let start = 0
    console.log("decrementing stage size | length: " + length + ", stage length: " + stageLength + ", start: " + start)
    console.log("---------------------------------------------------")

    while (stageLength > 0 && start + stageLength <= length)  {

      console.log("iterating phrases of that stage size | length: " + length + ", stage length: " + stageLength + ", start: " + start)

      let currentPhrase = splitQuery.slice(start, start + stageLength).join(' ')
      console.log("checking: " + currentPhrase)

      let pluralMatchExpansion = expandByMatchAndPluralization(currentPhrase)
      console.log("expansion: " + JSON.stringify(pluralMatchExpansion))

      // expandedPhrase = expandedPhrase.concat(pluralMatchExpansion.expansion)

      if (pluralMatchExpansion.matched) {
        // ([1,2,3],*[2,3,4]*,[3,4,5])([1]),([5])

        if (start > 0 && stageLength > 1) {
          expandedPhrase = expandedPhrase.concat(pluralMatchExpansion.expansion)

          let startPhrase = splitQuery.slice(0, start).join(' ')
          let finishPhrase = splitQuery.slice(start + stageLength, length).join(' ')

          console.log("************ split queries **************")
          console.log("start: " + JSON.stringify(startPhrase))
          console.log("finish: " + JSON.stringify(finishPhrase))

          let startExpansion = expandPhrase(startPhrase)
          expandedPhrase = expandedPhrase.concat(startExpansion)

          if (finishPhrase.length > 0) {
            let finishExpansion = expandPhrase(finishPhrase)
            expandedPhrase = expandedPhrase.concat(finishExpansion)
          }

          console.log("expandedExpansion: " + JSON.stringify(startExpansion))

          stageLength = 0

        } else {
          console.log("adding to expansion: start is 0")
          expandedPhrase = expandedPhrase.concat(pluralMatchExpansion.expansion)

          splitQuery = splitQuery.slice(stageLength-1, length-1)

          start = 0
          length = splitQuery.length
          stageLength = length

        }

      } else {

        if (stageLength === 1) {
          console.log("not matched: but just 1 word")
          expandedPhrase = expandedPhrase.concat(pluralMatchExpansion.expansion)
        }

        // what do you add to the phrase expansion though?
        start++

      }

    }

    stageLength--
  }

  // let pluralExpandedQuery = expandByMatchAndPluralization(expandedPhrase)

  console.log("final expansion: " + JSON.stringify(expandedPhrase))

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

  console.log("query so far: " + JSON.stringify(expandedQuery))
  // let phraseMatchedQuery = phraseMatchQuery(expandedQuery)

  // console.log("query so far: " + JSON.stringify(expandedQuery))
  // let pluralExpansion = pluralExpand(query)
  // let queryAnalysis = analyzeQueryStructure(pluralExpansion)
  // let mongoQuery = structureMongoQuery(pluralExpansion)

  // return mongoQuery
}
