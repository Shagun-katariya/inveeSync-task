import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { startLoading, stopLoading } from "./loadingSlice"; // Import loading actions
import { setPendingItems } from "./pendingItemsSlice";

//Validate Data
const validateItemData = (item) => {
  const issues = [];

  // Key validations
  if (!item.internal_item_name) {
    issues.push("Missing Item Name");
  }

  // Unique internal_item_name + tenant combination
  if (!item.tenant_id) {
    issues.push("Missing Tenant ID");
  }

  if (!item.type) {
    issues.push("Missing Type");
  }

  // Non-null scrap_type for items with type = sell
  if (item.type === "sell" && !item.additional_attributes.scrap_type) {
    issues.push("Missing Scrap Type for items with type 'sell'");
  }

  // Min buffer must not be null for Sell and Purchase
  if (
    (item.type === "sell" || item.type === "purchase") &&
    item.min_buffer == null
  ) {
    issues.push(
      "Min Buffer is required for items with type 'sell' or 'purchase'"
    );
  } else if (item.type === "sell" || item.type === "purchase") {
    // Set default values for min_buffer and max_buffer if null
    item.min_buffer = item.min_buffer == null ? 0 : item.min_buffer;
    item.max_buffer = item.max_buffer == null ? 0 : item.max_buffer;

    // Max buffer must be >= Min buffer
    if (item.max_buffer < item.min_buffer) {
      issues.push("Max Buffer must be greater than or equal to Min Buffer");
    }
  }

  // Missing UOM validation
  if (!item.uom) {
    issues.push("Missing UOM");
  }

  // Set item status based on issues
  item.status = issues.length > 0 ? "Pending" : "Complete";

  return { data: item, issues };
};

// Thunk to fetch items and set pending items
export const fetchItems = createAsyncThunk(
  "items/fetchItems",
  async (_, { dispatch }) => {
    try {
      dispatch(startLoading()); // Start loading when the fetch begins

      const response = await fetch("https://api-assignment.inveesync.in/items");

      // Handle errors
      if (!response.ok) {
        dispatch(stopLoading()); // Stop loading if the request fails
        throw new Error("Failed to fetch items");
      }

      const data = await response.json();

      console.log("items: ", data);

      // Transform items and find pending ones
      const pending = [];
      const transformedItems = data.map((item) => {
        const { data, issues } = validateItemData(item);
        // Add item to pending list if there are issues
        if (issues.length > 0) {
          pending.push({
            issues,
            id: item.id,
            internal_item_name: item.internal_item_name || "Not Found",
            item_description: item.item_description,
            last_updated_by: item.last_updated_by,
            max_buffer: item.max_buffer,
            min_buffer: item.min_buffer,
            tenant_id: item.tenant_id,
            type: item.type,
            uom: item.uom,
            updatedAt: item.updatedAt,
            customer_item_name: item.customer_item_name,
            created_by: item.created_by,
            createdAt: item.createdAt,
            additional_attributes: item.additional_attributes,
          });
        }
        return data;
      });

      // Dispatch the pending items to the store
      console.log("pending: ", pending);
      dispatch(setPendingItems(pending)); // Update the pending items state in the Redux store

      return transformedItems; // Return the transformed items to update the items state
    } catch (error) {
      console.log("error in fetching Items: ", error);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const itemSlice = createSlice({
  name: "items",
  initialState: {
    items: [],
    error: null,
  },
  reducers: {
    addItem: (state, action) => {
      state.items.push(action.payload); // Add the new item to the items array
      console.log("items: ", state.items);
    },
    updateItem: (state, action) => {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload }; // Update the item in place
      }
    },
    deleteItem: (state, action) => {
      const itemId = action.payload; // The ID of the item to delete
      state.items = state.items.filter((item) => item.id !== itemId); // Remove the item with the matching ID
      console.log("Item deleted. Updated items: ", state.items);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        // Handle loading state if needed
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.items = action.payload; // Store fetched items
        state.error = null; // Clear any previous errors
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.error = action.error.message; // Store error message if the fetch fails
      });
  },
});

export const { addItem, updateItem, deleteItem } = itemSlice.actions;

export default itemSlice.reducer;
