'use strict';

var config = require('../config/app');
var vars = require('../config/vars');
var error = require('../config/errors');
var db = require('../db');

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var auth = {};

// whitelist public routes
var publicApiPaths = ['auth', 'stats', 'report']

// login function
auth.login = function(user, formPassword, aad) {
  return new Promise((resolve, reject) => {
    if(aad || bcrypt.compareSync(formPassword, user.password)) {
      delete user.password
      var token = jwt.sign({info:user}, config.secret, {
        expiresIn: 33440
      });
      resolve(token);
    } else {
      reject(error.auth.log.wrong);
    }
  })
}

auth.preauthorize = function(user) {
  // let salt, hash;
  return new Promise((resolve, reject) => {
    let token = jwt.sign({info:user}, config.secret, {
      expiresIn: 33440
    });
    resolve(token);
  })
}

auth.clean = function(user) {
  var blacklist = ['password'];
  blacklist.forEach(prop => {
    if(user[prop]) delete user[prop];
  })
  return user;
}

auth.update = function(user, password, body) {
  let salt, hash;

  return new Promise((resolve, reject) => {
    if(body.authType === 'attributes') {
      let token = jwt.sign({info:user}, config.secret, {
        expiresIn: 33440
      });
      resolve(body, token);
    }
    else if(bcrypt.compareSync(body.currentPassword, password)) {
      if(body.authType === 'email'){
        user.email = body.email;
        user.token = jwt.sign({info:user}, config.secret, {
          expiresIn: 33440
        });
        resolve(body);
      } else if(body.authType === 'password'){
        // if(auth.validate('password', body.newPassword)){
        if(true){
          salt = bcrypt.genSaltSync(vars.bcrypt.salt);
          hash = bcrypt.hashSync(body.newPassword, salt);
          body.password = hash;
          resolve(body)
        } else {
          reject(error.auth.invalid.password);
        }
      } else {
        reject(error.auth.unable);
      }
    } else {
      reject(error.auth.change);
    }
  })
}

// Authenticate Requestspppppppp[]
auth.authenticateRequests = function(req, res, next){
  // log requests
  console.log('REQUEST PATH: ', req.originalUrl, ' | IP: ', req.ip, ' | DATE:', new Date());

  // Check for auth token on other api requests
  var token = req.headers.token
  if (token) {
    jwt.verify(token, config.secret, function(err, obj) {
      if (err) {
        res.status(403).send('Your session has expired, please login');
      }
      else {
        req.user = obj.info;
        if(req.user.blocked) {
          return res.status(204).send([])
        }
        else {
          return next();
        }
      };
    });
  } else {
    // Catchall route for non-api routes
    if (req.originalUrl.split('/')[1] != 'api'){
      res.sendFile(`${__dirname.replace(/(src|dist)/, 'public')}/index.html`.replace('lib/', ''));
    // Allow public api requests
  } else if (publicApiPaths.includes(req.originalUrl.split('/')[2])) {
      if([ 'stats', 'report' ].includes( req.originalUrl.split('/')[2] )) {
        return next();
      }
      else if(req.body.authType === 'login' || req.body.authType === 'aad' || req.body.authType === 'selfservice') {
        return next();
      }
      else {
        res.status(403).send({ error: error.auth.log.token });
      }
    }
    else if (req.user) {
      if(req.user.blocked) {
        return res.status(204).send([])
      }
      return next();
    }
    else {
      res.status(403).send({ error: error.auth.log.token });
    }
  }
};

auth.validate = function(type, string){
  if(type==='password')
  return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{8,15}$/.test(string);
}

module.exports = auth;
