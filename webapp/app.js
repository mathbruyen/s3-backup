/* jshint node: true, browser: true, esnext: true */
'use strict';

var React = require('react');

var dispatcher = require('./dispatcher')();
var objects = require('./object-store')(dispatcher, window.localStorage);
var display = require('./displayed-tree-store')(dispatcher);

var ConfigBox = require('./config-box');
var ContentBox = require('./content-box');

React.render(React.DOM.div(
  null,
  React.createElement(ConfigBox, { dispatch : dispatcher.dispatch, objects }),
  React.createElement(ContentBox, { dispatch : dispatcher.dispatch, objects, display })
), document.body);
