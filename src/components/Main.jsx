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
  CLOCK_INCREMENT_INTERVAL_HOURS
} from '../data/constants';
import { getQueryParams } from '../utils';
import { GAME_SPEED } from '../data/constants';

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.lastId = 0;
    const params = getQueryParams();
    this.state = {
      gameHourLength: GAME_HOUR_LENGTH,
      gamesList: [],
      list: [],
      initialTasks: [],
      time: new Date(2018, 0, 1, 8),
      timers: {},
      params,
      firstLoad: true,
      isStarted: false,
      tasksCollection: 'tasks-' + (params.source || 'default')
    };
  }
  
  componentDidMount() {
    if (this.state.params.hourlength) {
      this.setState({ gameHourLength: parseInt(this.state.params.hourlength, 10) });
    }
    this.props.db.collection("gameslist").get().then(snapshot => {
      this.setState({
        gamesList: snapshot.docs.map(
          doc => Object.assign(doc.data(), { id: doc.id }))
      });
    });
    this.props.db.collection(this.state.tasksCollection).get().then(snapshot => {
      const list = [];
      snapshot.forEach(taskDoc => {
        const task = taskDoc.data();
        if (task.isInitial) {
          list.push(task);
          // list.push(this.prepareListItem(task));
        }
      });
      this.setState({ initialTasks: list });
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
    }, this.state.gameHourLength * CLOCK_INCREMENT_INTERVAL_HOURS);
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
        this.props.db.collection(this.state.tasksCollection)
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
            }, spawn.age * this.state.gameHourLength);
            const timeoutIds = this.state.timers[id] || [];
            timeoutIds.push(timeoutId);
            this.setState({
              timers: Object.assign({}, this.state.timers, {[id]: timeoutIds})
            });
          });
      });
    }
    if (item.special === 'ending1') {
      setTimeout(() => {
        this.setState({
          list: [],
          endingMessage: "They came for you."
        });
      }, 24 * this.state.gameHourLength);
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
        const spawnedItem = await this.props.db.collection(this.state.tasksCollection)
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
        }, taskToSpawn.delay * this.state.gameHourLength);
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
  
  handleGameSelect = (e, game) => {
    this.setState({ tasksCollection: 'tasks-' + game.name });
  }
  
  render() {
    const classes = ['main-container'];
    classes.push('palette-' + this.props.palette);
    const settingsContainer = this.state.settingsVisible && (
      <div className="settings-container">
        <div className="settings-palette-row">
          <div className="palette-description">themes</div>
          {PALETTES.map((paletteId) => (
            <button
              key={paletteId}
              onClick={() => this.props.setPalette(paletteId)}
              className={'palette-button palette-' + paletteId + (paletteId === this.props.palette ? ' selected' : '')}
            >
              {paletteId}
            </button>
          ))}
        </div>
        <div className="settings-game-row">
          <div className="palette-description">choose game</div>
          <div className="game-buttons-container">
            {this.state.gamesList.map((game) => (
              <a
                key={game.id}
                href={"/?source=" + game.name}
                className={'game-name'
                  + (this.state.tasksCollection === 'tasks-'+ game.name ? ' selected' : '')}>
                {game.name}
              </a>
            ))}
          </div>
        </div>
        <div className="settings-game-row">
          <div className="palette-description">speed</div>
          <div className="speed-buttons-container">
            {Object.keys(GAME_SPEED).map((speedKey) => (
              <button
                key={speedKey}
                onClick={() => this.setState({ gameHourLength: GAME_SPEED[speedKey] })}
                className={'speed-name'
                  + (this.state.gameHourLength === GAME_SPEED[speedKey] ? ' selected' : '')}>
                {speedKey.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
    const isLoading = this.state.list.length === 0 && this.state.firstLoad;
    const allTasksDone = this.state.list.length === 0 && this.state.isStarted;
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
        {isLoading && (
          <div className="loading-container">
            <span className="loading-text">loading</span>
          </div>
        )}
        {!isLoading && !this.state.isStarted && (
          <div className="start-container" onClick={() => {
            this.setState({
              isStarted: true,
              list: this.state.initialTasks.map(task => this.prepareListItem(task))
            });
            this.incrementClock();
          }}>
            start
          </div>
        )}
        {this.state.isStarted && (
          <ListBox
            list={this.state.list}
            onDone={this.handleDone}
            firstLoad={this.state.firstLoad}
          />
        )}
        <div className="ending-message" style={this.state.endingMessage ? { opacity: 1, display: 'block' } : {}}>
          {this.state.endingMessage}
        </div>
        <div
          className={"no-tasks-message"}
          style={allTasksDone ? { opacity:1 } : {}}
        >
          No more tasks.
        </div>
      </div>
    );
  }
}

export default Main;