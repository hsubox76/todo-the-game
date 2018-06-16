import React from 'react';
import Clock from './Clock';
import Title from './Title';
import ListBox from './ListBox';
import { STATUS } from '../constants';

const initialList = [
  { id: 1, description: 'abc', status: STATUS.NOT_DONE },
  { id: 2, description: 'def', status: STATUS.NOT_DONE },
  { id: 3, description: 'ghi', status: STATUS.NOT_DONE }
];

class Main extends React.Component {
  constructor() {
    super();
    this.state = {
      list: initialList,
      lastId: 2,
      time: '12:35'
    };
  }
  
  handleStatusChange = (id, status) => {
    const index = this.state.list.findIndex(item => item.id === id);
    const newItem = Object.assign({}, this.state.list[index], { status });
    const newList = this.state.list.slice(0, index)
              .concat(newItem)
              .concat(this.state.list.slice(index + 1));
    this.setState({
      list: this.sortList(newList)
    });
  }
  
  sortList = (list = this.state.list) => {
    return list.sort((a, b) => a.status - b.status);
  }
  
  render() {
    return (
      <div className="main-container">
          <Clock time={this.state.time} />
          <Title />
          <ListBox list={this.state.list} onStatusChange={this.handleStatusChange} />
      </div>
    );
  }
}

export default Main;