const express =  require('express');
const app = express();

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');
const createHash = crypto.createHash;
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const compose = require('composable-middleware');
const SECRET = 'Marvin42';

app.use(bodyParser.json());
app.use(passport.initialize());
mongoose.connect('mongodb+srv://test:123@matcha-vgfcr.mongodb.net/test?retryWrites=true', {useNewUrlParser: true});

const UserSchema = new Schema({
    email: String,
    displayName: String,
    hashedPassword: String,
    salt: String,
});

UserSchema
    .virtual('password')
    .set(function(password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function() {
        return this._password;
    });

UserSchema.methods = {
    makeSalt: function() {
        return crypto.randomBytes(16),toString('base64');
    },

    authenticate: function(plainText) {
        return this.encryptPassword(plainText) == this.hashedPassword;
    },

    encryptPassword: function(password) {
        if (!password || !this.salt) return '';
        var salt = new Buffer(this.salt, 'base64');
        return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('base64');
    }
};

const User = mongoose.model('User', UserSchema);

const seed = () => {
    User.find({  }).remove().then(() => {
        const users = [{
            email: 'alice@example.com',
            displayName: 'Alice',
            password: '123123'
        }, {
            email: 'bob@example.com',
            displayName: 'Bob',
            password: '321321',
        }];

        User.create(users, (err, users_) => {
            console.log(`MONGODB SEED:  ${users_.length} Users created.`);
        });
    });
};

app.get('/', function(req, res) {
    User.find({}, (err, users) => {
        res.json(users);
    });
});

const sendUnathorized = (req, res) => {
    res.status(401).json({ message: 'Unathorized'});
};

const validateJwt = expressJwt({
    secret: SECRET,
    fail: sendUnathorized,
});

function isAuthenticated(req, res, next) {
    return compose()
    .use((req, res, next) => {
        validateJwt(req, res, next);
    })
    .use((req, res, next) => {
        const { email } = req.user;
        User.findOne({ email }, function(err, user) {
            if (err) return next(err);
            if (!user) return sendUnathorized(req, res);
            req.user = user;
            next();
        });
    });
};

app.get('/protected', isAuthenticated(), function(req, res) {
    res.send('Authenticated');
});

passport.serializeUser(function(user, done) {
    done(null, user.email);
  });
  
passport.deserializeUser(function(email, done) {
    User.findOne({ email }, function(err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy({
    usernameField: 'email',
    session: false
    },
    function(email, password, done) {
        User.findOne({ email }, function(err, user) {
            if (err) {
                console.log('Auth error ' + err);
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
    }
    ));

app.use((req, res, next) => {
    const header = req.headers.authorization;

    // Authorization: bearer [token]
    if (header) {
        const splitHeader = header.split(' ');

        if (splitHeader.length !== 2 && splitHeader[0] !== 'Bearer') {
            next();
        } else {
            const decoded = jwt.decode(splitHeader[1]);
            console.log(decoded);

        /*        (err, data) => {
                if (err) {
                    next(err);
                } else {
                    User.findOne({ email }), ((err, user) => {
                        req.user = user;
                        next();
                    });
                }
            });*/
        }
    } else {
        next();
    }
});

app.post('/auth/login', (req, res, next) => {
      passport.authenticate('local', (err, user) => {
          const access_token = jwt.sign({
              id: user._id,
              email: user.email,
          }, SECRET, {
              expiresIn: 60 * 60,
          });
          res.json({
              access_token,
          });
      })(req, res, next);
    });

//seed();

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

app.listen(3000);