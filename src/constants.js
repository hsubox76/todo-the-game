export const INITIAL_TASKS = [
  {
    taskId: 1,
    description: 'Water plants',
    spawnsOnDone: [
      { taskId: 1, delay: 2 },
    ],
    spawnsOnAge: [
      { age: 5, taskId: 4, killParent: true }
    ]
    
  },
  { taskId: 2, description: 'def' },
  { taskId: 3, description: 'ghi' }
];

export const ITEMS = [
  { taskId: 4, description: 'Take dead plant out to garbage' }
];