import './styles/index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import firebase from 'firebase/app';
import * as firebaseui from 'firebaseui';
import 'firebase/firestore';
import 'firebaseui/dist/firebaseui.css';
import { getQueryParams } from './utils';

import App from './components/App';

// Initialize Cloud Firestore through Firebase
const projectId = process.env.REACT_APP_TDG_PROJECT_ID;

firebase.initializeApp({
    apiKey: process.env.REACT_APP_TDG_API_KEY,
    authDomain: projectId + ".firebaseapp.com",
    projectId
});

const firestore = firebase.firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true};
firestore.settings(settings);

// Initialize the FirebaseUI Widget using Firebase.
const ui = new firebaseui.auth.AuthUI(firebase.auth());

const params = getQueryParams();

ReactDOM.render(
    <App db={firestore} ui={ui} admin={params.hasOwnProperty('admin')} />,
    document.getElementById('root')
);

