import * as redux from 'redux';
import thunk from 'redux-thunk';

import {
  zoomReducer,
  videosReducer,
} from 'reducers';

export var configure = (initialState = {}) => {
  const reducer = redux.combineReducers({
    zoomValue: zoomReducer,
    videos: videosReducer,
  });
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || redux.compose;
  const store = redux.createStore(reducer, initialState, composeEnhancers(
      redux.applyMiddleware(thunk)
  ));
  return store;
};
