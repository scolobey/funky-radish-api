const pluralize = require('pluralize')

function expand(query) {
  var queryExpansion = [query]

  if (pluralize.isPlural(query)) {
    console.log("is plural: " + pluralize.singular(query))
    queryExpansion.push(pluralize.singular(query))
  } else {
    console.log("not plural: " + pluralize.plural(query))
    queryExpansion.push(pluralize.plural(query))
  }

  let mappedExpansion = queryExpansion.map(phrase => { return {title : { '$regex' : phrase, '$options' : 'i' }} })

  return mappedExpansion
}

exports.build = (query) => {
  let queryExpansion = expand(query)

  let mongoQuery = {
    $or: [ { author: "61e1e4cafbb17b00164fc738" }, { author: "61b690c3f1273900d0fb6ca4" }, { author: "6219a8c99d61adca80c6d027" } ],
    $or: queryExpansion
  }

  return mongoQuery
}
