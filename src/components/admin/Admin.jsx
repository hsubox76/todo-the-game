import React from 'react';
import firebase from 'firebase/app';
import { SPAWN_TYPE, FIRESTORE_COLLECTION } from '../../data/constants';
import { DAY, TASKS, INITIAL_TASK_IDS } from '../../data/tasks';
import '../../styles/admin.css';
import TaskBox from './TaskBox';
import EditBox from './EditBox';
import SpawnListEditable from './SpawnListEditable';

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
    this.state = { user: null, loading: true, updates: null, spawnsToCreate: [] };
  }
  componentDidMount() {
    firebase.auth().onAuthStateChanged((user) => {
      this.setState({ loading: false });
      if (user) {
        this.setState({ user });
        this.props.db.collection(FIRESTORE_COLLECTION.TASKS).onSnapshot(snapshot => {
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
    this.props.db.collection(FIRESTORE_COLLECTION.TASKS).get().then(snapshot => {
      snapshot.forEach(task => {
         this.props.db.collection(FIRESTORE_COLLECTION.TASKS_BACKUP).doc(task.id).set(task.data()); 
      });
    });
  }
  onUpdateTask = (id) => {
    const updates = this.state.updates || {};
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
    this.state.spawnsToCreate.forEach(spawnToCreate => {
      this.props.db.collection(FIRESTORE_COLLECTION.TASKS).doc(spawnToCreate.taskId).set(spawnToCreate);
    });
    this.setState({spawnsToCreate: []});
  }
  onDeleteTask = (e, id) => {
    e.preventDefault();
    this.props.db.collection(FIRESTORE_COLLECTION.TASKS).doc(id).delete();
    this.setState({
      tasks: this.state.tasks.filter(task => task.taskId !== id)
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
    if (spawn.type.name === SPAWN_TYPE.ON_AGE.name) {
      newSpawnItem.killParent = spawn.killParent
    }
    let newSpawnDoc = null;
    if (spawn.method === 'new') {
      newSpawnItem.taskId = this.props.db.collection(FIRESTORE_COLLECTION.TASKS).doc().id;
      newSpawnDoc = {
        taskId: newSpawnItem.taskId,
        description: spawn.description,
        createdAt: Date.now()
      };
      // this.props.db.collection(FIRESTORE_COLLECTION.TASKS).doc(newSpawnItem.taskId).set(newSpawnDoc);
    }
    updates[spawn.type.name].push(newSpawnItem);
    const newTasks = this.state.tasks.slice(0, taskIndex)
      .concat(Object.assign({}, this.state.tasks[taskIndex], {[spawn.type.name]: updates[spawn.type.name]}))
      .concat(this.state.tasks.slice(taskIndex + 1));
    this.setState({
      tasks: newTasks,
      updates,
      spawnToAdd: null,
      spawnsToCreate: newSpawnDoc ? this.state.spawnsToCreate.concat(newSpawnDoc) : this.state.spawnsToCreate
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
    const tasksCollection = this.props.db.collection(FIRESTORE_COLLECTION.TASKS);
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
    return (
      <div className="admin-container">
        <div className="global-buttons">
          <button onClick={this.populateFirebaseFromLocal}>init firebase from local defaults</button>
          <button onClick={this.onCopyToBackup}>copy current to backup</button>
          <button onClick={this.onToggleShowAll}>show {this.state.showAll ? 'visible' : 'all'}</button>
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
        <div className="tasks-container">
          {this.state.tasks && this.state.tasks
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
              />
            )
          )}
        </div>
      </div>
    );
    
  }
}

export default Admin;