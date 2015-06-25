/* jshint node: true, esnext: true */
'use strict';

var React = require('react');

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
    return { hash : this.props.blob };// this.props.objects.getObject('blob', this.props.blob);
  },

  render : function () {
    if (this.state.loading) {
      return React.DOM.div(null, 'Loading...');
    }
    return React.DOM.div(null, this.state.hash);
  }
});
