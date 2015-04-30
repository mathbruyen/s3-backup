/* jshint node: true, browser: true, esnext: true */
'use strict';

var React = require('react');

var dispatcher = require('./dispatcher')();
var objects = require('./object-store')(dispatcher, window.localStorage);

var ConfigBox = require('./config-box');

React.render(React.createElement(ConfigBox, { dispatch : dispatcher.dispatch, objects }), document.body);
