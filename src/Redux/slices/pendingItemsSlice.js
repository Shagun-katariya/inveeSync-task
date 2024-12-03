import { createSlice } from "@reduxjs/toolkit";

// Create the pending items slice
const pendingItemsSlice = createSlice({
  name: "pendingItems",
  initialState: [],
  reducers: {
    setPendingItems: (state, action) => {
      return action.payload; // Set the pending items to the payload (which will be the transformed data)
    },
    resetPendingItems: () => {
      return []; // Reset the pending items
    },
    removePendingItem: (state, action) => {
      const itemId = action.payload; // The ID of the item to remove
      return state.filter((item) => item.id !== itemId); // Remove the item with the matching ID
    },
    removePendingComponent: (state, action) => {
      const reasonsToRemove = action.payload; // Assuming payload is an array of reasons to remove

      return state.filter((item) => {
        // Check if the item's reason matches any in the reasonsToRemove array
        const shouldRemove = reasonsToRemove.some(
          (reason) => item.reason === reason
        );

        // Only keep items that don't have a reason in the reasonsToRemove list
        return !shouldRemove;
      });
    },
    addPendingComponent: (state, action) => {
      const newReason = action.payload;
      
      // Ensure newReason is an object and contains the expected properties
      if (!newReason || !newReason.reason || typeof newReason.reason !== 'string') {
        console.warn("Invalid reason format:", newReason);
        return state; // If invalid, return the state unchanged
      }

      // Log before updating the state
      console.log("Current Pending Items:", state);
      console.log("Adding new reason:", newReason);

      // Check if the reason already exists in the state
      const existingItem = state.find((item) => item.reason === newReason.reason);

      // If the reason doesn't already exist, add the new item to the state
      if (!existingItem) {
        state.push(newReason); // Immutable push
      }

      // Log after updating the state
      console.log("Updated Pending Items:", state);
      return state;
    },
  },
});


export const {
  setPendingItems,
  resetPendingItems,
  removePendingItem,
  removePendingComponent,
  addPendingComponent,
} = pendingItemsSlice.actions;

export default pendingItemsSlice.reducer;
