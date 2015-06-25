/* jshint node: true, esnext: true */
'use strict';

var React = require('react');

module.exports = React.createClass({

  render : function () {
    return React.DOM.div(null, this.props.blob);
  }
});
