import isNumber from 'lodash/isNumber';
import isFinite from 'lodash/isFinite';
import keys from 'lodash/keys';

var PLACEHOLDERS = {
  id: '__id__',
  display: '__display__',
  type: '__type__'
};

var numericComparator = function numericComparator(a, b) {
  a = a === null ? Number.MAX_VALUE : a;
  b = b === null ? Number.MAX_VALUE : b;
  return a - b;
};

export var escapeRegex = function escapeRegex(str) {
  return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
};

var countCapturingGroups = function countCapturingGroups(regex) {
  return new RegExp(regex.toString() + '|').exec('').length - 1;
};

var markupToRegex = function markupToRegex(markup) {
  var markupPattern = escapeRegex(markup);
  markupPattern = markupPattern.replace(PLACEHOLDERS.display, '(.+?)');
  markupPattern = markupPattern.replace(PLACEHOLDERS.id, '(.+?)');
  markupPattern = markupPattern.replace(PLACEHOLDERS.type, '(.+?)');

  return new RegExp(markupPattern, 'g');
};

export var spliceString = function spliceString(str, start, end, insert) {
  return str.substring(0, start) + insert + str.substring(end);
};

/**
 * Returns the computed length property value for the provided element.
 * Note: According to spec and testing, can count on length values coming back in pixels. See https://developer.mozilla.org/en-US/docs/Web/CSS/used_value#Difference_from_computed_value
 */
export var getComputedStyleLengthProp = function getComputedStyleLengthProp(forElement, propertyName) {
  var length = parseFloat(window.getComputedStyle(forElement, null).getPropertyValue(propertyName));
  return isFinite(length) ? length : 0;
};

/**
 * parameterName: "id", "display", or "type"
 * TODO: This is currently only exported for testing
 */
export var getPositionOfCapturingGroup = function getPositionOfCapturingGroup(markup, parameterName, regex) {
  if (parameterName !== 'id' && parameterName !== 'display' && parameterName !== 'type') {
    throw new Error("parameterName must be 'id', 'display', or 'type'");
  }

  // calculate positions of placeholders in the markup
  var indexDisplay = markup.indexOf(PLACEHOLDERS.display);
  var indexId = markup.indexOf(PLACEHOLDERS.id);
  var indexType = markup.indexOf(PLACEHOLDERS.type);

  // set indices to null if not found
  if (indexDisplay < 0) indexDisplay = null;
  if (indexId < 0) indexId = null;
  if (indexType < 0) indexType = null;

  if (indexDisplay === null && indexId === null) {
    // markup contains none of the mandatory placeholders
    throw new Error('The markup `' + markup + '` must contain at least one of the placeholders `__id__` or `__display__`');
  }

  if (indexType === null && parameterName === 'type') {
    // markup does not contain optional __type__ placeholder
    return null;
  }

  // sort indices in ascending order (null values will always be at the end)
  var sortedIndices = [indexDisplay, indexId, indexType].sort(numericComparator);

  // If only one the placeholders __id__ and __display__ is present,
  // use the captured string for both parameters, id and display
  if (indexDisplay === null) indexDisplay = indexId;
  if (indexId === null) indexId = indexDisplay;

  if (regex && countCapturingGroups(regex) === 0) {
    // custom regex does not use any capturing groups, so use the full match for ID and display
    return parameterName === 'type' ? null : 0;
  }

  if (parameterName === 'id') return sortedIndices.indexOf(indexId);
  if (parameterName === 'display') return sortedIndices.indexOf(indexDisplay);
  if (parameterName === 'type') return indexType === null ? null : sortedIndices.indexOf(indexType);
};

// Finds all occurences of the markup in the value and iterates the plain text sub strings
// in between those markups using `textIteratee` and the markup occurrences using the
// `markupIteratee`.
export var iterateMentionsMarkup = function iterateMentionsMarkup(value, markup, textIteratee, markupIteratee, displayTransform, regex) {
  regex = regex || markupToRegex(markup);
  var displayPos = getPositionOfCapturingGroup(markup, 'display', regex);
  var idPos = getPositionOfCapturingGroup(markup, 'id', regex);
  var typePos = getPositionOfCapturingGroup(markup, 'type', regex);

  var match = void 0;
  var start = 0;
  var currentPlainTextIndex = 0;

  // detect all mention markup occurences in the value and iterate the matches
  while ((match = regex.exec(value)) !== null) {
    // first argument is the whole match, capturing groups are following
    var id = match[idPos + 1];
    var display = match[displayPos + 1];
    var type = typePos !== null ? match[typePos + 1] : null;

    if (displayTransform) display = displayTransform(id, display, type);

    var substr = value.substring(start, match.index);
    textIteratee(substr, start, currentPlainTextIndex);
    currentPlainTextIndex += substr.length;

    markupIteratee(match[0], match.index, currentPlainTextIndex, id, display, type, start);
    currentPlainTextIndex += display.length;

    start = regex.lastIndex;
  }

  if (start < value.length) {
    textIteratee(value.substring(start), start, currentPlainTextIndex);
  }
};

