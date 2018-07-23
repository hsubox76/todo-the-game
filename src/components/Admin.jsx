import React from 'react';
import firebase from 'firebase/app';
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
        this.props.db.collection('tasks').doc(id).update(this.state.updates).then(() => {
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
        const field = type === 'spawnsOnDone' ? 'delay' : 'age';
        list[index][field] = DAY * parseInt(e.target.value, 10);
        this.setState({
            updates: Object.assign({}, this.state.updates, {
                [type]: list
            })
        });
    }
    onRemoveSpawn = (e, type, task, index) => {
        let newList;
        if (task[type].length === 1) {
            newList = null;
        } else {
            newList = task[type].slice(0, index).concat(task[type.slice(index + 1)]);
        }
        const taskIndex = this.state.tasks.findIndex(t => t.taskId === task.taskId);
        const newTasks = this.state.tasks.slice(0, taskIndex)
            .concat(Object.assign({}, task, {[type]: newList}))
            .concat(this.state.tasks.slice(taskIndex + 1));
        this.setState({
            updates: Object.assign({}, this.state.updates, {
                [type]: newList
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
    renderSpawns = (task, isEditable, type = 'spawnsOnDone') => {
        const spawnBoxes = task[type] ? task[type].map((spawn, index) => {
            const spawnTask = this.state.tasks.find(task => task.taskId === spawn.taskId);
            const displayText = spawnTask ? spawnTask.description.substring(0, 20) : spawn.taskId;
            let timeElement = null;
            let removeButton = null;
            const label = type === 'spawnsOnDone' ? 'Delay:' : 'Age:';
            const field = type === 'spawnsOnDone' ? 'delay' : 'age';
            if (isEditable) {
                timeElement = (
                    <div>
                        Delay:
                        {isEditable ? (
                            <input
                                className="input-day"
                                name={"spawn-delay-" + task.taskId + '-' + spawn.taskId}
                                defaultValue={spawn[field] / DAY}
                                onChange={(e) => this.onDaysChange(e, type, task[type], index)}
                            />
                        ) : (
                            <span>{spawn[field] / DAY}</span>
                        )}
                        days
                    </div>
                );
                removeButton = (
                    <div className="remove-button" onClick={e => this.onRemoveSpawn(e, type, task, index)}>remove</div>
                );
            } else {
                timeElement = (
                    <div>
                        {label}
                        {spawn[field] / DAY}
                        days
                    </div>
                );
            }
            
            return (
                <div
                    key={task.taskId + '-' + spawn.taskId}
                    className="spawn-box"
                >
                    <div onClick={() => this.onClickSpawn(task.taskId, spawn.taskId)}>{displayText}</div>
                    {timeElement}
                    {removeButton}
                </div>
            )
        }): [];
        if (isEditable) {
            spawnBoxes.push(
                <div
                    key={task.taskId + '-new'}
                    className="spawn-box"
                >
                    add
                </div>
            );
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
                if (this.state.updates) {
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
                    <div className="form-row">
                        <label>Spawns On Done:</label>
                        {this.renderSpawns(task, isEditable, 'spawnsOnDone')}
                    </div>
                    <div className="form-row">
                        <label>Spawns On Age:</label>
                        {this.renderSpawns(task, isEditable, 'spawnsOnAge')}
                    </div>
                    <div className="form-row">
                        <button>{isEditable ? 'update' : 'edit'}</button>
                        {isEditable && <div className="cancel-button" onClick={() => this.setState({ taskIdBeingEdited: null })}>cancel</div>}
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