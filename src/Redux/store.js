import { configureStore } from '@reduxjs/toolkit';
import loadingReducer from './slices/loadingSlice';
import modalReducer from './slices/modalSlice';
import itemReducer from './slices/itemSlice';
import bomReducer from './slices/bomSlice';
import pendingItemsReducer from './slices/pendingItemsSlice';

const store = configureStore({
  reducer: {
    loading: loadingReducer,
    modal: modalReducer,
    items: itemReducer,
    boms: bomReducer,
    pendingItems: pendingItemsReducer,
  },
});

export default store;
