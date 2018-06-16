import React from 'react';
import Clock from './Clock';
import Title from './Title';
import ListBox from './ListBox';
import { INITIAL_LIST, ITEMS } from '../constants';

class Main extends React.Component {
  constructor() {
    super();
    this.lastId = 0;
    this.state = {
      list: INITIAL_LIST.map(this.prepareListItem),
      time: '12:35'
    };
  }
  
  prepareListItem = (item) => {
    return Object.assign({}, item, { isDone: false, id: this.lastId++ })
  }
  
  handleDone = (id) => {
    const index = this.state.list.findIndex(item => item.id === id);
    const item = this.state.list[index];
    const newItem = Object.assign({}, item, { isDone: true });
    const newList = this.state.list.slice(0, index)
              .concat(newItem)
              .concat(this.state.list.slice(index + 1));
    if (item.spawns) {
      item.spawns.forEach(cid => {
        const spawnedItem = ITEMS.find(i => i.cid === cid);
        newList.push(this.prepareListItem(spawnedItem));
      });
    }
    this.setState({
      list: this.sortList(newList)
    });
  }
  
  sortList = (list = this.state.list) => {
    return list.sort((a, b) => {
      if (a.isDone === b.isDone) {
        return 0;
      } else if (a.isDone) {
        return 1;
      } else {
        return -1;
      }
    });
  }
  
  render() {
    return (
      <div className="main-container">
          <Clock time={this.state.time} />
          <Title />
          <ListBox list={this.state.list} onDone={this.handleDone} />
      </div>
    );
  }
}

export default Main;