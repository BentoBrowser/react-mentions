import React from 'react';
import substyle from 'substyle';

function LoadingIndicator(_ref) {
  var style = _ref.style;

  var spinnerStyle = style('spinner');
  return React.createElement(
    'div',
    style,
    React.createElement(
      'div',
      spinnerStyle,
      React.createElement('div', spinnerStyle(['element', 'element1'])),
      React.createElement('div', spinnerStyle(['element', 'element2'])),
      React.createElement('div', spinnerStyle(['element', 'element3'])),
      React.createElement('div', spinnerStyle(['element', 'element4'])),
      React.createElement('div', spinnerStyle(['element', 'element5']))
    )
  );
}

export default substyle(LoadingIndicator);