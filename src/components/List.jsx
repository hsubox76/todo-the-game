import React from 'react';
import { CSSTransitionGroup } from 'react-transition-group';
import ListItem from './ListItem';

const List = (props) => (
  <div className="list-container">
    <CSSTransitionGroup
      transitionName="list-transition"
      transitionEnterTimeout={500}
      transitionLeaveTimeout={500}
    >
    {props.list.map(item => (
      <ListItem
        key={item.id}
        item={item}
        onDone={props.onDone}
      />
    ))}
    </CSSTransitionGroup>
  </div>
);

export default List;
