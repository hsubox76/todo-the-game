import React from 'react';
import { addHours } from 'date-fns';
import Clock from './Clock';
import Title from './Title';
import ListBox from './ListBox';
import {
  PALETTES,
  GAME_HOUR_LENGTH,
  CLOCK_INCREMENT_INTERVAL_HOURS,
  FIRESTORE_COLLECTION
} from '../data/constants';

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.lastId = 0;
    this.state = {
      list: [],
      time: new Date(2018, 0, 1, 8),
      timers: {},
      palette: 1
    };
  }
  
  componentDidMount() {
    this.incrementClock();
    this.props.db.collection('tasks').get().then(snapshot => {
      const list = [];
      snapshot.forEach(taskDoc => {
        const task = taskDoc.data();
        if (task.isInitial) {
          list.push(this.prepareListItem(task));
        }
      });
      this.setState({ list });
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
        time: addHours(this.state.time, CLOCK_INCREMENT_INTERVAL_HOURS)
      });
      this.incrementClock();
    }, GAME_HOUR_LENGTH * CLOCK_INCREMENT_INTERVAL_HOURS);
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
      item.spawnsOnAge.forEach(spawn => {
        this.props.db.collection(FIRESTORE_COLLECTION.TASKS)
          .doc(spawn.taskId)
          .get()
          .then(doc => {
            const timeoutId = setTimeout(() => {
              let newList = this.state.list;
              if (spawn.killParent) {
                // need to kill parent's running timers too probably!
                newList = this.removeItemWithId(id);
              }
              this.setState({
                list: newList.concat(this.prepareListItem(doc.data(), true))
              });
            }, spawn.age * GAME_HOUR_LENGTH);
            const timeoutIds = this.state.timers[id] || [];
            timeoutIds.push(timeoutId);
            this.setState({
              timers: Object.assign({}, this.state.timers, {[id]: timeoutIds})
            });
          });
      });
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
      item.spawnsOnDone.forEach(async taskToSpawn => {
        // these timeout ids should be stored for possible cancellation
        const spawnedItem = await this.props.db.collection(FIRESTORE_COLLECTION.TASKS)
          .doc(taskToSpawn.taskId)
          .get()
          .then(doc => {
            return doc.data();
          });
        setTimeout(() => {
          this.setState({
            list: this.state.list
                    .concat(this.prepareListItem(spawnedItem, true))
          });
        }, taskToSpawn.delay * GAME_HOUR_LENGTH);
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
    const classes = ['main-container'];
    classes.push('palette-' + this.state.palette);
    return (
      <div className={classes.join(' ')}>
          <div className="settings-container">
            <div className="palette-description">themes</div>
            {PALETTES.map((paletteId) => (
              <button
                key={paletteId}
                onClick={() => this.setState({ palette: paletteId })}
                className={'palette-button palette-' + paletteId + (paletteId === this.state.palette ? ' selected' : '')}
              >
                {paletteId}
              </button>
            ))}
          </div>
          <Clock time={this.state.time} />
          <Title />
          <ListBox list={this.state.list} onDone={this.handleDone} />
      </div>
    );
  }
}

export default Main;