// Set environment to test
process.env.NODE_ENV = 'test';

// Fire up the server
const server = require('../server');

// Prepare for testing
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

// Models
const Recipe = require('../app/models/recipe.model.js');
const User = require('../app/models/user.model.js');

// Prepare variables
let standardToken = '';
let adminToken = '';

let standardUser = {
    name: 'manpearpig',
    email: 'manpearpig@email.com',
    password: '321123',
    admin: false
}

let adminUser = {
  name: 'username',
  email: 'email@email.com',
  password: '123321',
  admin: true
}

describe('Recipes', () => {

  before(function(done){
    // Clear data
    Recipe.remove({}, (err) => {
      if(err) {
        console.log(err);
      }
      else {};
    });

    User.remove({}, (err) => {
      if(err) {
        console.log(err);
      }
      else {};
    });

    done();
  })

  // Add a user
  describe('/POST standard user', () => {
    it('it should POST a standard user', (done) => {

      chai.request('http://localhost:8080')
        .post('/users')
        .send(standardUser)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message').eql('User created successfully.');
          res.body.data.should.have.property('name').eql('manpearpig');
          res.body.data.should.have.property('email').eql('manpearpig@email.com');
          res.body.data.should.have.property('password');
          res.body.data.should.have.property('admin').eql(false);
          standardUser._id = res.body.data._id;
          done();
        });
    });
  });

  // Add admin user
  describe('/POST admin user', () => {
    it('it should POST an admin user', (done) => {

      chai.request('http://localhost:8080')
        .post('/users')
        .send(adminUser)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message').eql('User created successfully.');
          res.body.data.should.have.property('name').eql('username');
          res.body.data.should.have.property('email').eql('email@email.com');
          res.body.data.should.have.property('password');
          res.body.data.should.have.property('admin').eql(true);
          done();
        });
    });
  });

  // GET token for standard authentication
  describe('/POST standard authentication', () => {

    it('it should return a standard token', (done) => {

      chai.request('http://localhost:8080')
        .post('/authenticate')
        .send({email: standardUser.email, password: standardUser.password})
        .end((err, res) => {
          res.body.should.have.property('token');
          standardToken = res.body.token;
          done();
        });

    });

    it('standard token should not allow access to users list', (done) => {
      chai.request('http://localhost:8080')
        .get('/users')
        .set('x-access-token', standardToken)
        .end((err, res) => {
          res.should.have.status(403);
          res.body.message.should.be.eql('This action requires authentication.');
          done();
        });

    });
  });

  // GET token for admin authentication
  describe('/POST admin authentication', () => {

    it('it should return an admin token', (done) => {

      chai.request('http://localhost:8080')
        .post('/authenticate')
        .send({email: adminUser.email, password: adminUser.password})
        .end((err, res) => {
          res.body.should.have.property('token');
          adminToken = res.body.token;
          done();
        });

    });

    it('admin token should allow access to users list', (done) => {
      chai.request('http://localhost:8080')
        .get('/users')
        .set('x-access-token', adminToken)
        .end((err, res) => {
          for (i in res.body) {
            if (res.body[i].email == adminUser.email) {
              adminUser._id = res.body[i]._id;
            }
            else {
              standardUser._id = res.body[i]._id;
            }
          }
          res.should.have.status(200);
          res.body.should.be.a('array');
          done();
        });

    });
  });

  // POST
  describe('/POST recipe', () => {
    it('it should POST a new recipe', (done) => {
      let recipe = {
        title: 'Nuclear Bacon Dog',
        ingredients: ['Nuclear Bacon Dog', 'Ham', 'Nuclear Bacon Dog'],
        directions: ['Nuclear Bacon Dog', 'Is', 'A mans best', 'Friend!'],
        author: standardUser._id
      };

      chai.request('http://localhost:8080')
        .post('/recipes')
        .send(recipe)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.title.should.be.eql('Nuclear Bacon Dog');
          res.body.ingredients.should.be.eql(['Nuclear Bacon Dog', 'Ham', 'Nuclear Bacon Dog']);
          res.body.directions.should.be.eql(['Nuclear Bacon Dog', 'Is', 'A mans best', 'Friend!']);
          recipeId = res.body._id;
          done();
        });
    });
  });

  describe('/POST recipe without an author', () => {
    it('it should POST a new recipe without an author', (done) => {
      let recipe = {
        title: 'Nuclear Bacon Dog',
        ingredients: ['Nuclear Bacon Dog', 'Ham', 'Nuclear Bacon Dog'],
        directions: ['Nuclear Bacon Dog', 'Is', 'A mans best', 'Friend!']
      };

      chai.request('http://localhost:8080')
        .post('/recipes')
        .send(recipe)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.title.should.be.eql('Nuclear Bacon Dog');
          res.body.ingredients.should.be.eql(['Nuclear Bacon Dog', 'Ham', 'Nuclear Bacon Dog']);
          res.body.directions.should.be.eql(['Nuclear Bacon Dog', 'Is', 'A mans best', 'Friend!']);
          res.body.should.not.have.property('author');
          done();
        });
    });
  });

  describe('/POST an empty recipe', () => {
    it('it should not POST an empty recipe', (done) => {
      let recipe = {
        title: '',
        ingredients: [],
        directions: []
      };

      chai.request('http://localhost:8080')
        .post('/recipes')
        .send(recipe)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.message.should.be.eql('Recipe cannot be empty.');
          done();
        });
    });
  });

  // UPDATE
  describe('/PUT recipe without auth', () => {
    it('it should not UPDATE the recipe without auth', (done) => {
      recipe = {
        title: 'Bacon Nuclear Dog',
        ingredients: ['Bacon Bacon Dog', 'Ham', 'Bacon Nuclear Dog'],
        directions: ['Bacon Dog Nuclear', 'Is a blast', 'my', 'Friend!']
      };

      chai.request('http://localhost:8080')
        .put('/recipes/' + recipeId)
        .send(recipe)
        .end((err, res) => {
          res.should.have.status(403);
          res.body.message.should.be.eql('This action requires authentication.');
          done();
        });
    });
  });

  describe('/PUT recipe with auth', () => {
    it('it should UPDATE the recipe with auth', (done) => {
      recipe = {
        title: 'Bacon Nuclear Dog',
        ingredients: ['Bacon Bacon Dog', 'Ham', 'Bacon Nuclear Dog'],
        directions: ['Bacon Dog Nuclear', 'Is a blast', 'my', 'Friend!'],
        author: standardUser._id
      };

      chai.request('http://localhost:8080')
        .put('/recipes/' + recipeId)
        .set('x-access-token', standardToken)
        .send(recipe)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.title.should.be.eql('Bacon Nuclear Dog');
          res.body.ingredients.should.be.eql(['Bacon Bacon Dog', 'Ham', 'Bacon Nuclear Dog']);
          res.body.directions.should.be.eql(['Bacon Dog Nuclear', 'Is a blast', 'my', 'Friend!']);
          res.body.author._id.should.be.eql(standardUser._id);
          res.body.author.name.should.be.eql('manpearpig');
          done();
        });
    });
  });


  // GET
  describe('/GET recipes', () => {
    it('it should GET all existing recipes', (done) => {
      chai.request('http://localhost:8080')
        .get('/recipes')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          res.body.length.should.be.eql(2);
          done();
        });
    });
  });

  // GET
  describe('/GET recipes with recipeTitle', () => {
    it('it should not GET a non existent recipe', (done) => {
      chai.request('http://localhost:8080')
        .get('/recipes/Non-Existent-Recipe')
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });
    it('it should GET recipe we just created.', (done) => {
      chai.request('http://localhost:8080')
        .get('/recipes/Nuclear-Hot-Dog')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.title.should.be.eql('Nuclear Bacon Dog');
          res.body.ingredients.should.be.eql(['Nuclear Bacon Dog', 'Ham', 'Nuclear Bacon Dog']);
          res.body.directions.should.be.eql(['Nuclear Bacon Dog', 'Is', 'A mans best', 'Friend!']);
          res.body.should.not.have.property('author');
          done();
        });
    });
  });

  // DELETE
  describe('/DELETE recipes without auth', () => {
    it('it should not DELETE a recipe with a given Id and invalid auth', (done) => {
      chai.request('http://localhost:8080')
        .delete('/recipes/' + recipeId)
        .end((err, res) => {
          res.should.have.status(403);
          res.body.message.should.be.eql('This action requires authentication.');
          done();
        });
    });
  });

  describe('/DELETE recipe with auth', () => {
    it('it should DELETE a recipe with a given Id', (done) => {
      chai.request('http://localhost:8080')
        .delete('/recipes/' + recipeId)
        .set('x-access-token', standardToken)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.message.should.be.eql('Recipe deleted successfully!');
          done();
        });
    });
  });

});
