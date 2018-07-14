/**
 * Task format:
 * 
 * taskId: unique for each type of task, may be many instances of that same type
 * 
 * description: text that appears in UI
 * 
 * spawnsOnDone: {
 *   taskId: task type to create a new instance of when this one is checked done
 *   delay: game hours between old task being checked done and spawning
 *     new one
 * }
 * 
 * spawnsOnAge: {
 *   taskId: task type to create a new instance of when this one is X age
 *   age: current task's age in game hours when new task should be spawned
 *   killParent: kill this task when spawn appears
 * }
 */

export const INITIAL_TASK_IDS = [1, 2, 3];

export const TASKS = [
  {
    taskId: 1,
    description: 'Water plant',
    spawnsOnDone: [
      { taskId: 1, delay: 24 },
    ],
    spawnsOnAge: [
      { age: 72, taskId: 4, killParent: true }
    ]
    
  },
  { taskId: 2, description: 'Call mom long name test long wrapping text name' },
  { taskId: 3, description: 'Text K' },
  {
    taskId: 4,
    description: 'Take dead plant out to garbage',
    spawnsOnAge: [
      { age: 72, taskId: 5, killParent: true }
    ]
  },
  {
    taskId: 5,
    description: 'Buy flypaper to catch flies around rotting plant',
    spawnsOnAge: [
      { age: 72, taskId: 6, killParent: true }
    ]
  },
  {
    taskId: 6,
    description: 'Find out where maggots are coming from'
  }
];