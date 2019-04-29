import React, { Component } from 'react';

// Displays the current users information
class UserProfile extends Component {
    render() {
        const { user, match, loadUser } = this.props;

        if (user === null) {
            if (match && match.params.id) {
                loadUser({ id: match.params.id });
            }
        }

        if (user === null || user === false) {
            return (
                <div>
                    <h2>Loading...</h2>
                </div>
            );
        }

        return (
            <div>
                <h2>User Profile</h2>
                <span>Hi { user.displayName }</span>
            </div>
        );
    }
}

export default UserProfile;