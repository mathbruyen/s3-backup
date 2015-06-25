/* jshint node: true, esnext: true */
'use strict';

var React = require('react');

module.exports = React.createClass({

  getInitialState : function () {
    return this._getState();
  },

  componentDidMount: function() {
    this.props.config.onChange(this._onChange);
  },

  componentWillUnmount: function() {
    this.props.config.offChange(this._onChange);
  },

  _onChange : function (counter) {
    this.replaceState(this._getState());
  },

  _getState : function () {
    return this.props.config.getConfig();
  },

  render : function () {
    var bucketLabel = React.DOM.label(null, 'AWS bucket:');
    var bucketInput = React.DOM.input({ type : 'text', value : this.state.bucket, onChange : this._onBucketChange });
    var bucket = React.DOM.div(null, bucketLabel, bucketInput);

    var idLabel = React.DOM.label(null, 'AWS key id:');
    var idInput = React.DOM.input({ type : 'text', value : this.state.id, onChange : this._onIdChange });
    var id = React.DOM.div(null, idLabel, idInput);

    var secretLabel = React.DOM.label(null, 'AWS key secret:');
    var secretInput = React.DOM.input({ type : 'password', value : this.state.secret, onChange : this._onSecretChange });
    var secret = React.DOM.div(null, secretLabel, secretInput);

    var keyLabel = React.DOM.label(null, 'Encryption key:');
    var keyInput = React.DOM.input({ type : 'password', value : this.state.key, onChange : this._onKeyChange });
    var key = React.DOM.div(null, keyLabel, keyInput);

    var referenceLabel = React.DOM.label(null, 'Git reference:');
    var referenceInput = React.DOM.input({ type : 'text', value : this.state.ref, onChange : this._onRefChange });
    var reference = React.DOM.div(null, referenceLabel, referenceInput);

    return React.DOM.form(null, bucket, id, secret, key, reference);
  },

  _onIdChange : function (event) {
    this.props.dispatch({ action : 'KEY_ID_CHANGED', id : event.target.value });
  },

  _onSecretChange : function (event) {
    this.props.dispatch({ action : 'KEY_SECRET_CHANGED', secret : event.target.value });
  },

  _onBucketChange : function (event) {
    this.props.dispatch({ action : 'BUCKET_CHANGED', bucket : event.target.value });
  },

  _onKeyChange : function (event) {
    this.props.dispatch({ action : 'ENCRYPTION_KEY_CHANGED', key : event.target.value });
  },

  _onRefChange : function (event) {
    this.props.dispatch({ action : 'REFERENCE_CHANGED', ref : event.target.value });
  }
});
