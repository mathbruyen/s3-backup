/* jshint node: true, esnext: true */

var React = require('react');

var CommitBox = require('./commit-box');

module.exports = React.createClass({

  getInitialState : function () {
    return this._getState();
  },

  componentDidMount: function() {
    this.props.objects.onChange(this._onChange);
    if (!this.state.commit) {
      this.props.objectActions.requestReference(this.props.objects.getStore(), this.props.objects.getConfig().ref);
    }
  },

  componentWillUnmount: function() {
    this.props.objects.offChange(this._onChange);
  },

  _onChange : function (counter) {
    this.replaceState(this._getState());
  },

  _getState : function () {
    return { commit : this.props.objects.getCommit() };
  },

  render : function () {
    if (!this.state.commit || this.state.commit.loading) {
      return React.DOM.div(null, 'Loading...');
    }
    return React.createElement(CommitBox, {
      objects : this.props.objects,
      objectActions : this.props.objectActions,
      display : this.props.display,
      dispatch : this.props.dispatch,
      commit : this.state.commit.hash
    });
  }
});
