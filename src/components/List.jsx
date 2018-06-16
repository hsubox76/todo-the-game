import React from 'react';
import ListItem from './ListItem';

const List = (props) => (
  <div className="list-container">
    {props.list.map(item => (<ListItem key={item.id} item={item} onStatusChange={props.onStatusChange} />))}
  </div>
);

export default List;
