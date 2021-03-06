import React, { Component } from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router, Route, Switch, Link } from "react-router-dom";
import API from './api.js';
import SignupForm from './SignupForm.js';
import SigninForm from './SigninForm.js';
import UserProfile from './UserProfile.js';

class App extends Component {
    constructor(props) {
        super(props);

        const access_token = window.localStorage.getItem('access_token');

        this.state = {
            access_token,
            currentUser: null,
            user: null,
            signInForm: {
                email: 'bob@example.com',
                password: '321321',
            },
            signUpForm: {
                displayName: 'Bob Ross',
                email: 'bob1@example.com',
                password: '321321',
            },
        };

        this.api = API(access_token);
        }

    componentDidUpdate() {
        const { access_token } = this.state;
        window.localStorage.setItem('access_token', access_token);
    }

    componentDidMount() {
        const { access_token } = this.state;
        this.loadCurrentUser();
    }

    // The following three function handle updating the sign up forms data stored in state
    onNameUpdate(displayName) {
        const { signUpForm } = this.state;

        const updatedForm = Object.assign({}, signUpForm, { displayName });

        this.setState({
            signUpForm: updatedForm,
        });
    }

    onEmailUpdate(form, email) {
        const oldForm = this.state[form];

        const updatedForm = Object.assign({}, oldForm, { email });

        this.setState({
            [form]: updatedForm,
        });
    }

    onPasswordUpdate(form, password) {
        const oldForm = this.state[form];

        const updatedForm = Object.assign({}, oldForm, { password });

        this.setState({
            [form]: updatedForm,
        });
    }

    // Takes user inputted in SignupForm and creates a current user
    onSignUpSubmit() {
        const { signUpForm } = this.state;

        this.api.post({
            endpoint: 'auth/signup',
            body: {
                email: signUpForm.email,
                displayName: signUpForm.displayName,
                password: signUpForm.password,
            },
        })
            .then(({ access_token }) => {
                this.setState({
                    access_token,
                });

                this.setState({
                    currentUser: {
                        displayName: signUpForm.displayName,
                        email: signUpForm.email,
                    },
                    signUpForm: {
                        name: '',
                        email: '',
                        password: '',
                    },
                });

                this.api = API(access_token);

                this.loadCurrentUser();
            })
            .catch(err => console.error(err));
    }

    onSignInSubmit() {
        const {
            signInForm: {
                email,
                password,
            },
        } = this.state;

        this.api.post({
            endpoint: 'auth/login',
            body: {
                email,
                password,
            }
        })
            .then(({ access_token }) => {
                this.setState({
                    access_token,
                });

                this.api = API(access_token);

                this.loadCurrentUser();
            })
            .catch(err => console.error(err));
    }

    loadCurrentUser() {
        this.loadUser({ id: 'me' });
    }

    loadUser({ id }) {
        const userField = id === 'me' ? 'currentUser' : 'user';
        this.setState({
            [userField]: false,
        });
        this.api
            .get({ endpoint: `api/users/${id}` })
            .then(({ _id, email, displayName }) => {
                this.setState({
                    [userField]: {
                        _id,
                        email,
                        displayName,
                    },
                });
            });
    }

    render() {
        const { currentUser, user, signUpForm, signInForm} = this.state
        return (
            <Router>
                <div>
                    <div>
                        <ul>
                            <li><Link to="/app/signin">Sign in</Link></li>
                            <li><Link to="/app/signup">Sign up</Link></li>
                            { 
                                currentUser &&
                                <li><Link to="/app/user/me/profile">{ currentUser.displayName }</Link></li>
                            }
                        </ul>
                    </div>
                    <div>
                        <Route path="/app/signup" render={ () => (
                            <SignupForm
                                state={ signUpForm }
                                onNameUpdate={ this.onNameUpdate.bind(this) }
                                onEmailUpdate={ this.onEmailUpdate.bind(this) }
                                onPasswordUpdate={ this.onPasswordUpdate.bind(this) }
                                onSubmit={ this.onSignUpSubmit.bind(this) }
                                />
                        )} />
                        <Route path="/app/signin" render={ () => (
                            <SigninForm
                                state={ signInForm }
                                onEmailUpdate={ this.onEmailUpdate.bind(this) }
                                onPasswordUpdate={ this.onPasswordUpdate.bind(this) }
                                onSubmit={ this.onSignInSubmit.bind(this) }
                                />
                        )} />
                        <Switch>
                        <Route path="/app/user/me/profile" render={ () => (
                            <UserProfile user={ currentUser } />
                        )} />
                        <Route path="/app/user/:id/profile" render={ ({ match }) => (
                                <UserProfile
                                    user={ currentUser }
                                    match={ match }
                                    loadUser={ this.loadUser.bind(this) }
                                />
                            )} />
                        </Switch>
                    </div>
                </div>
            </Router>
        );
    }
}

const container = document.getElementById('root');

render(
    <App />,
    container
);