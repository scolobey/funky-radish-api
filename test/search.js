// Check remove blocked junkWords.

//Check word matching.
"tiki cocktail with rum"


// Prepare for testing
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

const SearchQueryService = require('../services/search_query_service.js');

SearchQueryService.build(query)


describe('Search', () => {

  let queryBStructure = { "query": [
    {"tiki cocktail":{"code":2}},
    "raspberry",
    "raspberries",
    "surprise",
    "surprises"
  ],"with":["butter","sprouts","sprout"],"without":["walnut","walnuts","shallot","shallots"]}

  describe('tiki cocktail with rum', () => {
    it('it should processs correctly', (done) => {
      JSON.stringify(SearchQueryService.build(query)).should.be.eql('User succesfully removed.');
    });
  });

  describe('raspberry tiki cocktail surprise with butter sprouts without walnut and shallot', () => {
    it('it should processs correctly', (done) => {
      JSON.stringify(SearchQueryService.build(query)).should.be.eql('User succesfully removed.');
    });
  });

});
