const React = require('react');
const ListItem = require('./ListItem');

const List = (props) => (
  <div className="list-container">
    {props.list.map(item => (<ListItem description={item} />))}
  </div>
);

module.exports = List;