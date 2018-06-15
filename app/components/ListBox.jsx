const React = require('react');
const List = require('./List');

const ListBox = (props) => (
  <div className="list-box-container">
    <List list={props.list} />
  </div>
);

module.exports = ListBox;