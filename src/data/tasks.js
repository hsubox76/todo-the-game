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

export const DAY = 24;

export const TASKS = [
  {
    taskId: 1,
    description: 'Water plant',
    spawnsOnDone: [
      { taskId: 1, delay: 1 * DAY },
    ],
    spawnsOnAge: [
      { age: 3 * DAY, taskId: 4, killParent: true }
    ]
    
  },
  { taskId: 2, description: 'Call mom' },
  {
    taskId: 3,
    description: 'Text K about how job interview went',
    spawnsOnDone: [
      { taskId: 7, delay: 1 * DAY },
    ],
    spawnsOnAge: [
      { age: 2 * DAY, taskId: 8, killParent: true }
    ]
  },
  {
    taskId: 4,
    description: 'Take dead plant out to garbage',
    spawnsOnAge: [
      { age: 3 * DAY, taskId: 5, killParent: true }
    ]
  },
  {
    taskId: 5,
    description: 'Buy flypaper to catch flies around rotting plant',
    spawnsOnAge: [
      { age: 3 * DAY, taskId: 6, killParent: true }
    ]
  },
  {
    taskId: 6,
    description: 'Find out where maggots are coming from'
  },
  {
    taskId: 7,
    description: 'Read that book K was talking about (Atlas something?)',
    spawnsOnDone: [
      { taskId: 12, delay: 1 * DAY },
    ],
  },
  {
    taskId: 8,
    description: 'Come up with plausible excuse for not asking K about job interview',
    spawnsOnAge: [
      { age: 2 * DAY, taskId: 9, killParent: true }
    ]
  },
  {
    taskId: 9,
    description: 'Apologize to K',
    spawnsOnAge: [
      { age: 2 * DAY, taskId: 10, killParent: true }
    ]
  },
  {
    taskId: 10,
    description: 'Plan grand gesture to make everything up to K',
    spawnsOnAge: [
      { age: 2 * DAY, taskId: 11, killParent: true }
    ]
  },
  {
    taskId: 11,
    description: 'Change Facebook status to "not in a relationship"'
  },
  {
    taskId: 12,
    description: 'Write a diplomatic, thoughtful email to K about how bad Atlas Shrugged was (NOTHING PERSONAL)',
    spawnsOnDone: [
      { taskId: 13, delay: 1 * DAY },
    ],
  },
  {
    taskId: 13,
    description: 'Ask L how to set up Gmail filter to block angry messages from K'
  },
];