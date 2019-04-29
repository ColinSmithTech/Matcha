import React, { Component } from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import { withRouter } from 'react-router';

// Sign in form
class SigninForm extends Component {
    render() {
        const {
            state: {
                email,
                password,
            },
            onEmailUpdate,
            onPasswordUpdate,
            onSubmit,
        } = this.props

        const FORM_NAME = "signInForm"

        return (
        <div>
            <div>
                <h2>I'm sign in form</h2>
            </div>
            <div>
                <input
                    type="email"
                    onChange={ e => onEmailUpdate(FORM_NAME, e.target.value)}
                    value={ email }
                    placeholder="Your email"
                />
            </div>
            <div>
                <input
                    type="password"
                    onChange={ e => onPasswordUpdate(FORM_NAME, e.target.value)}
                    value={ password }
                    placeholder="Your password"
                />
            </div>
            <div>
                <button type="button" onClick={ () => {
                    onSubmit();
                }}>Continue</button>
            </div>
        </div>
        );
    }
}

// Displays the current users information
class UserProfile extends Component {
    render() {
        const { user } = this.props;

        if (user === null) {
            return (
                <div>
                    <h2>Loading...</h2>
                </div>
            );
        }

        return (
            <div>
                <h2>User Profile</h2>
                <span>{ user.displayName }</span>
            </div>
        );
    }
}

// Sign up form
class SignupForm extends Component {
  render() {
      const {
          state: {
              displayName,
              email,
              password,
          },
          onNameUpdate,
          onEmailUpdate,
          onPasswordUpdate,
          onSubmit,
          history,
      } = this.props

      const FORM_NAME = 'signUpForm';

    return (
        <div>
            <h2>Sign up Form</h2>

            <div>
                <input
                    type="text"
                    onChange={ e => onNameUpdate(e.target.value)}
                    value={ displayName }
                    placeholder="Your name"
                    />
            </div>
            <div>
            <input
                    type="email"
                    onChange={ e => onEmailUpdate(FORM_NAME, e.target.value)}
                    value={ email }
                    placeholder="Your email"
                    />
            </div>
            <div>
            <input
                    type="password"
                    onChange={ e => onPasswordUpdate(FORM_NAME, e.target.value)}
                    value={ password }
                    placeholder="Your password"
                    />
            </div>
            <div>
                <button type="button" onClick={ () => {
                    onSubmit();
                    history.push('/app/user/profile');
                }}>Continue</button>
            </div>
        </div>
    );
  }
}
const SignupFormWithRouter = withRouter(SignupForm);

const API = access_token => {
    const baseApiUrl = 'http://localhost:3000';
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
        },
    };

    return {
        get({ endpoint, options = {} }) {
            return fetch(
                `${baseApiUrl}/${endpoint}`,
                Object.assign({}, defaultOptions, options)
            ).then(data => data.json());
        },
        post({ endpoint, options = {}, body = '' }) {
            return fetch(
                `${baseApiUrl}/${endpoint}`,
                Object.assign({
                    method: 'POST',
                    body: JSON.stringify(body),
                }, defaultOptions, options)
            ).then(data => data.json());
        },
    };
};

class App extends Component {
    constructor(props) {
        super(props);

        const access_token = window.localStorage.getItem('access_token');

        this.state = {
            access_token,
            currentUser: null,
            signInForm: {
                email: 'bob@example.com',
                password: '321321',
            },
            signUpForm: {
                displayName: '',
                email: '',
                password: '',
            },
        };

        this.api = API(access_token);
    }

    componentDidUpdate() {
        const { access_token } = this.state;
        window.localStorage.setItem('access_token', access_token);

        this.api = API(access_token);
    }

    componentDidMount() {
        const { access_token } = this.state;
        this.loadCurrentUser();
    }

    // The following three function handle updating the sign up forms data stored in state
    onNameUpdate(name) {
        const { signUpForm, signInForm } = this.state;

        const updatedForm = Object.assign({}, signUpForm, { name });

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

        this.setState({
            // Stores information from current signup form to create a current user
            currentUser: {
                displayName: signUpForm.name,
                email: signUpForm.email,
            },
            // Resets valuesin signUpForm
            signUpForm: {
                name: '',
                email: '',
                password: '',
            },
        });
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
        .then (( { access_token }) => {
            console.log(access_token);
            this.setState({
                access_token,
            });
            this.loadCurrentUser();
        })
        .catch (err => console.error(err));
    }

    loadCurrentUser() {
        this.api.get({ endpoint: 'api/users/me' })
        .then(({email, displayName}) => {
           this.setState({
               currentUser: {
                    email,
                    displayName,
               },
           });
        });
    }

    render() {
        const { currentUser, signUpForm, signInForm} = this.state
        return (
            <Router>
                <div>
                    <ul>
                        <li><Link to="/app/signin">Sign in</Link></li>
                        <li><Link to="/app/signup">Sign up</Link></li>
                        { 
                            currentUser &&
                            <li><Link to="/app/user/profile">{ currentUser.displayName }</Link></li>
                        }
                    </ul>
                </div>
                <div>
                    <Route path="/app/signup" render={ () => (
                        <SignupFormWithRouter
                            state = { signUpForm }
                            onNameUpdate = { this.onNameUpdate.bind(this) }
                            onEmailUpdate = { this.onEmailUpdate.bind(this) }
                            onPasswordUpdate = { this.onPasswordUpdate.bind(this) }
                            onSubmit = { this.onSignUpSubmit.bind(this) }
                            /> 
                    )} />
                    <Route path="/app/signin" render={ SigninForm } render={ () => (
                        <SigninForm
                            state = { signInForm }
                            onEmailUpdate = { this.onEmailUpdate.bind(this) }
                            onPasswordUpdate = { this.onPasswordUpdate.bind(this) }
                            onSubmit = { this.onSignInSubmit.bind(this) }
                        /> 
                    )} />
                    <Route path="/app/user/profile" render={ () => (
                        <UserProfile user={ currentUser } />
                    )} />
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