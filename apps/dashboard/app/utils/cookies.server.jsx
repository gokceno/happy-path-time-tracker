import { createCookie } from '@remix-run/node';

export const auth = createCookie('auth');
export const recentProjectTasks = createCookie('recentProjectTasks');
