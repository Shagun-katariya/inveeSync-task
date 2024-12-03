import { createSlice } from '@reduxjs/toolkit';

const loadingSlice = createSlice({
  name: 'loading',
  initialState: false, // false means loader is hidden
  reducers: {
    startLoading: () => true,  // Set loading to true
    stopLoading: () => false, // Set loading to false
  },
});

export const { startLoading, stopLoading } = loadingSlice.actions;

export default loadingSlice.reducer;
