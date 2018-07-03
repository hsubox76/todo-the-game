import React from 'react';
import { addMinutes } from 'date-fns';
import Clock from './Clock';
import Title from './Title';
import ListBox from './ListBox';
import { INITIAL_TASKS, ITEMS } from '../constants';

const GAME_MINUTE_LENGTH = 1000;
const CLOCK_INCREMENT_INTERVAL_MINUTES = 5;

class Main extends React.Component {
  constructor() {
    super();
    this.lastId = 0;
    this.state = {
      list: [],
      time: new Date(2018, 0, 1, 8),
      timers: {}
    };
  }
  
  componentDidMount() {
    this.incrementClock();
    this.setState({
      list: INITIAL_TASKS.map((item) => this.prepareListItem(item, false)),
    });
  }
  
  componentWillUnmount() {
    for (const key in this.state.timers) {
      if (this.state.timers[key]) {
        this.state.timers[key].forEach(timeoutId => clearTimeout(timeoutId));
      }
    }
  }
  
  incrementClock = () => {
    const timeoutId = setTimeout(() => {
      this.setState({
        time: addMinutes(this.state.time, CLOCK_INCREMENT_INTERVAL_MINUTES)
      });
      this.incrementClock();
    }, GAME_MINUTE_LENGTH * CLOCK_INCREMENT_INTERVAL_MINUTES);
    this.setState({
      timers: Object.assign({}, this.state.timers, { clock: [timeoutId] })
    });
  }
  
  removeItemWithId = (id, list = this.state.list) => {
    const index = list.findIndex(item => item.id === id);
    return list
            .slice(0, index)
            .concat(list.slice(index + 1));
  }
  
  prepareListItem = (item, fadeIn = false) => {
    const id = this.lastId++;
    if (item.spawnsOnAge) {
      const timeoutIds = [];
      item.spawnsOnAge.forEach(spawn => {
        const timeoutId = setTimeout(() => {
          const spawnedItem = ITEMS.find(i => i.taskId === spawn.taskId);
          let newList = this.state.list;
          if (spawn.killParent) {
            // need to kill parent's running timers too probably!
            newList = this.removeItemWithId(id);
          }
          this.setState({
            list: newList.concat(this.prepareListItem(spawnedItem, true))
          });
        }, spawn.age * GAME_MINUTE_LENGTH);
        timeoutIds.push(timeoutId);
      });
      if (timeoutIds.length) {
        this.setState({
          timers: Object.assign({}, this.state.timers, {[id]: timeoutIds})
        });
      }
    }
    return Object.assign({}, item, { isDone: false, id, fadeIn })
  }
  
  handleDone = (id) => {
    // need to kill its timers
    if (this.state.timers[id]) {
      this.state.timers[id].forEach(timeoutId => clearTimeout(timeoutId));
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
    // items to spawn on done
    if (item.spawnsOnDone) {
      item.spawnsOnDone.forEach(taskToSpawn => {
        // these timeout ids should be stored for possible cancellation
        setTimeout(() => {
          const spawnedItem = INITIAL_TASKS.concat(ITEMS)
            .find(i => i.taskId === taskToSpawn.taskId);
          this.setState({
            list: this.state.list
                    .concat(this.prepareListItem(spawnedItem, true))
          });
        }, taskToSpawn.delay * GAME_MINUTE_LENGTH);
      });
    }
    // disappear after a while
    setTimeout(() => {
      this.setState({
        list: this.removeItemWithId(id)
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