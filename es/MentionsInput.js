var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _class, _temp, _initialiseProps;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

import keys from 'lodash/keys';
import values from 'lodash/values';
import omit from 'lodash/omit';
import isEqual from 'lodash/isEqual';
import isNumber from 'lodash/isNumber';

import { defaultStyle } from 'substyle';

import { escapeRegex, getPlainText, applyChangeToValue, findStartOfMentionInPlainText, getComputedStyleLengthProp, getMentions, countSuggestions, getSuggestion, getEndOfLastMention, mapPlainTextIndex, spliceString, makeMentionsMarkup } from './utils';
import SuggestionsOverlay from './SuggestionsOverlay';
import Highlighter from './Highlighter';

export var _getTriggerRegex = function _getTriggerRegex(trigger) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (trigger instanceof RegExp) {
    return trigger;
  } else {
    var allowSpaceInQuery = options.allowSpaceInQuery;

    var escapedTriggerChar = escapeRegex(trigger);

    // first capture group is the part to be replaced on completion
    // second capture group is for extracting the search query
    return new RegExp('(?:^|\\s)(' + escapedTriggerChar + '([^' + (allowSpaceInQuery ? '' : '\\s') + escapedTriggerChar + ']*))$');
  }
};

var _getDataProvider = function _getDataProvider(data) {
  if (data instanceof Array) {
    // if data is an array, create a function to query that
    return function (query, callback) {
      var results = [];
      for (var i = 0, l = data.length; i < l; ++i) {
        var display = data[i].display || data[i].id;
        if (display.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
          results.push(data[i]);
        }
      }
      return results;
    };
  } else {
    // expect data to be a query function
    return data;
  }
};

var KEY = { TAB: 9, RETURN: 13, ESC: 27, UP: 38, DOWN: 40 };

var isComposing = false;

var propTypes = {
  /**
   * If set to `true` a regular text input element will be rendered
   * instead of a textarea
   */
  singleLine: PropTypes.bool,

  /**
   * If set to `true` spaces will not interrupt matching suggestions
   */
  allowSpaceInQuery: PropTypes.bool,

  markup: PropTypes.string,
  value: PropTypes.string,

  displayTransform: PropTypes.func,
  onKeyDown: PropTypes.func,
  onSelect: PropTypes.func,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  suggestionsPortalHost: PropTypes.any,
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: typeof Element === 'undefined' ? PropTypes.any : PropTypes.instanceOf(Element) })]),

  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)]).isRequired
};

