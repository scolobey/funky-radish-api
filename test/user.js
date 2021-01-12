const config = require('config');

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
    email: 'manpearpig@email.com',
    password: '321123'
}

const host = config.get('AppRoot');

describe('Users', () => {

  before(function(done){
    console.log("Preparing data.")
    // Clear data
    User.remove({}, (err) => {
      if(err) {
        console.log(err);
      }
      else done();
    });
  });

  describe('/POST standard user', () => {

    it('it should POST a standard user', (done) => {
      console.log('ENV: ', process.env.NODE_ENV)
      console.log('ROOT: ', host)

      chai.request(host)
        .post('/users')
        .send(standardUser)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message').eql('Verification email sent.');
          done();
        });
    });

  });

  describe('/POST user with pre-existing email', () => {

    it('it should not POST a user if the email has already been used', (done) => {
      chai.request(host)
        .post('/users')
        .send(standardUser)
        .end((err, res) => {
          res.body.message.should.be.eql('User creation failed.');
          res.body.error.message.should.be.eql('User validation failed: email: email is already taken.');
          done();
        });
    });

  });

  // GET token for standard authentication
  describe('/POST standard authentication', () => {

    it('it should not return a token if user is unverified', (done) => {
      chai.request(host)
        .post('/authenticate')
        .send({email: standardUser.email, password: standardUser.password})
        .end((err, res) => {
          res.body.message.should.be.eql('Email not verified.');
          done();
        });
    });

  });
});

    // I dunno how to verify without email access?
    // it('it should return a token if user is verified', (done) => {
    //   chai.request('http://localhost:8080')
    //     .post('/authenticate')
    //     .send({email: standardUser.email, password: standardUser.password})
    //     .end((err, res) => {
    //       res.body.should.have.property('token');
    //       standardToken = res.body.token;
    //       done();
    //     });
    // });

    // it('it should return a standard token', (done) => {
    //
    //   chai.request('http://localhost:8080')
    //     .post('/authenticate')
    //     .send({email: standardUser.email, password: standardUser.password})
    //     .end((err, res) => {
    //       res.body.should.have.property('token');
    //       standardToken = res.body.token;
    //       done();
    //     });
    //
    // });

    // it('standard token should not allow access to users list', (done) => {
    //   chai.request('http://localhost:8080')
    //     .get('/users')
    //     .set('x-access-token', standardToken)
    //     .end((err, res) => {
    //       res.should.have.status(404);
    //       res.body.message.should.be.eql('That which you seek does not exist.');
    //       done();
    //     });
    //
    // });


  // GET token for admin authentication
  // describe('/POST admin authentication', () => {
  //
  //   it('it should return an admin token', (done) => {
  //
  //     chai.request('http://localhost:8080')
  //       .post('/authenticate')
  //       .send({email: adminUser.email, password: adminUser.password})
  //       .end((err, res) => {
  //         res.body.should.have.property('token');
  //         adminToken = res.body.token;
  //         done();
  //       });
  //
  //   });
  //
  //   it('admin token should allow access to users list', (done) => {
  //     chai.request('http://localhost:8080')
  //       .get('/users')
  //       .set('x-access-token', adminToken)
  //       .end((err, res) => {
  //         for (i in res.body) {
  //           if (res.body[i].email == adminUser.email) {
  //             adminUser._id = res.body[i]._id;
  //           }
  //           else {
  //             standardUser._id = res.body[i]._id;
  //           }
  //         }
  //         res.should.have.status(200);
  //         res.body.should.be.a('array');
  //         done();
  //       });
  //
  //   });
  // });

  // DELETE if admin

  // UPDATE if admin

  // GET specific user if you are that user
//   describe('/GET user with userId', () => {
//
//     it('should not return a user without a token', (done) => {
//
//       chai.request('http://localhost:8080')
//         .get('/users/' + standardUser._id)
//         .end((err, res) => {
//           res.should.have.status(403);
//           res.body.message.should.be.eql('This action requires authentication.');
//           done();
//         });
//
//     });
//
//     it('should return a user if you are admin', (done) => {
//
//       chai.request('http://localhost:8080')
//         .get('/users/' + standardUser._id)
//         .set('x-access-token', adminToken)
//         .end((err, res) => {
//           res.should.have.status(200);
//           done();
//         });
//
//     });
//
//     it('should return a user if you are that user', (done) => {
//       chai.request('http://localhost:8080')
//         .get('/users/' + standardUser._id)
//         .set('x-access-token', standardToken)
//         .end((err, res) => {
//           res.should.have.status(200);
//           done();
//         });
//     });
//
//   });
//
// });
