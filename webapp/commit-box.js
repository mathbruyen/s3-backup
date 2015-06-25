/* jshint node: true, esnext: true */
'use strict';

var React = require('react');

var TreeBox = require('./tree-box');

module.exports = React.createClass({

  getInitialState : function () {
    return this._getState();
  },

  componentDidMount: function() {
    this.props.objects.onChange(this._onChange);
  },

  componentWillUnmount: function() {
    this.props.objects.offChange(this._onChange);
  },

  _onChange : function (counter) {
    this.replaceState(this._getState());
  },

  _getState : function () {
    var commit = this.props.objects.getObject(this.props.commit);
    if (!commit) {
      this.props.objectActions.requestObject(this.props.config.getStore(), 'commit', this.props.commit);
    }
    return { commit };
  },

  render : function () {
    if (!this.state.commit || this.state.commit.loading) {
      return React.DOM.div(null, 'Loading...');
    }
    return React.createElement(TreeBox, {
      objects : this.props.objects,
      config : this.props.config,
      objectActions : this.props.objectActions,
      display : this.props.display,
      dispatch : this.props.dispatch,
      tree : this.state.commit.body.tree,
      path : ''
    });
  }
});
