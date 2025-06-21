const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const GitHubStrategy = require('passport-github2').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  const newUser = {
    googleId: profile.id,
    displayName: profile.displayName,
    email: profile.emails[0].value,
    image: profile.photos[0].value,
  };

  try {
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      done(null, user);
    } else {
      user = await User.create(newUser);
      done(null, user);
    }
  } catch (err) {
    console.error(err);
    done(err, null);
  }
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/api/auth/github/callback',
  scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });

    if (!user) {
      user = await User.create({
        name: profile.displayName || profile.username,
        email: profile.emails[0].value,
        password: Math.random().toString(36).slice(-8), // dummy password
        githubId: profile.id
      });
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => done(err, user));
});