// For the passed character index in the plain text string, returns the corresponding index
// in the marked up value string.
// If the passed character index lies inside a mention, the value of `inMarkupCorrection` defines the
// correction to apply:
//   - 'START' to return the index of the mention markup's first char (default)
//   - 'END' to return the index after its last char
//   - 'NULL' to return null
export var mapPlainTextIndex = function mapPlainTextIndex(value, markup, indexInPlainText) {
  var inMarkupCorrection = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'START';
  var displayTransform = arguments[4];
  var regex = arguments[5];

  if (!isNumber(indexInPlainText)) {
    return indexInPlainText;
  }

  var result = void 0;
  var textIteratee = function textIteratee(substr, index, substrPlainTextIndex) {
    if (result !== undefined) return;

    if (substrPlainTextIndex + substr.length >= indexInPlainText) {
      // found the corresponding position in the current plain text range
      result = index + indexInPlainText - substrPlainTextIndex;
    }
  };
  var markupIteratee = function markupIteratee(markup, index, mentionPlainTextIndex, id, display, type, lastMentionEndIndex) {
    if (result !== undefined) return;

    if (mentionPlainTextIndex + display.length > indexInPlainText) {
      // found the corresponding position inside current match,
      // return the index of the first or after the last char of the matching markup
      // depending on whether the `inMarkupCorrection`
      if (inMarkupCorrection === 'NULL') {
        result = null;
      } else {
        result = index + (inMarkupCorrection === 'END' ? markup.length : 0);
      }
    }
  };

  iterateMentionsMarkup(value, markup, textIteratee, markupIteratee, displayTransform, regex);

  // when a mention is at the end of the value and we want to get the caret position
  // at the end of the string, result is undefined
  return result === undefined ? value.length : result;
};

// For a given indexInPlainText that lies inside a mention,
// returns a the index of of the first char of the mention in the plain text.
// If indexInPlainText does not lie inside a mention, returns indexInPlainText.
export var findStartOfMentionInPlainText = function findStartOfMentionInPlainText(value, markup, indexInPlainText, displayTransform, regex) {
  var result = indexInPlainText;
  var foundMention = false;

  var markupIteratee = function markupIteratee(markup, index, mentionPlainTextIndex, id, display, type, lastMentionEndIndex) {
    if (mentionPlainTextIndex <= indexInPlainText && mentionPlainTextIndex + display.length > indexInPlainText) {
      result = mentionPlainTextIndex;
      foundMention = true;
    }
  };
  iterateMentionsMarkup(value, markup, function () {}, markupIteratee, displayTransform, regex);

  if (foundMention) {
    return result;
  }
};

