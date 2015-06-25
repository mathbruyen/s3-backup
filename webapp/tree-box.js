/* jshint node: true, esnext: true */
'use strict';

var React = require('react');
var modes = require('js-git/lib/modes');

var BlobBox = require('./blob-box');

var TreeBox = React.createClass({

  getInitialState : function () {
    return this._getState();
  },

  componentDidMount: function() {
    this.props.objects.onChange(this._onChange);
    this.props.display.onChange(this._onChange);
  },

  componentWillUnmount: function() {
    this.props.objects.offChange(this._onChange);
    this.props.display.offChange(this._onChange);
  },

  _onChange : function (counter) {
    // TODO triggers a warning when hiding a tree because replaceState is called even though component is unmounted
    this.replaceState(this._getState());
  },

  _getState : function () {
    var tree = this.props.objects.getObject(this.props.tree);
    if (!tree) {
      this.props.objectActions.requestObject(this.props.config.getStore(), 'tree', this.props.tree);
    }
    return { tree, details : this.props.display.getDisplayedChildren(this.props.path) };
  },

  render : function () {
    if (!this.state.tree || this.state.tree.loading) {
      return React.DOM.div(null, 'Loading...');
    }
    return React.DOM.ul(null, Object.keys(this.state.tree.body).map(child => {
      var item = this.state.tree.body[child];
      if (this.state.details.indexOf(child) >= 0) {
        var elem;
        if (item.mode === modes.file) {
          elem = React.createElement(BlobBox, { blob : item.hash });
        } else if (item.mode === modes.tree) {
          elem = React.createElement(TreeBox, {
            objects : this.props.objects,
            config : this.props.config,
            objectActions : this.props.objectActions,
            display : this.props.display,
            dispatch : this.props.dispatch,
            tree : item.hash,
            path : this.props.path + '/' + child
          });
        } else {
          throw new Error('Invalid mode: ' + item.mode);
        }
        return React.DOM.li({ key : child }, React.DOM.span({ onClick : this._hideChildren.bind(this, child) }, '- ' + child), elem);
      } else {
        return React.DOM.li({ key : child, onClick : this._displayChildren.bind(this, child) }, '+ ' + child);
      }
    }));
  },

  _displayChildren : function (child) {
    this.props.dispatch({ action : 'PATH_DISPLAYED', path : this.props.path, child });
  },

  _hideChildren : function (child) {
    this.props.dispatch({ action : 'PATH_HIDDEN', path : this.props.path, child });
  }
});

module.exports = TreeBox;
