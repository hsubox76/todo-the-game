import React from 'react';
import { SPAWN_TYPE } from '../../data/constants';
import { DAY } from '../../data/tasks';

const SpawnListEditable = ({
  task,
  tasks,
  type,
  spawnToAdd,
  onCancelSpawnClick,
  onDaysChange,
  onRemoveSpawn,
  onKillParentChange,
  onNewSpawnInputChange,
  onNewSpawnMethodChange,
  onClickSpawn,
  onCommitClick,
  onAddClick
}) => {
  const spawnBoxes = task[type.name] ? task[type.name].map((spawn, index) => {
    const spawnTask = tasks.find(task => task.taskId === spawn.taskId);
    let displayText = spawnTask ? spawnTask.description.substring(0, 30) : spawn.taskId;
    if (spawn.taskId === task.taskId) {
    displayText = '(self)';
    }
    const timeElement = (
      <div>
      <span className='spawn-label'>{type.timeField + ': '}</span>
      <input
        className="input-day"
        type="number"
        name={"spawn-delay-" + task.taskId + '-' + spawn.taskId}
        defaultValue={spawn[type.timeField] / DAY}
        onChange={(e) => onDaysChange(e, type, task[type.name], index)}
      />
      <span className='spawn-timeunit'>days</span>
      </div>
    );
    const removeButton = (
      <div className="div-button remove-button" onClick={e => onRemoveSpawn(e, type, task, index)}>remove</div>
    );
    let killParentElement = null;
    if (type.name === SPAWN_TYPE.ON_AGE.name) {
      killParentElement = (
        <div>
          Kills parent?
          <input
            type="checkbox"
            checked={spawn.killParent}
            onChange={(e) => onKillParentChange(e, type, task[type.name], index)}
          />
        </div>
      );
    }
    const classes = ['spawn-box', 'spawn-box-' + type.class];
    return (
      <div
        key={task.taskId + '-' + spawn.taskId + '-' + index}
        className={classes.join(' ')}
      >
        <div className="task-link" onClick={() => onClickSpawn(task.taskId, spawn.taskId)}>{displayText}</div>
        {timeElement}
        {killParentElement}
        {removeButton}
      </div>
    );
  }): [];
  if (spawnToAdd && spawnToAdd.taskId === task.taskId && spawnToAdd.type === type) {
    const currentMethod = spawnToAdd && spawnToAdd.method;
    const killParentElement = type.name === SPAWN_TYPE.ON_AGE.name && (
      <div>
      <span className="spawn-label">Kill parent on spawn:</span>
      <input
        type="checkbox"
        checked={spawnToAdd.killParent}
        onChange={(e) => onNewSpawnInputChange(e, type, {killParent: e.target.checked})}
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
        onChange={onNewSpawnMethodChange}
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
        onChange={onNewSpawnMethodChange}
        checked={currentMethod === 'id'}
        />
        select existing (enter id)
        <input
        className="input-id"
        value={spawnToAdd.id === task.taskId ? '' : spawnToAdd.id}
        placeholder="(self)"
        onFocus={() => onNewSpawnMethodChange('id')}
        onChange={(e) => onNewSpawnInputChange(e, type, {id: e.target.value})}
        />
      </div>
      <div>
        <span className="spawn-label">spawn after {type.timeField}:</span>
        <input
        className="input-day"
        type="number"
        value={spawnToAdd.days}
        onChange={(e) => onNewSpawnInputChange(e, type, {days: parseInt(e.target.value, 10)})}
        />
        <span className='spawn-timeunit'>days</span>
      </div>
      {killParentElement}
      <div className="new-spawn-button-row">
        <button
          type="nosubmit"
          className="commit-spawn-button"
          onClick={onCommitClick}
        >
        add it
        </button>
        <button
          type="nosubmit"
          className="cancel-button"
          onClick={onCancelSpawnClick}
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
          onClick={() => onAddClick(type, task)}
        >
        <span className='symbol'>+</span> add {type.class} spawn
        </div>
      );
    }

  return spawnBoxes;
};

export default SpawnListEditable;