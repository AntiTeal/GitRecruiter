let express = require('express');
let router = express.Router();
let userModel = require('../models/users.js');
let bcrypt = require('bcryptjs');
let db = require('../models/index.js');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('user-register');
});

router.post('/register', function(req, res, next) {
  let email = req.body.email;
  let password = req.body.password;
  let confirmPassword = req.body.confirm_password;

  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('confirm_password', 'Passwords do not match').equals(req.body.password);
  req.checkBody('password', 'Password must be at least 7 characters').isLength({
    min: 7
  });
  req.checkBody('password', 'Password must contain at least 1 number').matches(/\d/);
  req.checkBody('password', 'Password must contain characters').matches(/[a-zA-z]/);

  let errors = req.validationErrors();

  db['users'].findOne({
    where: {
      email: email
    }
  }).then(user => {
    if (user != null) {
      if (!errors) 
        errors = [];
      
      errors.push({
        param: 'email',
        msg: 'Email is already registered',
        value: email
      });
    }

    if (errors) {
      res.render('user-register', {
        errors: errors,
      });
    } 
    else {
      bcrypt.hash(password, 10, function(err, hash) {
        db['users'].create({
          email: email,
          password: hash,
        });
      });
      req.flash('success_msg', 'You are registered and can now login');
      res.redirect('/users/login');
    }
  });
});

router.post('/login', function(req, res, next) {
  let email = req.body.email;
  let password = req.body.password;

  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();

  let errors = req.validationErrors();

  db['users'].findOne({
    where: {
      email: email
    }
  }).then(user => {
    if (user == null) {
      if (!errors) 
        errors = [];
      
      errors.push({
        param: 'email',
        msg: 'No user with that email exists',
        value: email
      });
    }

    if(errors) {
      res.render('user-login', {
          errors: errors,
      });
    }
    else {
      bcrypt.compare(password, user.password, function(err, correct) {
        if(err) {
          req.flash('error_msg', err);
          res.redirect('/users/login');
        }
        else if(correct) {
          req.flash('success_msg', 'You are now logged in');
          res.redirect('/');
        }
        else {
          req.flash('error_msg', 'Incorrect password');
          res.redirect('/users/login');
        }
      });
    }
  });
});

router.get('/login', function(req, res, next) {
  res.render('user-login');
});

module.exports = router;