const express = require('express');
const app = express();
const http = require('http').Server(app);
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const mongoose = require('mongoose');
const dbUri = 'mongodb+srv://test:123@matcha-vgfcr.mongodb.net/test?retryWrites=true';
const dbOptions = {
    promiseLibrary: require('bluebird'),
};
const db = mongoose.createConnection(dbUri, dbOptions);

const User = require('./models/user')(db);

// -------------------------
// Seed
const seed = () => {
    const users = [{
        email: 'alice@example.com',
        displayName: 'Alice',
        password: '123123',
    }, {
        email: 'bob@example.com',
        displayName: 'Bob',
        password: '321321',
    }];

    User.create(users, (err, users_) => {
        console.log(`MONGODB SEED: ${users_.length} Users created.`);
    });
};

db.on('open', () => {
    seed();
});
// -------------------------

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const auth = require('./auth.js');

app.use(passport.initialize());

passport.use(
    new LocalStrategy({
        usernameField: 'email'
    },
    function(email, password, done) {
        User.findOne({ email }, function(err, user) {
            console.log('User is: ', user);
            if (err) {
                console.error('Auth error: ' + err);
                return done(err);
            }
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            if (!user.authenticate(password)) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        });
    })
);

app.post('/auth/login',
     passport.authenticate('local', { session: false }),
     ({ user }, res) => {
         const access_token = auth.sign(user);
         res.json({ access_token });
     }
);

app.post('/auth/signup', (req, res) => {
    const user = req.body;

    /*
     * 1. Find a user with given email
     * 2. If there are none = we create
     * 3. Otherwise we send an error message
     */
    console.log(user);

    User.find({ email: user.email }).then(users => {
        if (users.length === 0) {
            // Create a new user.
            // Send an auth token to the user;
            User.create(user).then(user_ => {
                 const access_token = auth.sign(user_);
                 res.json({ access_token });
            });
        } else {
            res.json({
                status: 'Error',
                message: 'User with such email is already registered',
            });
        }
    });

});

const isAuthenticated = auth.isAuthenticated(User);

// -------------------------
// Basic routes
app.get('/', function(req, res) {
    User.find({}, (err, users) => {
        res.json(users);
    });
});

app.use('/api', require('./api')(db, isAuthenticated));

// -------------------------

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
        'error': {
            message: err.message,
            error: err
        }
    });
    next();
});

http.listen(3000);
