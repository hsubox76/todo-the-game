import React from 'react';
import ListItem from './ListItem';

const List = (props) => (
  <div className="list-container">
    {props.list.map(item => (
      <ListItem
        key={item.id}
        item={item}
        onDone={props.onDone}
      />
    ))}
  </div>
);

export default List;
