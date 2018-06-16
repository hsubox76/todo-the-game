import React from 'react';
import List from './List';

const ListBox = (props) => (
  <div className="list-box-container">
    <List {...props} />
  </div>
);

export default ListBox;