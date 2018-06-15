const React = require('react');

const ListItem = (props) => (
  <div className="list-item">
    {props.description}
  </div>
);

module.exports = ListItem;
