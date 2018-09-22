import React from 'react';
import { SPAWN_TYPE } from '../../data/constants';
import SpawnList from './SpawnList';

const TaskBox = ({
    task,
    selected,
    tasks,
    classList = [],
    disableButtons,
    onClickSpawn,
    onEditTask,
    onDeleteTask,
    onSetPath
}) => {
    const classes = ['task-box'].concat(classList);
    if (selected) {
      classes.push('selected');
    }
    const descriptionEl = <div className="description-text">{task.description}</div>;
    // Get parent link if any
    let parentLink = null;
    if (task.parentId) {
      const parentDesc = tasks.find(t => t.taskId === task.parentId).description;
      parentLink = (
        <div className="parent-link" onClick={() => onClickSpawn(task.taskId, task.parentId, false)}>back to "{parentDesc}"</div>
      );
    }
    const isDeletable = !task[SPAWN_TYPE.ON_DONE.name] && !task[SPAWN_TYPE.ON_AGE.name];
    return (
      <div className={classes.join(' ')}>
        {parentLink}
        <div className="task-header">
          {task.taskId === 'new' ? 'Create New Task' : ('ID: ' + task.taskId)}
          <div className="button-container">
            <button
              onClick={(e) => onEditTask(e, task.taskId)}
              className={disableButtons ? 'disabled' : ''}
              disabled={disableButtons}
            >
              edit
            </button>
            <button
              onClick={(e) => onSetPath(e, task.taskId)}
              className={disableButtons ? 'disabled' : ''}
              disabled={disableButtons}
            >
              solo
            </button>
            <button
              onClick={(e) => onDeleteTask(e, task.taskId)}
              className={!isDeletable || disableButtons ? 'delete-button disabled' : 'delete-button'}
              disabled={!isDeletable || disableButtons}
            >
              delete
            </button>
          </div>
        </div>
        <input name="taskId" type="hidden" value={task.taskId}/>
        <div className="form-row">
          <label htmlFor="description">Description:</label>
          {descriptionEl}
        </div>
        <div className="form-row stack">
          <label>Spawns On Done:</label>
          <SpawnList
            task={task}
            tasks={tasks}
            type={SPAWN_TYPE.ON_DONE}
            onClickSpawn={onClickSpawn}
          />
        </div>
        <div className="form-row stack">
          <label>Spawns On Age:</label>
          <SpawnList
            task={task}
            tasks={tasks}
            isEditable={false}
            type={SPAWN_TYPE.ON_AGE}
            onClickSpawn={onClickSpawn}
          />
        </div>
      </div>
      );
}

export default TaskBox;