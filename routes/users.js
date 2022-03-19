const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../Utils/catchAsync');
const User = require('../models/user');


router.get('/signup', (req, res) => {
    res.render('users/signup');
})

router.post('/signup', catchAsync(async(req, res, next) => {
    try{
    const {email, username, password} = req.body;
    const user = new User({ email, username});
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, err => {
        if(err) return next(err)
        req.flash( 'success', 'Welcome to WebLog!');
        res.redirect('/blogs');
      })
    } catch(e) {
        req.flash('error', e.message);
        res.redirect('/signup');
    }
}));

router.get('/login', (req,res) => {
     res.render('users/login');
})

router.post('/login',passport.authenticate('local', { failureFlash: true, failureRedirect: '/login'}), (req,res) => {
     req.flash('success', 'Welcome back!');
     const redirectUrl = req.session.returnTo || '/blogs';
     delete req.session.returnTo;
     res.redirect(redirectUrl);
})

router.get('/logout', (req,res) => {
    req.logout();
    req.flash('success', 'Goodbye!');
    res.redirect('/blogs');
})

module.exports = router;