var MentionsInput = (_temp = _class = function (_React$Component) {
  _inherits(MentionsInput, _React$Component);

  function MentionsInput(props) {
    _classCallCheck(this, MentionsInput);

    var _this = _possibleConstructorReturn(this, _React$Component.call(this, props));

    _initialiseProps.call(_this);

    _this.suggestions = {};

    _this.state = {
      focusIndex: 0,

      selectionStart: null,
      selectionEnd: null,

      suggestions: {},

      caretPosition: null,
      suggestionsPosition: null
    };
    return _this;
  }

  MentionsInput.prototype.render = function render() {
    var _this2 = this;

    return React.createElement(
      'div',
      _extends({
        ref: function ref(el) {
          _this2.containerRef = el;
        }
      }, this.props.style),
      this.renderControl(),
      this.renderSuggestionsOverlay()
    );
  };

  // Returns the text to set as the value of the textarea with all markups removed


  // Handle input element's change event


  // Handle input element's select event


  MentionsInput.prototype.componentDidMount = function componentDidMount() {
    this.updateSuggestionsPosition();
  };

  MentionsInput.prototype.componentDidUpdate = function componentDidUpdate(prevProps) {
    this.updateSuggestionsPosition();

    // maintain selection in case a mention is added/removed causing
    // the cursor to jump to the end
    if (this.state.setSelectionAfterMentionChange) {
      this.setState({ setSelectionAfterMentionChange: false });
      this.setSelection(this.state.selectionStart, this.state.selectionEnd);
    }
  };

  return MentionsInput;
}(React.Component), _class.defaultProps = {
  markup: '@[__display__](__id__)',
  singleLine: false,
  displayTransform: function displayTransform(id, display, type) {
    return display;
  },
  onKeyDown: function onKeyDown() {
    return null;
  },
  onSelect: function onSelect() {
    return null;
  },
  onBlur: function onBlur() {
    return null;
  }
}, _initialiseProps = function _initialiseProps() {
  var _this3 = this;

  this.getInputProps = function (isTextarea) {
    var _props = _this3.props,
        readOnly = _props.readOnly,
        disabled = _props.disabled,
        style = _props.style;

    // pass all props that we don't use through to the input control

    var props = omit(_this3.props, 'style', keys(propTypes));

    return _extends({}, props, style('input'), {

      value: _this3.getPlainText()

    }, !readOnly && !disabled && {
      onChange: _this3.handleChange,
      onSelect: _this3.handleSelect,
      onKeyDown: _this3.handleKeyDown,
      onBlur: _this3.handleBlur,
      onCompositionStart: _this3.handleCompositionStart,
      onCompositionEnd: _this3.handleCompositionEnd,
      onScroll: _this3.updateHighlighterScroll
    });
  };

  this.renderControl = function () {
    var _props2 = _this3.props,
        singleLine = _props2.singleLine,
        style = _props2.style;

    var inputProps = _this3.getInputProps(!singleLine);

    return React.createElement(
      'div',
      style('control'),
      _this3.renderHighlighter(inputProps.style),
      singleLine ? _this3.renderInput(inputProps) : _this3.renderTextarea(inputProps)
    );
  };

  this.renderInput = function (props) {
    return React.createElement('input', _extends({ type: 'text', ref: _this3.setInputRef }, props));
  };

  this.renderTextarea = function (props) {
    return React.createElement('textarea', _extends({ ref: _this3.setInputRef }, props));
  };

  this.setInputRef = function (el) {
    _this3.inputRef = el;
    var inputRef = _this3.props.inputRef;

    if (typeof inputRef === 'function') {
      inputRef(el);
    } else if (inputRef) {
      inputRef.current = el;
    }
  };

  this.renderSuggestionsOverlay = function () {
    if (!isNumber(_this3.state.selectionStart)) {
      // do not show suggestions when the input does not have the focus
      return null;
    }
    var suggestionsNode = React.createElement(SuggestionsOverlay, {
      style: _this3.props.style('suggestions'),
      position: _this3.state.suggestionsPosition,
      focusIndex: _this3.state.focusIndex,
      scrollFocusedIntoView: _this3.state.scrollFocusedIntoView,
      ref: function ref(el) {
        _this3.suggestionsRef = el;
      },
      suggestions: _this3.state.suggestions,
      onSelect: _this3.addMention,
      onMouseDown: _this3.handleSuggestionsMouseDown,
      onMouseEnter: function onMouseEnter(focusIndex) {
        return _this3.setState({
          focusIndex: focusIndex,
          scrollFocusedIntoView: false
        });
      },
      isLoading: _this3.isLoading()
    });
    if (_this3.props.suggestionsPortalHost) {
      return ReactDOM.createPortal(suggestionsNode, _this3.props.suggestionsPortalHost);
    } else {
      return suggestionsNode;
    }
  };

  this.renderHighlighter = function (inputStyle) {
    var _state = _this3.state,
        selectionStart = _state.selectionStart,
        selectionEnd = _state.selectionEnd;
    var _props3 = _this3.props,
        markup = _props3.markup,
        displayTransform = _props3.displayTransform,
        singleLine = _props3.singleLine,
        children = _props3.children,
        value = _props3.value,
        style = _props3.style,
        regex = _props3.regex;


    return React.createElement(
      Highlighter,
      {
        ref: function ref(el) {
          _this3.highlighterRef = el;
        },
        style: style('highlighter'),
        inputStyle: inputStyle,
        value: value,
        markup: markup,
        displayTransform: displayTransform,
        singleLine: singleLine,
        selection: {
          start: selectionStart,
          end: selectionEnd
        },
        onCaretPositionChange: function onCaretPositionChange(position) {
          return _this3.setState({ caretPosition: position });
        },
        regex: regex
      },
      children
    );
  };

  this.getPlainText = function () {
    return getPlainText(_this3.props.value || '', _this3.props.markup, _this3.props.displayTransform, _this3.props.regex);
  };

  this.executeOnChange = function (event) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    if (_this3.props.onChange) {
      var _props4;

      return (_props4 = _this3.props).onChange.apply(_props4, [event].concat(args));
    }

    if (_this3.props.valueLink) {
      var _props$valueLink;

      return (_props$valueLink = _this3.props.valueLink).requestChange.apply(_props$valueLink, [event.target.value].concat(args));
    }
  };

  this.handleChange = function (ev) {
    var value = _this3.props.value || '';
    var _props5 = _this3.props,
        markup = _props5.markup,
        displayTransform = _props5.displayTransform,
        regex = _props5.regex;


    var newPlainTextValue = ev.target.value;

    // Derive the new value to set by applying the local change in the textarea's plain text
    var newValue = applyChangeToValue(value, markup, newPlainTextValue, _this3.state.selectionStart, _this3.state.selectionEnd, ev.target.selectionEnd, displayTransform, regex);

    // In case a mention is deleted, also adjust the new plain text value
    newPlainTextValue = getPlainText(newValue, markup, displayTransform, regex);

    // Save current selection after change to be able to restore caret position after rerendering
    var selectionStart = ev.target.selectionStart;
    var selectionEnd = ev.target.selectionEnd;
    var setSelectionAfterMentionChange = false;

    // Adjust selection range in case a mention will be deleted by the characters outside of the
    // selection range that are automatically deleted
    var startOfMention = findStartOfMentionInPlainText(value, markup, selectionStart, displayTransform, regex);

    if (startOfMention !== undefined && _this3.state.selectionEnd > startOfMention) {
      // only if a deletion has taken place
      selectionStart = startOfMention;
      selectionEnd = selectionStart;
      setSelectionAfterMentionChange = true;
    }

    _this3.setState({
      selectionStart: selectionStart,
      selectionEnd: selectionEnd,
      setSelectionAfterMentionChange: setSelectionAfterMentionChange
    });

    var mentions = getMentions(newValue, markup, displayTransform, regex);

    // Propagate change
    // let handleChange = this.getOnChange(this.props) || emptyFunction;
    var eventMock = { target: { value: newValue }
      // this.props.onChange.call(this, eventMock, newValue, newPlainTextValue, mentions);
    };_this3.executeOnChange(eventMock, newValue, newPlainTextValue, mentions);
  };

  this.handleSelect = function (ev) {
    // keep track of selection range / caret position
    _this3.setState({
      selectionStart: ev.target.selectionStart,
      selectionEnd: ev.target.selectionEnd
    });

    // do nothing while a IME composition session is active
    if (isComposing) return;

    // refresh suggestions queries
    var el = _this3.inputRef;
    if (ev.target.selectionStart === ev.target.selectionEnd) {
      _this3.updateMentionsQueries(el.value, ev.target.selectionStart);
    } else {
      _this3.clearSuggestions();
    }

    // sync highlighters scroll position
    _this3.updateHighlighterScroll();

    _this3.props.onSelect(ev);
  };

  this.handleKeyDown = function (ev) {
    // do not intercept key events if the suggestions overlay is not shown
    var suggestionsCount = countSuggestions(_this3.state.suggestions);
    _this3.handleSelect(ev);
    var suggestionsComp = _this3.suggestionsRef;
    if (suggestionsCount === 0 || !suggestionsComp) {
      _this3.props.onKeyDown(ev);

      return;
    }

    if (values(KEY).indexOf(ev.keyCode) >= 0) {
      ev.preventDefault();
    }

    switch (ev.keyCode) {
      case KEY.ESC:
        {
          _this3.clearSuggestions();
          return;
        }
      case KEY.DOWN:
        {
          _this3.shiftFocus(+1);
          return;
        }
      case KEY.UP:
        {
          _this3.shiftFocus(-1);
          return;
        }
      case KEY.RETURN:
        {
          _this3.selectFocused();
          return;
        }
      case KEY.TAB:
        {
          _this3.selectFocused();
          return;
        }
      default:
        {
          return;
        }
    }
  };

  this.shiftFocus = function (delta) {
    var suggestionsCount = countSuggestions(_this3.state.suggestions);

    _this3.setState({
      focusIndex: (suggestionsCount + _this3.state.focusIndex + delta) % suggestionsCount,
      scrollFocusedIntoView: true
    });
  };

  this.selectFocused = function () {
    var _state2 = _this3.state,
        suggestions = _state2.suggestions,
        focusIndex = _state2.focusIndex;

    var _getSuggestion = getSuggestion(suggestions, focusIndex),
        suggestion = _getSuggestion.suggestion,
        descriptor = _getSuggestion.descriptor;

    _this3.addMention(suggestion, descriptor);

    _this3.setState({
      focusIndex: 0
    });
  };

  this.handleBlur = function (ev) {
    var clickedSuggestion = _this3._suggestionsMouseDown;
    _this3._suggestionsMouseDown = false;

    // only reset selection if the mousedown happened on an element
    // other than the suggestions overlay
    if (!clickedSuggestion) {
      _this3.setState({
        selectionStart: null,
        selectionEnd: null
      });
    }

    window.setTimeout(function () {
      _this3.updateHighlighterScroll();
    }, 1);

    _this3.props.onBlur(ev, clickedSuggestion);
  };

  this.handleSuggestionsMouseDown = function (ev) {
    _this3._suggestionsMouseDown = true;
  };

  this.updateSuggestionsPosition = function () {
    var caretPosition = _this3.state.caretPosition;


    if (!caretPosition || !_this3.suggestionsRef) {
      return;
    }

    var suggestions = ReactDOM.findDOMNode(_this3.suggestionsRef);
    var highlighter = ReactDOM.findDOMNode(_this3.highlighterRef);

    if (!suggestions) {
      return;
    }

    var position = {};

    // if suggestions menu is in a portal, update position to be releative to its portal node
    if (_this3.props.suggestionsPortalHost) {
      // first get viewport-relative position (highlighter is offsetParent of caret):
      var caretOffsetParentRect = highlighter.getBoundingClientRect();
      var caretHeight = getComputedStyleLengthProp(highlighter, 'font-size');
      var viewportRelative = {
        left: caretOffsetParentRect.left + caretPosition.left,
        top: caretOffsetParentRect.top + caretPosition.top + caretHeight
      };
      position.position = 'fixed';
      var left = viewportRelative.left;
      position.top = viewportRelative.top;
      // absolute/fixed positioned elements are positioned according to their entire box including margins; so we remove margins here:
      left -= getComputedStyleLengthProp(suggestions, 'margin-left');
      position.top -= getComputedStyleLengthProp(suggestions, 'margin-top');
      // take into account highlighter/textinput scrolling:
      left -= highlighter.scrollLeft;
      position.top -= highlighter.scrollTop;
      // guard for mentions suggestions list clipped by right edge of window
      var viewportWidth = Math.max(highlighter.ownerDocument.documentElement.clientWidth, window.innerWidth || 0);
      if (left + suggestions.offsetWidth > viewportWidth) {
        position.left = Math.max(0, viewportWidth - suggestions.offsetWidth);
      } else {
        position.left = left;
      }
    } else {
      var _left = caretPosition.left - highlighter.scrollLeft;
      // guard for mentions suggestions list clipped by right edge of window
      if (_left + suggestions.offsetWidth > _this3.containerRef.offsetWidth) {
        position.right = 0;
      } else {
        position.left = _left;
      }
      position.top = caretPosition.top - highlighter.scrollTop;
    }

    if (isEqual(position, _this3.state.suggestionsPosition)) {
      return;
    }

    _this3.setState({
      suggestionsPosition: position
    });
  };

  this.updateHighlighterScroll = function () {
    if (!_this3.inputRef || !_this3.highlighterRef) {
      // since the invocation of this function is deferred,
      // the whole component may have been unmounted in the meanwhile
      return;
    }
    var input = _this3.inputRef;
    var highlighter = ReactDOM.findDOMNode(_this3.highlighterRef);
    highlighter.scrollLeft = input.scrollLeft;
    highlighter.scrollTop = input.scrollTop;
    highlighter.height = input.height;
  };

  this.handleCompositionStart = function () {
    isComposing = true;
  };

  this.handleCompositionEnd = function () {
    isComposing = false;
  };

  this.setSelection = function (selectionStart, selectionEnd) {
    if (selectionStart === null || selectionEnd === null) return;

    var el = _this3.inputRef;
    if (el.setSelectionRange) {
      el.setSelectionRange(selectionStart, selectionEnd);
    } else if (el.createTextRange) {
      var range = el.createTextRange();
      range.collapse(true);
      range.moveEnd('character', selectionEnd);
      range.moveStart('character', selectionStart);
      range.select();
    }
  };

  this.updateMentionsQueries = function (plainTextValue, caretPosition) {
    // Invalidate previous queries. Async results for previous queries will be neglected.
    _this3._queryId++;
    _this3.suggestions = {};
    _this3.setState({
      suggestions: {}
    });

    var value = _this3.props.value || '';
    var _props6 = _this3.props,
        markup = _props6.markup,
        displayTransform = _props6.displayTransform,
        children = _props6.children,
        regex = _props6.regex;

    var positionInValue = mapPlainTextIndex(value, markup, caretPosition, 'NULL', displayTransform, regex);

    // If caret is inside of mention, do not query
    if (positionInValue === null) {
      return;
    }

    // Extract substring in between the end of the previous mention and the caret
    var substringStartIndex = getEndOfLastMention(value.substring(0, positionInValue), markup, displayTransform, regex);
    var substring = plainTextValue.substring(substringStartIndex, caretPosition);

    // Check if suggestions have to be shown:
    // Match the trigger patterns of all Mention children on the extracted substring
    React.Children.forEach(children, function (child) {
      if (!child) {
        return;
      }

      var regex = _getTriggerRegex(child.props.trigger, _this3.props);
      var match = substring.match(regex);
      if (match) {
        var querySequenceStart = substringStartIndex + substring.indexOf(match[1], match.index);
        _this3.queryData(match[2], child, querySequenceStart, querySequenceStart + match[1].length, plainTextValue);
      }
    });
  };

  this.clearSuggestions = function () {
    // Invalidate previous queries. Async results for previous queries will be neglected.
    _this3._queryId++;
    _this3.suggestions = {};
    _this3.setState({
      suggestions: {},
      focusIndex: 0
    });
  };

  this.queryData = function (query, mentionDescriptor, querySequenceStart, querySequenceEnd, plainTextValue) {
    var provideData = _getDataProvider(mentionDescriptor.props.data);
    var snycResult = provideData(query, _this3.updateSuggestions.bind(null, _this3._queryId, mentionDescriptor, query, querySequenceStart, querySequenceEnd, plainTextValue));
    if (snycResult instanceof Array) {
      _this3.updateSuggestions(_this3._queryId, mentionDescriptor, query, querySequenceStart, querySequenceEnd, plainTextValue, snycResult);
    }
  };

  this.updateSuggestions = function (queryId, mentionDescriptor, query, querySequenceStart, querySequenceEnd, plainTextValue, suggestions) {
    var _extends2;

    // neglect async results from previous queries
    if (queryId !== _this3._queryId) return;

    // save in property so that multiple sync state updates from different mentions sources
    // won't overwrite each other
    _this3.suggestions = _extends({}, _this3.suggestions, (_extends2 = {}, _extends2[mentionDescriptor.props.type] = {
      query: query,
      mentionDescriptor: mentionDescriptor,
      querySequenceStart: querySequenceStart,
      querySequenceEnd: querySequenceEnd,
      results: suggestions,
      plainTextValue: plainTextValue
    }, _extends2));

    var focusIndex = _this3.state.focusIndex;

    var suggestionsCount = countSuggestions(_this3.suggestions);
    _this3.setState({
      suggestions: _this3.suggestions,
      focusIndex: focusIndex >= suggestionsCount ? Math.max(suggestionsCount - 1, 0) : focusIndex
    });
  };

  this.addMention = function (suggestion, _ref) {
    var mentionDescriptor = _ref.mentionDescriptor,
        querySequenceStart = _ref.querySequenceStart,
        querySequenceEnd = _ref.querySequenceEnd,
        plainTextValue = _ref.plainTextValue;

    // Insert mention in the marked up value at the correct position
    var value = _this3.props.value || '';
    var _props7 = _this3.props,
        markup = _props7.markup,
        displayTransform = _props7.displayTransform,
        regex = _props7.regex;

    var start = mapPlainTextIndex(value, markup, querySequenceStart, 'START', displayTransform, regex);
    var end = start + querySequenceEnd - querySequenceStart;
    var insert = makeMentionsMarkup(markup, suggestion.id, suggestion.display, mentionDescriptor.props.type);
    if (mentionDescriptor.props.appendSpaceOnAdd) {
      insert = insert + ' ';
    }
    var newValue = spliceString(value, start, end, insert);

    // Refocus input and set caret position to end of mention
    _this3.inputRef.focus();

    var displayValue = displayTransform(suggestion.id, suggestion.display, mentionDescriptor.props.type);
    if (mentionDescriptor.props.appendSpaceOnAdd) {
      displayValue = displayValue + ' ';
    }
    var newCaretPosition = querySequenceStart + displayValue.length;
    _this3.setState({
      selectionStart: newCaretPosition,
      selectionEnd: newCaretPosition,
      setSelectionAfterMentionChange: true
    });

    // Propagate change
    var eventMock = { target: { value: newValue } };
    var mentions = getMentions(newValue, markup, displayTransform, regex);
    var newPlainTextValue = spliceString(plainTextValue, querySequenceStart, querySequenceEnd, displayValue);

    _this3.executeOnChange(eventMock, newValue, newPlainTextValue, mentions);

    var onAdd = mentionDescriptor.props.onAdd;
    if (onAdd) {
      onAdd(suggestion.id, suggestion.display);
    }

    // Make sure the suggestions overlay is closed
    _this3.clearSuggestions();
  };

  this.isLoading = function () {
    var isLoading = false;
    React.Children.forEach(_this3.props.children, function (child) {
      isLoading = isLoading || child && child.props.isLoading;
    });
    return isLoading;
  };

  this._queryId = 0;
}, _temp);
MentionsInput.propTypes = process.env.NODE_ENV !== "production" ? propTypes : {};


var isMobileSafari = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

var styled = defaultStyle({
  position: 'relative',
  overflowY: 'visible',

  input: {
    display: 'block',
    position: 'absolute',
    top: 0,
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    width: 'inherit',
    fontFamily: 'inherit',
    fontSize: 'inherit'
  },

  '&multiLine': {
    input: _extends({
      width: '100%',
      height: '100%',
      bottom: 0,
      overflow: 'hidden',
      resize: 'none'

    }, isMobileSafari ? {
      marginTop: 1,
      marginLeft: -3
    } : null)
  }
}, function (_ref2) {
  var singleLine = _ref2.singleLine;
  return {
    '&singleLine': singleLine,
    '&multiLine': !singleLine
  };
});

export default styled(MentionsInput);