// Applies a change from the plain text textarea to the underlying marked up value
// guided by the textarea text selection ranges before and after the change
export var applyChangeToValue = function applyChangeToValue(value, markup, plainTextValue, selectionStartBeforeChange, selectionEndBeforeChange, selectionEndAfterChange, displayTransform, regex) {
  var oldPlainTextValue = getPlainText(value, markup, displayTransform, regex);

  var lengthDelta = oldPlainTextValue.length - plainTextValue.length;
  if (selectionStartBeforeChange === 'undefined') {
    selectionStartBeforeChange = selectionEndAfterChange + lengthDelta;
  }

  if (selectionEndBeforeChange === 'undefined') {
    selectionEndBeforeChange = selectionStartBeforeChange;
  }

  // Fixes an issue with replacing combined characters for complex input. Eg like acented letters on OSX
  if (selectionStartBeforeChange === selectionEndBeforeChange && selectionEndBeforeChange === selectionEndAfterChange && oldPlainTextValue.length === plainTextValue.length) {
    selectionStartBeforeChange = selectionStartBeforeChange - 1;
  }

  // extract the insertion from the new plain text value
  var insert = plainTextValue.slice(selectionStartBeforeChange, selectionEndAfterChange);

  // handling for Backspace key with no range selection
  var spliceStart = Math.min(selectionStartBeforeChange, selectionEndAfterChange);

  var spliceEnd = selectionEndBeforeChange;
  if (selectionStartBeforeChange === selectionEndAfterChange) {
    // handling for Delete key with no range selection
    spliceEnd = Math.max(selectionEndBeforeChange, selectionStartBeforeChange + lengthDelta);
  }

  var mappedSpliceStart = mapPlainTextIndex(value, markup, spliceStart, 'START', displayTransform, regex);
  var mappedSpliceEnd = mapPlainTextIndex(value, markup, spliceEnd, 'END', displayTransform, regex);

  var controlSpliceStart = mapPlainTextIndex(value, markup, spliceStart, 'NULL', displayTransform, regex);
  var controlSpliceEnd = mapPlainTextIndex(value, markup, spliceEnd, 'NULL', displayTransform, regex);
  var willRemoveMention = controlSpliceStart === null || controlSpliceEnd === null;

  var newValue = spliceString(value, mappedSpliceStart, mappedSpliceEnd, insert);

  if (!willRemoveMention) {
    // test for auto-completion changes
    var controlPlainTextValue = getPlainText(newValue, markup, displayTransform, regex);
    if (controlPlainTextValue !== plainTextValue) {
      // some auto-correction is going on

      // find start of diff
      spliceStart = 0;
      while (plainTextValue[spliceStart] === controlPlainTextValue[spliceStart]) {
        spliceStart++;
      } // extract auto-corrected insertion
      insert = plainTextValue.slice(spliceStart, selectionEndAfterChange);

      // find index of the unchanged remainder
      spliceEnd = oldPlainTextValue.lastIndexOf(plainTextValue.substring(selectionEndAfterChange));

      // re-map the corrected indices
      mappedSpliceStart = mapPlainTextIndex(value, markup, spliceStart, 'START', displayTransform, regex);
      mappedSpliceEnd = mapPlainTextIndex(value, markup, spliceEnd, 'END', displayTransform, regex);
      newValue = spliceString(value, mappedSpliceStart, mappedSpliceEnd, insert);
    }
  }

  return newValue;
};

export var getPlainText = function getPlainText(value, markup, displayTransform, regex) {
  regex = regex || markupToRegex(markup);
  var idPos = getPositionOfCapturingGroup(markup, 'id', regex);
  var displayPos = getPositionOfCapturingGroup(markup, 'display', regex);
  var typePos = getPositionOfCapturingGroup(markup, 'type', regex);
  return value.replace(regex, function () {
    // first argument is the whole match, capturing groups are following
    var id = arguments[idPos + 1];
    var display = arguments[displayPos + 1];
    var type = typePos !== null ? arguments[typePos + 1] : null;
    if (displayTransform) display = displayTransform(id, display, type);
    return display;
  });
};

export var getMentions = function getMentions(value, markup, displayTransform, regex) {
  var mentions = [];
  iterateMentionsMarkup(value, markup, function () {}, function (match, index, plainTextIndex, id, display, type, start) {
    mentions.push({
      id: id,
      display: display,
      type: type,
      index: index,
      plainTextIndex: plainTextIndex
    });
  }, displayTransform, regex);
  return mentions;
};

export var getEndOfLastMention = function getEndOfLastMention(value, markup, displayTransform, regex) {
  var mentions = getMentions(value, markup, displayTransform, regex);
  var lastMention = mentions[mentions.length - 1];
  return lastMention ? lastMention.plainTextIndex + lastMention.display.length : 0;
};

export var makeMentionsMarkup = function makeMentionsMarkup(markup, id, display, type) {
  var result = markup.replace(PLACEHOLDERS.id, id);
  result = result.replace(PLACEHOLDERS.display, display);
  result = result.replace(PLACEHOLDERS.type, type);
  return result;
};

export var countSuggestions = function countSuggestions(suggestions) {
  return keys(suggestions).reduce(function (acc, prop) {
    return acc + suggestions[prop].results.length;
  }, 0);
};

export var getSuggestions = function getSuggestions(suggestions) {
  return keys(suggestions).reduce(function (acc, mentionType) {
    return [].concat(acc, [{
      suggestions: suggestions[mentionType].results,
      descriptor: suggestions[mentionType]
    }]);
  }, []);
};

export var getSuggestion = function getSuggestion(suggestions, index) {
  return getSuggestions(suggestions).reduce(function (result, _ref) {
    var suggestions = _ref.suggestions,
        descriptor = _ref.descriptor;
    return [].concat(result, suggestions.map(function (suggestion) {
      return {
        suggestion: suggestion,
        descriptor: descriptor
      };
    }));
  }, [])[index];
};