import { combineReducers } from 'redux';

import auth from './auth';
import conversation from './conversation';
import message from './message';
import dms from './dms';
import meetings from './meetings';
import notifications from './notifications';

export const reducers = combineReducers({ auth, conversation, message, dms, meetings, notifications });