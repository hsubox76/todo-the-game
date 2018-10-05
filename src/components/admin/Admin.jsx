import React from 'react';
import firebase from 'firebase/app';
import { SPAWN_TYPE } from '../../data/constants';
import { DAY, TASKS, INITIAL_TASK_IDS } from '../../data/tasks';
import '../../styles/admin.css';
import TaskBox from './TaskBox';
import EditBox from './EditBox';
import SpawnListEditable from './SpawnListEditable';
import { getQueryParams } from '../../utils';

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
  ]
};

class Admin extends React.Component {
  constructor() {
    super();
    const params = getQueryParams();
    this.state = {
      gamesList: [],
      user: null,
      loading: true,
      updates: null,
      pathMode: false,
      tasksCollection: 'tasks-' + (params.source || 'default')
    };
  }
  componentDidMount() {
    firebase.auth().onAuthStateChanged((user) => {
      this.setState({ loading: false });
      if (user) {
        this.setState({ user });
        this.props.db.collection("gameslist").get().then(snapshot => {
          this.setState({
            gamesList: snapshot.docs.map(
              doc => Object.assign(doc.data(), { id: doc.id }))
          });
        });
        this.props.db.collection(this.state.tasksCollection).onSnapshot(snapshot => {
          const tasks = [];
          snapshot.forEach(task => {
            const isVisible = task.data().isInitial || (Date.now() - task.data().createdAt < 10000);
            tasks.push(Object.assign({taskId: task.id, isVisible}, task.data()));
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
    this.props.db.collection(this.state.tasksCollection).get().then(snapshot => {
      snapshot.forEach(task => {
         this.props.db.collection(this.state.tasksCollection + "_BACKUP").doc(task.id).set(task.data()); 
      });
    });
  }
  onUpdateTask = (id) => {
    const updates = this.state.updates || {};
    let spawnsToCreate = [];
    if (updates[SPAWN_TYPE.ON_AGE.name]) {
      spawnsToCreate = spawnsToCreate.concat(updates[SPAWN_TYPE.ON_AGE.name]);
    }
    if (updates[SPAWN_TYPE.ON_DONE.name]) {
      spawnsToCreate = spawnsToCreate.concat(updates[SPAWN_TYPE.ON_DONE.name]);
    }
    spawnsToCreate = spawnsToCreate
      .filter(spawn => spawn.taskId === 'new')
      .map(spawn => {
        spawn.taskId = this.props.db.collection(this.state.tasksCollection).doc().id;
        return {
          taskId: spawn.taskId,
          description: spawn.description,
          createdAt: Date.now()
        };
      });
    if (id === 'new') {
      updates.taskId = this.props.db.collection(this.state.tasksCollection).doc().id;
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
      this.props.db.collection(this.state.tasksCollection).doc(updates.taskId).set(updates).then(() => {
         this.setState({ updates: null, taskIdBeingEdited: null });
      });
    } else {
      this.props.db.collection(this.state.tasksCollection).doc(id).update(updates).then(() => {
         this.setState({ updates: null, taskIdBeingEdited: null });
      });
    }
    spawnsToCreate.forEach(spawnToCreate => {
      this.props.db.collection(this.state.tasksCollection).doc(spawnToCreate.taskId).set(spawnToCreate);
    });
  }
  onDeleteTask = (e, id) => {
    e.preventDefault();
    this.props.db.collection(this.state.tasksCollection).doc(id).delete();
    this.setState({
      tasks: this.state.tasks
        .filter(task => task.taskId !== id)
        .map(task => {
          const onAgeList = task[SPAWN_TYPE.ON_AGE.name] || [];
          const onDoneList = task[SPAWN_TYPE.ON_DONE.name] || [];
          const updates = {};
          updates[SPAWN_TYPE.ON_AGE.name] = onAgeList.filter(spawn => spawn.taskId !== id);
          updates[SPAWN_TYPE.ON_DONE.name] = onDoneList.filter(spawn => spawn.taskId !== id);
          if (onAgeList.length === updates[SPAWN_TYPE.ON_AGE.name].length
              && onDoneList.length === updates[SPAWN_TYPE.ON_DONE.name].length) {
              return task;
          }
          this.props.db.collection(this.state.tasksCollection).doc(task.taskId).update(updates);
          return Object.assign({}, task, updates);
          
        })
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
  onNewSpawnInputChange = (e, type, updates) => {
    this.setState({
      spawnToAdd: Object.assign({}, this.state.spawnToAdd, updates)
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
  onCancelClick = (task) => {
    this.setState({
      updates: null,
      spawnToAdd: null,
      taskIdBeingEdited: null,
      tasks: task.taskId === 'new' ? this.state.tasks.slice(1) : this.state.tasks
    });
  }
  onCancelSpawnClick = () => {
    this.setState({
      spawnToAdd: null
    });
  }
  onCreateClick = () => {
    const newTask = {
      taskId: 'new',
      description: 'new task',
      isVisible: false
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
    if (spawn.method === 'new') {
      newSpawnItem.taskId = 'new';
      newSpawnItem.description = spawn.description;
    }
    if (spawn.type.name === SPAWN_TYPE.ON_AGE.name) {
      newSpawnItem.killParent = spawn.killParent
    }
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
    if (method === 'new') {
      this.setState({
        spawnToAdd: Object.assign({}, this.state.spawnToAdd, {
          method,
          description: ''
        })
      });
    } else {
      const noDescSpawn = Object.assign({}, this.state.spawnToAdd, { method });
      noDescSpawn.description = undefined;
      this.setState({
        spawnToAdd: noDescSpawn
      });
    }
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
  onClickSpawn = (oldId, spawnId, type, toSpawn = true) => {
    if (oldId === spawnId) {
      return;
    }
    if (this.state.pathChain) {
      const lastId = this.state.pathChain[this.state.pathChain.length - 1].task.taskId;
      if (lastId !== oldId) {
        return;
      }
      const task = this.state.tasks.find(task => task.taskId === spawnId);
      this.setState({ pathChain: this.state.pathChain.concat({ task, type }) });
    } else {
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
  }
  populateFirebaseFromLocal = () => {
    const idMap = {};
    const tasksCollection = this.props.db.collection(this.state.tasksCollection);
    tasksCollection
      .get()
      .then(snapshot => {
        const deletePromises = [];
        snapshot.forEach(doc => {
          deletePromises.push(tasksCollection.doc(doc.data().taskId).delete());
        });
        return Promise.all(deletePromises);
      })
      .then(() => {
        TASKS.forEach(task => {
          idMap[task.taskId] = tasksCollection.doc().id;
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
          tasksCollection.doc(task.taskId).set(task);
        });
      });
  }
  onSetPath = (e, id) => {
    e.preventDefault();
    this.setState({ pathChain: [{task: this.state.tasks.find(task => task.taskId === id)}] });
  }
  onToggleShowAll = () => {
    this.setState({ showAll: !this.state.showAll });
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
    const taskBeingEdited = this.state.tasks && this.state.tasks.find(task => task.taskId === this.state.taskIdBeingEdited);
    
    let taskList;
    if (this.state.pathChain) {
      taskList = (
        <div className="tasks-container single-column">
          {this.state.pathChain.map(({task, type}) => {
            return (
                <TaskBox
                  key={task.taskId}
                  task={task}
                  classList={[type || 'path-chain-top']}
                  selected={task.taskId === this.state.taskIdBeingEdited}
                  tasks={this.state.tasks}
                  disableButtons={!!this.state.spawnToAdd}
                  onClickSpawn={this.onClickSpawn}
                  onEditTask={this.onEditTask}
                  onDeleteTask={this.onDeleteTask}
                  onSetPath={this.onSetPath}
                />
              );
            }
          )}
        </div>
      );
    } else if (this.state.tasks) {
      taskList = (
        <div className="tasks-container">
          {this.state.tasks
            .filter(task => this.state.showAll || task.isVisible)
            .map(task => (
              <TaskBox
                key={task.taskId}
                task={task}
                selected={task.taskId === this.state.taskIdBeingEdited}
                tasks={this.state.tasks}
                disableButtons={!!this.state.spawnToAdd}
                onClickSpawn={this.onClickSpawn}
                onEditTask={this.onEditTask}
                onDeleteTask={this.onDeleteTask}
                onSetPath={this.onSetPath}
              />
            )
          )}
        </div>
      );
    }
    return (
      <div className="admin-container">
        <div className="global-buttons">
          <button onClick={this.populateFirebaseFromLocal}>init firebase from local defaults</button>
          <button onClick={this.onCopyToBackup}>copy current to backup</button>
          <button onClick={this.onToggleShowAll}>show {this.state.showAll ? 'visible' : 'all'}</button>
          {this.state.pathChain && <button onClick={() => this.setState({ pathChain: null })}>reset view</button>}
          <div className="games-list">
            <span>games:</span>
            {this.state.gamesList.map((game) => (
              <a
                key={game.id}
                href={"/?admin=true&source=" + game.name}
                className={'game-name' + (this.state.tasksCollection === 'tasks-' + game.name ? ' selected' : '')}>
                {game.name}
              </a>
            ))}
          </div>
        </div>
        <EditBox
          task={taskBeingEdited}
          disableButtons={!!this.state.spawnToAdd}
          disableUpdate={!this.state.updates}
          isDirty={this.state.updates || this.state.spawnToAdd}
          onCancelClick={this.onCancelClick}
          onCreateClick={this.onCreateClick}
          onDescriptionChange={this.onDescriptionChange}
          onEditTask={this.onEditTask}
        >
          <SpawnListEditable
            task={taskBeingEdited}
            tasks={this.state.tasks}
            type={SPAWN_TYPE.ON_DONE}
            spawnToAdd={this.state.spawnToAdd}
            onCancelSpawnClick={this.onCancelSpawnClick}
            onDaysChange={this.onDaysChange}
            onRemoveSpawn={this.onRemoveSpawn}
            onKillParentChange={this.onKillParentChange}
            onNewSpawnMethodChange={this.onNewSpawnMethodChange}
            onNewSpawnInputChange={this.onNewSpawnInputChange}
            onClickSpawn={this.onClickSpawn}
            onCommitClick={this.onCommitClick}
            onAddClick={this.onAddClick}
          />
          <SpawnListEditable
            task={taskBeingEdited}
            tasks={this.state.tasks}
            type={SPAWN_TYPE.ON_AGE}
            spawnToAdd={this.state.spawnToAdd}
            onCancelSpawnClick={this.onCancelSpawnClick}
            onDaysChange={this.onDaysChange}
            onRemoveSpawn={this.onRemoveSpawn}
            onKillParentChange={this.onKillParentChange}
            onNewSpawnMethodChange={this.onNewSpawnMethodChange}
            onNewSpawnInputChange={this.onNewSpawnInputChange}
            onClickSpawn={this.onClickSpawn}
            onCommitClick={this.onCommitClick}
            onAddClick={this.onAddClick}
          />
        </EditBox>
        {this.state.tasks && taskList}
      </div>
    );
    
  }
}

export default Admin;