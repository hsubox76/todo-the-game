import React from 'react';
import { CSSTransitionGroup } from 'react-transition-group';
import ListItem from './ListItem';

const List = (props) => (
  <div className="list-container">
    <CSSTransitionGroup
      transitionName="list-transition"
      transitionEnterTimeout={300}
      transitionLeave={false}
    >
    {props.list.map(item => (
      <ListItem
        key={item.id + (item.isDone ? '-done' : '-not-done')}
        item={item}
        onDone={props.onDone}
      />
    ))}
    </CSSTransitionGroup>
  </div>
);

export default List;
