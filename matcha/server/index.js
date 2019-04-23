const express =  require('express');
const app = express();

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');
const createHash = crypto.createHash;

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

seed();

app.listen(3000);