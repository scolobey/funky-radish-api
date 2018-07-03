// Set environment to test
process.env.NODE_ENV = 'test';

// Fire up the server
const server = require('../server');

// Prepare for testing
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

// Model
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

describe('Users', () => {

  before(function(done){
    // Clear data
    User.remove({}, (err) => {
      if(err) {
        console.log(err);
      }
      else done();
    });
  })

  // Add a user

  describe('/POST user without name', () => {
    it('it should not POST a user if no name is specified', (done) => {
      var brokenUser = {
          email: 'manpearpig@email.com',
          password: '321123',
          admin: false
      }

      chai.request('http://localhost:8080')
        .post('/users')
        .send(brokenUser)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.message.should.be.eql('User must have a name, email and password.');
          done();
        });
    });
  });

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
          done();
        });
    });
  });

  describe('/POST user with pre-existing email', () => {
    it('it should not POST a user if the email has already been used', (done) => {
      chai.request('http://localhost:8080')
        .post('/users')
        .send(standardUser)
        .end((err, res) => {
          res.should.have.status(500);
          res.body.message.should.be.eql('User validation failed: email: email is already taken.');
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

  // DELETE if admin

  // UPDATE if admin

  // GET specific user if you are that user
  describe('/GET user with userId', () => {

    it('should not return a user without a token', (done) => {

      chai.request('http://localhost:8080')
        .get('/users/' + standardUser._id)
        .end((err, res) => {
          res.should.have.status(403);
          res.body.message.should.be.eql('This action requires authentication.');
          done();
        });

    });

    it('should return a user if you are admin', (done) => {

      chai.request('http://localhost:8080')
        .get('/users/' + standardUser._id)
        .set('x-access-token', adminToken)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });

    });

    it('should return a user if you are that user', (done) => {

      chai.request('http://localhost:8080')
        .get('/users/' + standardUser._id)
        .set('x-access-token', standardToken)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });

    });

  });

});
