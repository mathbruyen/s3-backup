/* jshint node: true, esnext: true */

var React = require('react');

var TreeBox = require('./tree-box');

module.exports = React.createClass({

  getInitialState : function () {
    return this._getState();
  },

  componentDidMount: function() {
    this.props.objects.onChange(this._onChange, this);
  },

  componentWillUnmount: function() {
    this.props.objects.offChange(this._onChange, this);
  },

  _onChange : function (counter) {
    this.replaceState(this._getState());
  },

  _getState : function () {
    return this.props.objects.getObject('commit', this.props.commit);
  },

  render : function () {
    if (this.state.loading) {
      return React.DOM.div(null, 'Loading...');
    }
    return React.createElement(TreeBox, { objects : this.props.objects, tree : this.state.body.tree });
  }
});
