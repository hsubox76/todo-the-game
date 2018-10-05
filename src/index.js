import './styles/index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import firebase from 'firebase/app';
import * as firebaseui from 'firebaseui';
import 'firebase/firestore';
import 'firebaseui/dist/firebaseui.css';
import { getQueryParams } from './utils';

import Main from './components/Main';

import Admin from './components/admin/Admin';

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

if (params.hasOwnProperty('admin')) {
    ReactDOM.render(
        <Admin db={firestore} ui={ui} />,
        document.getElementById('root')
    );
} else {
    ReactDOM.render(
        <Main db={firestore} ui={ui} />,
        document.getElementById('root')
    );
}

