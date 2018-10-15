export const PALETTES = [1, 2, 3, 4, 5, 6];

export const GAME_HOUR_LENGTH = 1000;
export const CLOCK_INCREMENT_INTERVAL_HOURS = 1;

export const SPAWN_TYPE = {
    'ON_AGE': { name: 'spawnsOnAge', timeField: 'age', class: 'age' },
    'ON_DONE': { name: 'spawnsOnDone', timeField: 'delay', class: 'done' }
};

export const FIRESTORE_COLLECTION = {
    TASKS: 'tasks',
    TASKS_BACKUP: 'tasks_backup'
};

export const GAME_SPEED = {
    SLOW: 1000,
    FAST: 500,
    FASTER: 200,
    LIGHTSPEED: 50
};
