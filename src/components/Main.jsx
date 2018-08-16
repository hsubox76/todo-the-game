import React from 'react';
import { addHours } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
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
    this.gameHourLength = GAME_HOUR_LENGTH;
    this.state = {
      list: [],
      time: new Date(2018, 0, 1, 8),
      timers: {},
      palette: 1,
      firstLoad: true
    };
  }
  
  componentDidMount() {
    const params = window.location.search
      .substring(1)
      .split('&')
      .reduce((pairs, pairString) => {
        const [key, val] = pairString.split('=');
        pairs[key] = val;
        return pairs;
      }, {});
    this.setState({ params });
    if (params.hourlength) {
      this.gameHourLength = parseInt(params.hourlength, 10);
    }
    this.props.db.collection('tasks').get().then(snapshot => {
      const list = [];
      snapshot.forEach(taskDoc => {
        const task = taskDoc.data();
        if (task.isInitial) {
          list.push(this.prepareListItem(task));
        }
      });
      this.setState({ list });
      this.incrementClock();
    });
    setTimeout(() => this.setState({ firstLoad: false }), 5000);
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
    }, this.gameHourLength * CLOCK_INCREMENT_INTERVAL_HOURS);
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
            }, spawn.age * this.gameHourLength);
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
            return Object.assign({}, doc.data(), {isInitial: false});
          });
        setTimeout(() => {
          this.setState({
            list: this.state.list
                    .concat(this.prepareListItem(spawnedItem, true))
          });
        }, taskToSpawn.delay * this.gameHourLength);
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
  
  handleSettingsClick = () => {
    this.setState({ settingsVisible: !this.state.settingsVisible });
  }
  
  render() {
    const classes = ['main-container'];
    classes.push('palette-' + this.state.palette);
    const settingsContainer = this.state.settingsVisible && (
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
    );
    return (
      <div className={classes.join(' ')}>
        <div className="status-box">
          <div className="todo-header">
            <div className="toolbar">
              <button className="settings-button" onClick={this.handleSettingsClick}>
                <FontAwesomeIcon icon={faCog} size="2x" />
              </button>
            </div>
            {settingsContainer}
          </div>
          <div>
            <Title />
            <Clock time={this.state.time} />
          </div>
        </div>
        <ListBox list={this.state.list} onDone={this.handleDone} firstLoad={this.state.firstLoad} />
        {this.state.list.length === 0 && <div className="loading-container"><span className="loading-text">loading</span></div>}
      </div>
    );
  }
}

export default Main;