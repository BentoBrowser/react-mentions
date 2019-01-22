var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { defaultStyle } from 'substyle';
import omit from 'lodash/omit';
import keys from 'lodash/keys';

var Suggestion = function (_Component) {
  _inherits(Suggestion, _Component);

  function Suggestion() {
    _classCallCheck(this, Suggestion);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  Suggestion.prototype.render = function render() {
    var rest = omit(this.props, 'style', keys(Suggestion.propTypes));

    return React.createElement(
      'li',
      _extends({}, rest, this.props.style),
      this.renderContent()
    );
  };

  Suggestion.prototype.renderContent = function renderContent() {
    var _props = this.props,
        query = _props.query,
        descriptor = _props.descriptor,
        suggestion = _props.suggestion,
        index = _props.index,
        focused = _props.focused;


    var display = this.getDisplay();
    var highlightedDisplay = this.renderHighlightedDisplay(display, query);

    if (descriptor.props.renderSuggestion) {
      return descriptor.props.renderSuggestion(suggestion, query, highlightedDisplay, index, focused);
    }

    return highlightedDisplay;
  };

  Suggestion.prototype.getDisplay = function getDisplay() {
    var suggestion = this.props.suggestion;


    if (suggestion instanceof String) {
      return suggestion;
    }

    var id = suggestion.id,
        display = suggestion.display;


    if (!id || !display) {
      return id;
    }

    return display;
  };

  Suggestion.prototype.renderHighlightedDisplay = function renderHighlightedDisplay(display) {
    var _props2 = this.props,
        query = _props2.query,
        style = _props2.style;


    var i = display.toLowerCase().indexOf(query.toLowerCase());

    if (i === -1) {
      return React.createElement(
        'span',
        style('display'),
        display
      );
    }

    return React.createElement(
      'span',
      style('display'),
      display.substring(0, i),
      React.createElement(
        'b',
        style('highlight'),
        display.substring(i, i + query.length)
      ),
      display.substring(i + query.length)
    );
  };

  return Suggestion;
}(Component);

Suggestion.propTypes = process.env.NODE_ENV !== "production" ? {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  query: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,

  suggestion: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    display: PropTypes.string
  })]).isRequired,
  descriptor: PropTypes.object.isRequired,

  focused: PropTypes.bool
} : {};


var styled = defaultStyle({
  cursor: 'pointer'
}, function (props) {
  return { '&focused': props.focused };
});

export default styled(Suggestion);