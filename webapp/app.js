/* jshint node: true, browser: true, esnext: true */
'use strict';

var React = require('react');

var dispatcher = require('./dispatcher')();

var config = require('./config-store')(dispatcher.subscribe, window.localStorage);
var objects = require('./object-store')(dispatcher.subscribe);
var display = require('./displayed-tree-store')(dispatcher.subscribe);

var objectActions = require('./object-actions')(dispatcher.dispatch);

var ConfigBox = require('./config-box');
var ContentBox = require('./content-box');

React.render(React.DOM.div(
  null,
  React.createElement(ConfigBox, { dispatch : dispatcher.dispatch, config }),// TODO give dispatch using initialization
  React.createElement(ContentBox, { dispatch : dispatcher.dispatch, config, objects, display, objectActions })// TODO give actions and dispatch using initialization
), document.body);
