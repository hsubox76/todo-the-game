import React from 'react';

const EditBox = ({
  task,
  isDirty,
  disableButtons,
  disableUpdate,
  onCancelClick,
  onCreateClick,
  onDescriptionChange,
  onEditTask,
  children
}) => {
  if (!task) {
    return (
      <div className="task-edit-box empty">
        <div>select a task to edit or</div>
        <button onClick={onCreateClick}>create new task</button>
      </div>
    );
  }
  const classes = ['task-edit-box', 'editing'];
  const descriptionEl = (<textarea
        name="description"
        rows="3"
        defaultValue={task.description}
        onChange={onDescriptionChange}
      />);
  if (isDirty) {
    classes.push('dirty');
  }
  return (
    <form className={classes.join(' ')} key={task.taskId} onSubmit={(e) => onEditTask(e, task.taskId)}>
      <div className="task-edit-box-header">{task.taskId === 'new' ? 'Create New Task' : ('ID: ' + task.taskId)}</div>
      <div>
        <input name="taskId" type="hidden" value={task.taskId}/>
      </div>
      <div className="form-row">
        <label htmlFor="description">Description:</label>
        {descriptionEl}
      </div>
      <div className="form-row stack">
        <label>Spawns On Done:</label>
        {children[0]}
      </div>
      <div className="form-row stack">
        <label>Spawns On Age:</label>
        {children[1]}
      </div>
      <div className="form-row">
        <button
          className={disableButtons || disableUpdate ? 'disabled' : ''}
          disabled={disableButtons || disableUpdate}
        >
          update
        </button>
        <button
          type="nosubmit"
          className={"cancel-button" + (disableButtons ? ' disabled' : '')}
          disabled={disableButtons}
          onClick={() => onCancelClick(task)}
        >
          cancel
        </button>
      </div>
    </form>
    );
}

export default EditBox;