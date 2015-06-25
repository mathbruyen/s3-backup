/* jshint node: true, esnext: true */

var React = require('react');

var TreeBox = require('./tree-box');

module.exports = React.createClass({

  getInitialState : function () {
    return this._getState();
  },

  componentDidMount: function() {
    this.props.objects.onChange(this._onChange);
    if (!this.state.commit) {
      this.props.objectActions.requestObject(this.props.objects.getStore(), 'commit', this.props.commit);
    }
  },

  componentWillUnmount: function() {
    this.props.objects.offChange(this._onChange);
  },

  _onChange : function (counter) {
    this.replaceState(this._getState());
  },

  _getState : function () {
    return { commit : this.props.objects.getObject(this.props.commit) };
  },

  render : function () {
    if (!this.state.commit || this.state.commit.loading) {
      return React.DOM.div(null, 'Loading...');
    }
    return React.createElement(TreeBox, {
      objects : this.props.objects,
      objectActions : this.props.objectActions,
      display : this.props.display,
      dispatch : this.props.dispatch,
      tree : this.state.commit.body.tree,
      path : ''
    });
  }
});
