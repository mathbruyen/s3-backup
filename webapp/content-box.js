/* jshint node: true, esnext: true */

var React = require('react');

var CommitBox = require('./commit-box');

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
    return this.props.objects.getCommit();
  },

  render : function () {
    if (this.state.loading) {
      return React.DOM.div(null, 'Loading...');
    }
    return React.createElement(CommitBox, { objects : this.props.objects, commit : this.state.hash });
  }
});
