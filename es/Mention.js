import React from 'react';
import PropTypes from 'prop-types';
import { defaultStyle } from 'substyle';

var styled = defaultStyle({
  fontWeight: 'inherit'
});

var Mention = styled(function (_ref) {
  var display = _ref.display,
      style = _ref.style;
  return React.createElement(
    'strong',
    style,
    display
  );
});

Mention.propTypes = {
  /**
   * Called when a new mention is added in the input
   *
   * Example:
   *
   * ```js
   * function(id, display) {
   *   console.log("user " + display + " was mentioned!");
   * }
   * ```
   */
  onAdd: PropTypes.func,
  onRemove: PropTypes.func,

  renderSuggestion: PropTypes.func,

  trigger: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(RegExp)]),

  isLoading: PropTypes.bool
};

Mention.defaultProps = {
  trigger: '@',

  onAdd: function onAdd() {
    return null;
  },
  onRemove: function onRemove() {
    return null;
  },
  renderSuggestion: null,
  isLoading: false,
  appendSpaceOnAdd: false
};

export default Mention;