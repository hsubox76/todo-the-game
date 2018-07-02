import React from 'react';
import Clock from './Clock';
import Title from './Title';
import ListBox from './ListBox';
import { INITIAL_TASKS, ITEMS } from '../constants';

class Main extends React.Component {
  constructor() {
    super();
    this.lastId = 0;
    this.state = {
      list: INITIAL_TASKS.map((item) => this.prepareListItem(item, false)),
      time: '12:35'
    };
  }
  
  prepareListItem = (item, fadeIn = false) => {
    return Object.assign({}, item, { isDone: false, id: this.lastId++, fadeIn })
  }
  
  handleDone = (id) => {
    const index = this.state.list.findIndex(item => item.id === id);
    const item = this.state.list[index];
    const newItem = Object.assign({}, item, { isDone: true });
    const newList = this.state.list.slice(0, index)
              .concat(newItem)
              .concat(this.state.list.slice(index + 1));
    if (item.spawns) {
      item.spawns.forEach(taskToSpawn => {
        const spawnedItem = ITEMS.find(i => i.taskId === taskToSpawn.taskId);
        setTimeout(() => {
          console.log('delay is up');
          this.setState({
            list: this.state.list.concat(this.prepareListItem(spawnedItem, true))
          });
        }, taskToSpawn.delay * 1000);
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