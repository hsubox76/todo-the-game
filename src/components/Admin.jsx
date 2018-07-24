import React from 'react';
import firebase from 'firebase/app';
import { SPAWN_TYPE, FIRESTORE_COLLECTION } from '../data/constants';
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
                this.props.db.collection(FIRESTORE_COLLECTION.TASKS).onSnapshot(snapshot => {
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
    onCopyToBackup = () => {
        this.props.db.collection(FIRESTORE_COLLECTION.TASKS).get().then(snapshot => {
            snapshot.forEach(task => {
               this.props.db.collection(FIRESTORE_COLLECTION.TASKS_BACKUP).doc(task.id).set(task.data()); 
            });
        });
    }
    onUpdateTask = (id) => {
        const updates = this.state.updates || {};
        updates.isVisible = true;
        if (this.state.spawnToAdd) {
            const spawn = this.state.spawnToAdd;
            const taskIndex = spawn.taskIndex;
            updates[spawn.type.name] = this.state.tasks[taskIndex][spawn.type.name] || [];
            const newSpawnItem = {[spawn.type.timeField]: spawn.days * DAY};
            newSpawnItem.taskId = spawn.id;
            if (spawn.type.name === SPAWN_TYPE.ON_AGE.name) {
                newSpawnItem.killParent = spawn.killParent
            }
            //TODO: handle create
            updates[spawn.type.name].push(newSpawnItem);
        }
        if (id === 'new') {
            updates.taskId = this.props.db.collection(FIRESTORE_COLLECTION.TASKS).doc().id;
            if (updates.spawnsOnDone) {
                updates.spawnsOnDone.forEach(spawnedTask => {
                    if (spawnedTask.taskId === 'new') {
                        spawnedTask.taskId = updates.taskId;
                    }
                });
            }
            if (updates.spawnsOnAge) {
                updates.spawnsOnAge.forEach(spawnedTask => {
                    if (spawnedTask.taskId === 'new') {
                        spawnedTask.taskId = updates.taskId;
                    }
                });
            }
            updates.createdAt = Date.now();
            this.props.db.collection(FIRESTORE_COLLECTION.TASKS).doc(updates.taskId).set(updates).then(() => {
               this.setState({ updates: null, taskIdBeingEdited: null });
            });
        } else {
            this.props.db.collection(FIRESTORE_COLLECTION.TASKS).doc(id).update(updates).then(() => {
               this.setState({ updates: null, taskIdBeingEdited: null });
            });
        }
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
        const task = this.state.tasks.find(t => t.taskId === this.state.taskIdBeingEdited);
        if (task.description === e.target.value) {
            let descRemoved = Object.assign({}, this.state.updates);
            delete descRemoved.description;
            if (Object.keys(descRemoved).length === 0) {
                descRemoved = null;
            }
            this.setState({
                updates: descRemoved
            });
            return;
        }
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
    onCreateClick = () => {
        const newTask = {
            taskId: 'new',
            description: 'new task',
            isVisible: true
        };
        this.setState({
            spawnToAdd: null,
            taskIdBeingEdited: 'new',
            tasks: [newTask].concat(this.state.tasks),
            updates: { description: 'new task' }
        });
    }
    // commit adding new spawn to task (don't hit firebase yet, just add to updates)
    onCommitClick = (e) => {
        e.preventDefault();
        const updates = this.state.updates || {};
        const spawn = this.state.spawnToAdd;
        const taskIndex = spawn.taskIndex;
        updates[spawn.type.name] = this.state.tasks[taskIndex][spawn.type.name] || [];
        const newSpawnItem = {[spawn.type.timeField]: spawn.days * DAY};
        newSpawnItem.taskId = spawn.id;
        if (spawn.type.name === SPAWN_TYPE.ON_AGE.name) {
            newSpawnItem.killParent = spawn.killParent
        }
        //TODO: handle create
        updates[spawn.type.name].push(newSpawnItem);
        const newTasks = this.state.tasks.slice(0, taskIndex)
            .concat(Object.assign({}, this.state.tasks[taskIndex], {[spawn.type.name]: updates[spawn.type.name]}))
            .concat(this.state.tasks.slice(taskIndex + 1));
        this.setState({
            tasks: newTasks,
            updates,
            spawnToAdd: null
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
    onClickSpawn = (oldId, spawnId, toSpawn = true) => {
        if (oldId === spawnId) {
            return;
        }
        this.setState({
            tasks: this.state.tasks.map(task => {
               if (task.taskId === oldId) {
                   return Object.assign({}, task, {isVisible: false});
               } else if (task.taskId === spawnId) {
                   const propsToAdd = {isVisible: true};
                   if (toSpawn) {
                       propsToAdd.parentId = oldId;
                   }
                   return Object.assign({}, task, propsToAdd);
               }
               return task;
            })
        });
    }
    populateFirebaseFromLocal = () => {
        const idMap = {};
        TASKS.forEach(task => {
            idMap[task.taskId] = this.props.db.collection(FIRESTORE_COLLECTION.TASKS).doc().id;
            task.createdAt = Date.now();
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
            this.props.db.collection(FIRESTORE_COLLECTION.TASKS).doc(task.taskId).set(task);
        });
    }
    renderSpawns = (task, isEditable, type = SPAWN_TYPE.ON_DONE) => {
        const spawnBoxes = task[type.name] ? task[type.name].map((spawn, index) => {
            const spawnTask = this.state.tasks.find(task => task.taskId === spawn.taskId);
            let displayText = spawnTask ? spawnTask.description.substring(0, 30) : spawn.taskId;
            if (spawn.taskId === task.taskId) {
                displayText = '(self)';
            }
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
                    key={task.taskId + '-' + spawn.taskId + '-' + index}
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
                const killParentElement = type.name === SPAWN_TYPE.ON_AGE.name && (
                    <div>
                        <span className="spawn-label">Kill parent on spawn:</span>
                        <input
                            type="checkbox"
                            checked={this.state.spawnToAdd.killParent}
                            onChange={(e) => this.setState({ spawnToAdd: Object.assign({}, this.state.spawnToAdd, {killParent: e.target.checked})})}
                        />
                    </div>
                );
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
                        {/* this is going to be a pain
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
                        */}
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
                                value={this.state.spawnToAdd.id === task.taskId ? '' : this.state.spawnToAdd.id}
                                placeholder="(self)"
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
                        {killParentElement}
                        <div className="new-spawn-button-row">
                            <button
                                type="nosubmit"
                                className="commit-spawn-button"
                                onClick={this.onCommitClick}
                            >
                                add it
                            </button>
                            <button
                                type="nosubmit"
                                className="cancel-button"
                                onClick={() => this.setState({ spawnToAdd: null })}
                            >
                                cancel
                            </button>
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
                        <span className='symbol'>+</span> add {type.class} spawn
                    </div>
                );
            }
        }
        return spawnBoxes;
    }
    renderTaskList = () => {
        return this.state.tasks
            .map(task => {
                if (!task.isVisible) {
                    return null;
                }
                const classes = ['task-edit-box'];
                const isEditable = task.taskId === this.state.taskIdBeingEdited;
                let descriptionEl = <div className="description-text">{task.description}</div>;
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
                let parentLink = null;
                if (task.parentId) {
                    const parentDesc = this.state.tasks.find(t => t.taskId === task.parentId).description;
                    parentLink = (
                        <div className="parent-link" onClick={() => this.onClickSpawn(task.taskId, task.parentId, false)}>back to "{parentDesc}"</div>
                    );
                }
                const disableButtons = !!this.state.spawnToAdd;
                const disableUpdate = isEditable && !this.state.updates;
                return (
                    <form className={classes.join(' ')} key={task.taskId} onSubmit={(e) => this.onEditTask(e, task.taskId)}>
                        {parentLink}
                        <div>{task.taskId === 'new' ? 'Create New Task' : ('ID: ' + task.taskId)}</div>
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
                            <button
                                className={disableButtons || disableUpdate ? 'disabled' : ''}
                                disabled={disableButtons || disableUpdate}
                            >
                                {isEditable ? 'update' : 'edit'}
                            </button>
                            {isEditable &&
                                <button
                                    type="nosubmit"
                                    className={"cancel-button" + (disableButtons ? ' disabled' : '')}
                                    disabled={disableButtons}
                                    onClick={() => this.setState({ updates: null, spawnToAdd: null, taskIdBeingEdited: null })}
                                >
                                    cancel
                                </button>}
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
              <button onClick={this.onCopyToBackup}>copy current to backup</button>
              <button onClick={this.onCreateClick}>create new task</button>
              {this.state.tasks && this.renderTaskList()}
          </div>
        );
        
    }
}

export default Admin;