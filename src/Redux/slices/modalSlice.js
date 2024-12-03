import { createSlice } from '@reduxjs/toolkit';

const modalSlice = createSlice({
  name: 'modal',
  initialState: false,
  reducers: {
    showModal: () => true,  
    stopModal: () => false, 
  },
});

export const { showModal, stopModal } = modalSlice.actions;

export default modalSlice.reducer;
