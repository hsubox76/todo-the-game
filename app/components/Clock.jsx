const React = require('react');

const Clock = (props) => (
  <div className="clock-container">{props.time}</div>
);

module.exports = Clock;