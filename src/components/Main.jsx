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
      list: [],
      time: '12:35',
      timers: {}
    };
  }
  
  componentDidMount() {
    this.setState({
      list: INITIAL_TASKS.map((item) => this.prepareListItem(item, false)),
    });
  }
  
  prepareListItem = (item, fadeIn = false) => {
    const id = this.lastId++;
    if (item.triggers) {
      item.triggers.forEach(trigger => {
        if (trigger.age) {
          if (trigger.die && trigger.spawns) {
            const timeoutId = setTimeout(() => {
              const index = this.state.list.findIndex(item => item.id === id);
              // need to kill its timers too probably!
              const spawnedItems = trigger.spawns.map(taskToSpawn => {
                const spawnedItem = ITEMS.find(i => i.taskId === taskToSpawn.taskId);
                return this.prepareListItem(spawnedItem, true)
              });
              this.setState({
                list: this.state.list.slice(0, index)
                    .concat(this.state.list.slice(index + 1))
                    .concat(spawnedItems)
              });
            }, trigger.age * 1000);
            this.setState({
              timers: Object.assign({}, this.state.timers, {[id]: timeoutId})
            });
          }
        }
      });
    }
    return Object.assign({}, item, { isDone: false, id, fadeIn })
  }
  
  handleDone = (id) => {
    // need to kill its timers
    if (this.state.timers[id]) {
      clearTimeout(this.state.timers[id]);
      this.setState({
        timers: Object.assign({}, this.state.timers, {[id]: null})
      });
    }
    const index = this.state.list.findIndex(item => item.id === id);
    const item = this.state.list[index];
    const newItem = Object.assign({}, item, { isDone: true });
    const newList = this.state.list.slice(0, index)
              .concat(newItem)
              .concat(this.state.list.slice(index + 1));
    if (item.spawns) {
      item.spawns.forEach(taskToSpawn => {
        setTimeout(() => {
          const spawnedItem = INITIAL_TASKS.concat(ITEMS)
            .find(i => i.taskId === taskToSpawn.taskId);
          this.setState({
            list: this.state.list.concat(this.prepareListItem(spawnedItem, true))
          });
        }, taskToSpawn.delay * 1000);
      });
    }
    // disappear after a while
    setTimeout(() => {
      const index = this.state.list.findIndex(item => item.id === id);
      this.setState({
        list: this.state.list.slice(0, index)
            .concat(this.state.list.slice(index + 1))
      });
    }, 5000);
    this.setState({
      list: newList
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