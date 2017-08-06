import { combineReducers, Reducer } from 'redux';
import { routerReducer as routing } from 'react-router-redux';
import counter, { TState as TCounterState } from './counter';
import instance from "./instance";

const rootReducer = combineReducers({
  counter,
  instance,
  routing: routing as Reducer<any>
});

export interface IState {
  counter: TCounterState;
}

export default rootReducer;
