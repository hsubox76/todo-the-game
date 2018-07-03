export const INITIAL_TASKS = [
  {
    taskId: 1,
    description: 'Water plants',
    spawns: [
      { taskId: 1, delay: 2 },
    ],
    triggers: [
      { age: 5, spawns: [{ taskId: 4 }], die: true },
    ]
    
  },
  { taskId: 2, description: 'def' },
  { taskId: 3, description: 'ghi' }
];

export const ITEMS = [
  { taskId: 4, description: 'Take dead plant out to garbage' }
];