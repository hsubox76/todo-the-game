import React from 'react';
import { CSSTransitionGroup } from 'react-transition-group';
import ListItem from './ListItem';

const List = (props) => (
  <div className="list-container">
    {
      <CSSTransitionGroup
        transitionName="list-transition"
        transitionEnterTimeout={props.firstLoad ? 100 : 500}
        transitionLeaveTimeout={props.firstLoad ? 100 : 500}
      >
      {props.list.map(item => (
        <ListItem
          key={item.id}
          item={item}
          onDone={props.onDone}
        />
      ))}
      </CSSTransitionGroup>
    }
  </div>
);

export default List;
