/* jshint node: true, esnext: true */

var React = require('react');
var modes = require('js-git/lib/modes');

var BlobBox = require('./blob-box');

var TreeBox = React.createClass({

  getInitialState : function () {
    this.props.objects.onChange(this._onChange, this);
    return this._getState();
  },

  _onChange : function (counter) {
    this.replaceState(this._getState());
  },

  _getState : function () {
    return this.props.objects.getObject('tree', this.props.tree);
  },

  render : function () {
    if (this.state.loading) {
      return React.DOM.div(null, 'Loading...');
    }
    return React.DOM.ul(null, Object.keys(this.state.body).map(file => {
      var item = this.state.body[file];
      var elem;
      if (item.mode === modes.file) {
        elem = React.createElement(BlobBox, { objects : this.props.objects, blob : item.hash });
      } else if (item.mode === modes.tree) {
        elem = React.createElement(TreeBox, { objects : this.props.objects, tree : item.hash });
      } else {
        throw new Exception('Invalid mode: ' + item.mode);
      }
      return React.DOM.li({ key : file }, file, elem);
    }));
  }
});

module.exports = TreeBox;
