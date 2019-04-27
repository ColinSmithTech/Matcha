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

        return (
            <div>
                <h2>User Profile</h2>
                <span>{ user.name }</span>
            </div>
        );
    }
}

// Sign up form
class SignupForm extends Component {
  render() {
      const {
          state: {
              name,
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
                    value={ name }
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

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            currentUser: null,
            signUpForm: {
                name: '',
                email: '',
                password: '',
            },
            signInForm: {
                email: 'bob@example.com',
                password: '321321',
            },
        };
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
                name: signUpForm.name,
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

        fetch(
            'localhost:4000/auth/login',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            },
        )
            .then(data => data.json())
            .then (( { access_token }) => {
                console.log(access_token);
            })
            .catch (err => console.error(err));
    }

    render() {
        const { currentUser, signUpForm, signInForm} = this.state
        return (
            <Router>
                <div>
                    <ul>
                        <li><Link to="/app/signin">Sign in</Link></li>
                        <li><Link to="/app/signup">Sign up</Link></li>
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