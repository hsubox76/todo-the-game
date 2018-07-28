import './styles/index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import firebase from 'firebase/app';
import * as firebaseui from 'firebaseui';
import 'firebase/firestore';
import 'firebaseui/dist/firebaseui.css';

import Main from './components/Main';

import Admin from './components/admin/Admin';

// Initialize Cloud Firestore through Firebase

firebase.initializeApp({
    apiKey: "AIzaSyDtmd6-QAqHuh1ZGQrEQb8crE97o8igQgc",
    authDomain: "todo-the-game.firebaseapp.com",
    projectId: "todo-the-game",
});

const firestore = firebase.firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true};
firestore.settings(settings);

// Initialize the FirebaseUI Widget using Firebase.
const ui = new firebaseui.auth.AuthUI(firebase.auth());

if (window.location.search.includes('admin')) {
    ReactDOM.render(<Admin db={firestore} ui={ui}/>, document.getElementById('root'));
} else {
    ReactDOM.render(<Main db={firestore} ui={ui}/>, document.getElementById('root'));
}

