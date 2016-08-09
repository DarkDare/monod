import React from 'react';
import ReactDOM from 'react-dom';
import { EventEmitter } from 'events';
import localforage from 'localforage';

import './scss/main.scss';

import App from './components/App.jsx';
import Store from './Store';
import Controller from './Controller';

const appElement = document.getElementById('app');
const appVersion = appElement.getAttribute('data-app-version');
const apiEndpoint = appElement.getAttribute('data-api-endpoint');

const events = new EventEmitter();
const store = new Store('documents', events, apiEndpoint, localforage);
const controller = new Controller({ store }, events);

require('offline-plugin/runtime').install();

ReactDOM.render(<App version={appVersion} controller={controller} />, appElement);
