import React from 'react';
import firebase from 'firebase/app';

const UI_CONFIG = {
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // User successfully signed in.
        // Return type determines whether we continue the redirect automatically
        // or whether we leave that to developer to handle.
        return true;
      },
      uiShown: function() {
        // The widget is rendered.
        // Hide the loader.
        document.getElementById('loader').style.display = 'none';
      }
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    signInSuccessUrl: '/?admin',
    signInOptions: [
      // List of OAuth providers supported.
      firebase.auth.GoogleAuthProvider.PROVIDER_ID
    ],
    // Other config options...
};

class Admin extends React.Component {
    constructor() {
        super();
        this.state = { user: null, loading: true };
    }
    componentDidMount() {
        firebase.auth().onAuthStateChanged((user) => {
            this.setState({ loading: false });
            if (user) {
                this.setState({ user });
                this.props.db.collection('tasks').get().then(snapshot => {
                    const tasks = [];
                    snapshot.forEach(task => tasks.push(Object.assign({taskId: task.id}, task.data())));
                    this.setState({ tasks });
                });
            } else {
                this.setState({ user: null });
                this.props.ui.start('#firebaseui-auth-container', UI_CONFIG);
            }
        });
    }
    onUpdateTask = (e, task) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        for (const pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }
        console.log(task.description);
    }
    render() {
        if (this.state.loading) {
            return (
              <div className="admin-container">
                  loading
              </div>
            );
        }
        if (!this.state.user) {
            return (
              <div className="admin-container">
                  <div id="firebaseui-auth-container"></div>
                  <div id="loader">Loading...</div>
              </div>
            );
        }
        return (
          <div className="admin-container">
              {this.state.tasks && this.state.tasks.map(task => (
                <form key={task.taskId} onSubmit={(e) => this.onUpdateTask(e, task)}>
                    <div>ID: {task.taskId}</div>
                    <div>Description:
                        <input name="desc" defaultValue={task.description}/>
                    </div>
                    <div>Spawns on done:
                    </div>
                    <div>Spawns on age:
                    </div>
                    <button>update</button>
                </form>
              ))}
          </div>
        );
        
    }
}

export default Admin;