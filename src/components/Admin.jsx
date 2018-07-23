import React from 'react';
import firebase from 'firebase/app';
import { SPAWN_TYPE } from '../data/constants';
import { DAY, TASKS, INITIAL_TASK_IDS } from '../data/tasks';
import '../styles/admin.css';

const UI_CONFIG = {
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // User successfully signed in.
        // Return type determines whether we continue the redirect automatically
        // or whether we leave that to developer to handle.
        return true;
      },
      uiShown: function() {
        // The widget is rendered.
        // Hide the loader.
        document.getElementById('loader').style.display = 'none';
      }
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    signInSuccessUrl: '/?admin',
    signInOptions: [
      // List of OAuth providers supported.
      firebase.auth.GoogleAuthProvider.PROVIDER_ID
    ],
    // Other config options...
};

class Admin extends React.Component {
    constructor() {
        super();
        this.state = { user: null, loading: true, updates: null };
    }
    componentDidMount() {
        firebase.auth().onAuthStateChanged((user) => {
            this.setState({ loading: false });
            if (user) {
                this.setState({ user });
                this.props.db.collection('tasks').onSnapshot(snapshot => {
                    const tasks = [];
                    snapshot.forEach(task => {
                        tasks.push(Object.assign({taskId: task.id, isVisible: task.data().isInitial}, task.data()))
                    });
                    this.setState({ tasks });
                });
            } else {
                this.setState({ user: null });
                this.props.ui.start('#firebaseui-auth-container', UI_CONFIG);
            }
        });
    }
    onUpdateTask = (id) => {
        const updates = this.state.updates || {};
        if (this.state.spawnToAdd) {
            const spawn = this.state.spawnToAdd;
            const taskIndex = spawn.taskIndex;
            updates[spawn.type.name] = this.state.tasks[taskIndex][spawn.type.name] || [];
            const newSpawnItem = { [spawn.type.timeField]: spawn.days * DAY };
            newSpawnItem.taskId = spawn.id;
            if (spawn.type.name === SPAWN_TYPE.ON_AGE.name) {
                newSpawnItem.killParent = spawn.killParent
            }
            // put other cases here
            updates[spawn.type.name].push(newSpawnItem);
        }
        this.props.db.collection('tasks').doc(id).update(updates).then(() => {
           this.setState({ updates: null, taskIdBeingEdited: null }); 
        });
    }
    onEditTask = (e, id) => {
        e.preventDefault();
        if (id === this.state.taskIdBeingEdited) {
            this.onUpdateTask(id);
        } else {
            this.setState({ taskIdBeingEdited: id });
        }
    }
    onDescriptionChange = (e) => {
        this.setState({
            updates: Object.assign({}, this.state.updates, {
                description: e.target.value
            })
        });
    }
    onDaysChange = (e, type, list, index) => {
        list[index][type.timeField] = DAY * parseInt(e.target.value, 10);
        this.setState({
            updates: Object.assign({}, this.state.updates, {
                [type.name]: list
            })
        });
    }
    onKillParentChange = (e, type, list, index) => {
        list[index].killParent = e.target.checked;
        this.setState({
            updates: Object.assign({}, this.state.updates, {
                [type.name]: list
            })
        });
    }
    onAddClick = (type, task) => {
        const taskIndex = this.state.tasks.findIndex(t => t.taskId === task.taskId);
        this.setState({
            spawnToAdd: {
                taskId: task.taskId,
                taskIndex,
                type,
                method: 'copy',
                days: 1,
                id: task.taskId,
                killParent: true
            }
        });
    }
    onNewSpawnMethodChange = (e) => {
        const method = e.target ? e.target.value : e;
        this.setState({
            spawnToAdd: Object.assign({}, this.state.spawnToAdd, { method })
        });
    }
    onRemoveSpawn = (e, type, task, index) => {
        let newList;
        if (task[type.name].length === 1) {
            newList = null;
        } else {
            newList = task[type.name].slice(0, index).concat(task[type.name].slice(index + 1));
        }
        const taskIndex = this.state.tasks.findIndex(t => t.taskId === task.taskId);
        const newTasks = this.state.tasks.slice(0, taskIndex)
            .concat(Object.assign({}, task, {[type.name]: newList}))
            .concat(this.state.tasks.slice(taskIndex + 1));
        this.setState({
            updates: Object.assign({}, this.state.updates, {
                [type.name]: newList
            }),
            tasks: newTasks
        });
    }
    onClickSpawn = (oldId, spawnId) => {
        //TODO: Leave a link back to the parent!
        this.setState({
            tasks: this.state.tasks.map(task => {
               if (task.taskId === oldId) {
                   return Object.assign({}, task, {isVisible: false});
               } else if (task.taskId === spawnId) {
                   return Object.assign({}, task, {isVisible: true});
               }
               return task;
            })
        });
    }
    populateFirebaseFromLocal = () => {
        const idMap = {};
        TASKS.forEach(task => {
            idMap[task.taskId] = this.props.db.collection('tasks').doc().id;
        });
        TASKS.forEach(task => {
            if (INITIAL_TASK_IDS.includes(task.taskId)) {
                task.isInitial = true;
            }
            if (task.spawnsOnDone) {
                task.spawnsOnDone.forEach(spawnedTask => {
                   spawnedTask.taskId = idMap[spawnedTask.taskId]; 
                });
            }
            if (task.spawnsOnAge) {
                task.spawnsOnAge.forEach(spawnedTask => {
                   spawnedTask.taskId = idMap[spawnedTask.taskId]; 
                });
            }
            task.taskId = idMap[task.taskId];
            this.props.db.collection('tasks').doc(task.taskId).set(task);
        });
    }
    renderSpawns = (task, isEditable, type = SPAWN_TYPE.ON_DONE) => {
        const spawnBoxes = task[type.name] ? task[type.name].map((spawn, index) => {
            const spawnTask = this.state.tasks.find(task => task.taskId === spawn.taskId);
            const displayText = spawnTask ? spawnTask.description.substring(0, 30) : spawn.taskId;
            let timeElement = null;
            let removeButton = null;
            if (isEditable) {
                timeElement = (
                    <div>
                        <span className='spawn-label'>{type.timeField + ': '}</span>
                        {isEditable ? (
                            <input
                                className="input-day"
                                type="number"
                                name={"spawn-delay-" + task.taskId + '-' + spawn.taskId}
                                defaultValue={spawn[type.timeField] / DAY}
                                onChange={(e) => this.onDaysChange(e, type, task[type.name], index)}
                            />
                        ) : (
                            <span>{spawn[type.timeField] / DAY}</span>
                        )}
                        <span className='spawn-timeunit'>days</span>
                    </div>
                );
                removeButton = (
                    <div className="div-button remove-button" onClick={e => this.onRemoveSpawn(e, type, task, index)}>remove</div>
                );
            } else {
                timeElement = (
                    <div>
                        <span className='spawn-label'>{type.timeField + ': '}</span>
                        <span className='spawn-timespan'>{spawn[type.timeField] / DAY}</span>
                        <span className='spawn-timeunit'>days</span>
                    </div>
                );
            }
            
            let killParentElement = null;
            if (type.name === SPAWN_TYPE.ON_AGE.name) {
                let statusIndicator = spawn.killParent ? 'yes' : 'no';
                if (isEditable) {
                    statusIndicator = (
                        <input
                            type="checkbox"
                            checked={spawn.killParent}
                            onChange={(e) => this.onKillParentChange(e, type, task[type.name], index)}
                        />
                    );
                }
                killParentElement = (
                    <div>Kills parent? {statusIndicator}</div>
                );
            }
            const classes = ['spawn-box', 'spawn-box-' + type.class];
            return (
                <div
                    key={task.taskId + '-' + spawn.taskId}
                    className={classes.join(' ')}
                >
                    <div className="task-link" onClick={() => this.onClickSpawn(task.taskId, spawn.taskId)}>{displayText}</div>
                    {timeElement}
                    {killParentElement}
                    {removeButton}
                </div>
            );
        }): [];
        if (isEditable) {
            if (this.state.spawnToAdd && this.state.spawnToAdd.taskId === task.taskId && this.state.spawnToAdd.type === type) {
                const currentMethod = this.state.spawnToAdd && this.state.spawnToAdd.method;
                spawnBoxes.push(
                    <div
                        key={task.taskId + '-new'}
                        className="new-spawn-form"
                    >
                        <div className="check-row">
                            <input
                                type="radio"
                                name="new-spawn-type"
                                value="copy"
                                onChange={this.onNewSpawnMethodChange}
                                checked={currentMethod === 'copy'}
                            />
                            spawn copy
                        </div>
                        <div className="check-row">
                            <input
                                type="radio"
                                name="new-spawn-type"
                                value="new"
                                onChange={this.onNewSpawnMethodChange}
                                checked={currentMethod === 'new'}
                            />
                            create new
                        </div>
                        <div className="check-row">
                            <input
                                type="radio"
                                name="new-spawn-type"
                                value="id"
                                onChange={this.onNewSpawnMethodChange}
                                checked={currentMethod === 'id'}
                            />
                            select existing (enter id)
                            <input
                                className="input-id"
                                value={this.state.spawnToAdd.id === task.taskId ? '(self)' : this.state.spawnToAdd.id}
                                onFocus={() => this.onNewSpawnMethodChange('id')}
                                onChange={(e) => this.setState({ spawnToAdd: Object.assign({}, this.state.spawnToAdd, {id: e.target.value})})}
                            />
                        </div>
                        <div>
                            <span className="spawn-label">spawn after {type.timeField}:</span>
                            <input
                                className="input-day"
                                type="number"
                                value={this.state.spawnToAdd.days}
                                onChange={(e) => this.setState({ spawnToAdd: Object.assign({}, this.state.spawnToAdd, {days: parseInt(e.target.value, 10)})})}
                            />
                            <span className='spawn-timeunit'>days</span>
                        </div>
                        <div>
                            <span className="spawn-label">Kill parent on spawn:</span>
                            <input
                                type="checkbox"
                                checked={this.state.spawnToAdd.killParent}
                                onChange={(e) => this.setState({ spawnToAdd: Object.assign({}, this.state.spawnToAdd, {killParent: e.target.checked})})}
                            />
                        </div>
                    </div>
                );
            } else {
                spawnBoxes.push(
                    <div
                        key={task.taskId + '-new'}
                        className="div-button add-button"
                        onClick={() => this.onAddClick(type, task)}
                    >
                        add task to spawn on {type.class}
                    </div>
                );
            }
        }
        return spawnBoxes;
    }
    renderTaskList = () => {
        return this.state.tasks.map(task => {
            if (!task.isVisible) {
                return null;
            }
            const classes = ['task-edit-box'];
            const isEditable = task.taskId === this.state.taskIdBeingEdited;
            let descriptionEl = <div>{task.description}</div>;
            if (isEditable) {
                descriptionEl = (<textarea
                            name="description"
                            rows="3"
                            defaultValue={task.description}
                            onChange={this.onDescriptionChange}
                        />);
                if (this.state.updates || this.state.spawnToAdd) {
                    classes.push('dirty');
                }
            }
            return (
                <form className={classes.join(' ')} key={task.taskId} onSubmit={(e) => this.onEditTask(e, task.taskId)}>
                    <div>ID: {task.taskId}</div>
                    <div className="form-row">
                        <input name="taskId" type="hidden" value={task.taskId}/>
                    </div>
                    <div className="form-row">
                        <label htmlFor="description">Description:</label>
                        {descriptionEl}
                    </div>
                    <div className="form-row stack">
                        <label>Spawns On Done:</label>
                        {this.renderSpawns(task, isEditable, SPAWN_TYPE.ON_DONE)}
                    </div>
                    <div className="form-row stack">
                        <label>Spawns On Age:</label>
                        {this.renderSpawns(task, isEditable, SPAWN_TYPE.ON_AGE)}
                    </div>
                    <div className="form-row">
                        <button>{isEditable ? 'update' : 'edit'}</button>
                        {isEditable && <div className="div-button cancel-button" onClick={() => this.setState({ updates: null, spawnToAdd: null, taskIdBeingEdited: null })}>cancel</div>}
                    </div>
                </form>
              );
        });
    }
    render() {
        if (this.state.loading) {
            return (
              <div className="admin-container">
                  loading
              </div>
            );
        }
        if (!this.state.user) {
            return (
              <div className="admin-container">
                  <div id="firebaseui-auth-container"></div>
                  <div id="loader">Loading...</div>
              </div>
            );
        }
        return (
          <div className="admin-container">
              <button onClick={this.populateFirebaseFromLocal}>init firebase from local defaults</button>
              {this.state.tasks && this.renderTaskList()}
          </div>
        );
        
    }
}

export default Admin;