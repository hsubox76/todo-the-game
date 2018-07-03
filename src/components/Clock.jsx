import React from 'react';
import { format } from 'date-fns';

const Clock = (props) => (
  <div className="clock-container">
    <div className="time">{format(props.time, 'h:mm a')}</div>
    <div className="date">{format(props.time, 'ddd MMMM Do')}</div>
  </div>
);

export default Clock;