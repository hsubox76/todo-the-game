import React from 'react';
import { SPAWN_TYPE } from '../../data/constants';
import { DAY } from '../../data/tasks';

const SpawnList = ({
  task,
  tasks,
  type,
  onClickSpawn
}) => {
  const spawnBoxes = task[type.name] ? task[type.name].map((spawn, index) => {
    const spawnTask = tasks.find(task => task.taskId === spawn.taskId);
    let displayText = spawnTask ? spawnTask.description.substring(0, 30) : spawn.taskId;
    if (spawn.taskId === task.taskId) {
      displayText = '(self)';
    } else if (spawn.taskId === 'new') {
      displayText = spawn.description;
    }
    const timeElement = (
      <div>
      <span className='spawn-label'>{type.timeField + ': '}</span>
      <span className='spawn-timespan'>{spawn[type.timeField] / DAY}</span>
      <span className='spawn-timeunit'>days</span>
      </div>
    );
    
    let killParentElement = null;
    if (type.name === SPAWN_TYPE.ON_AGE.name) {
      killParentElement = (
        <div>Kills parent? {spawn.killParent ? 'yes' : 'no'}</div>
      );
    }
    const classes = ['spawn-box', 'spawn-box-' + type.class];
    return (
    <div
      key={task.taskId + '-' + spawn.taskId + '-' + index}
      className={classes.join(' ')}
    >
      <div
        className="task-link"
        onClick={() => onClickSpawn(task.taskId, spawn.taskId, type.name)}
      >
        {displayText}
      </div>
      {timeElement}
      {killParentElement}
    </div>
    );
  }): [];
  return spawnBoxes;
};

export default SpawnList;