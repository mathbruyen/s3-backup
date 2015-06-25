/* jshint node: true, esnext: true */
'use strict';

var React = require('react');

var CommitBox = require('./commit-box');

module.exports = React.createClass({

  getInitialState : function () {
    return this._getState();
  },

  componentDidMount: function() {
    this.props.objects.onChange(this._onChange);
    this.props.config.onChange(this._onChange);
  },

  componentWillUnmount: function() {
    this.props.objects.offChange(this._onChange);
    this.props.config.offChange(this._onChange);
  },

  _onChange : function (counter) {
    this.replaceState(this._getState());
  },

  _getState : function () {
    var ref = this.props.config.getReference();
    var commit;
    if (ref) {
      commit = this.props.objects.getRef(ref);
      if (!commit) {
        this.props.objectActions.requestReference(this.props.config.getStore(), ref);
      }
    }
    return { commit };
  },

  render : function () {
    if (!this.state.commit || this.state.commit.loading) {
      return React.DOM.div(null, 'Loading...');
    }
    return React.createElement(CommitBox, {
      objects : this.props.objects,
      config : this.props.config,
      objectActions : this.props.objectActions,
      display : this.props.display,
      dispatch : this.props.dispatch,
      commit : this.state.commit.hash
    });
  }
});
