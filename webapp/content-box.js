/* jshint node: true, esnext: true */

var React = require('react');

var CommitBox = require('./commit-box');

module.exports = React.createClass({

  getInitialState : function () {
    this.props.objects.onChange(this._onChange, this);
    return this._getState();
  },

  _onChange : function (counter) {
    this.replaceState(this._getState());
  },

  _getState : function () {
    return this.props.objects.getCommit();
  },

  render : function () {
    if (this.state.loading) {
      return React.DOM.div(null, 'Loading...');
    }
    return React.createElement(CommitBox, { objects : this.props.objects, commit : this.state.hash });
  }
});
