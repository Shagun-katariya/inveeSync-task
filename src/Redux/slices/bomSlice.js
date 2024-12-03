import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { startLoading, stopLoading } from "./loadingSlice";
import { setPendingItems } from "./pendingItemsSlice";

// Thunk to fetch components (BOM)
export const fetchBOM = createAsyncThunk(
  "bom/fetchBOM",
  async (items, { dispatch }) => {
    try {
      dispatch(startLoading());
      const response = await fetch("https://api-assignment.inveesync.in/bom");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      console.log("Bom Data: ", data);

      // Validate BOM data
      const pendingJobs = validateBOM(data, items);
      dispatch(setPendingItems(pendingJobs))

      data.forEach((component) => {
        const { item_id, component_id } = component;
        const matchingItem = items.find((item) => item.id === item_id);
        const matchingComponent = items.find(
          (item) => item.id === component_id
        );

        // Set item and component names
        component.internal_item_name = matchingItem?.internal_item_name; // Add item name
        component.component_name = matchingComponent?.internal_item_name; // Add component name
      });

      return data;
    } catch (error) {
      console.error("Failed to fetch BOM:", error);
      throw new Error("Failed to fetch BOM");
    } finally {
      dispatch(stopLoading());
    }
  }
);

const validateBOM = (data, items) => {
  const errors = {
    missingSellItem: true, // For sell items
    missingPurchaseItem: true, // For purchase items
    missingComponentItem: true, // For component items
  };

  const PendingJobs = [];

  data.map((component) => {
    const { item_id, component_id } = component;

    const SellType = items.find((item) => item.id === item_id);
    const purchaseType = items.find((item) => item.id === component_id);

    // Validation 1: Sell items must have at least one `item_id`
    if (SellType) {
      errors.missingSellItem = false;
    }

    if (purchaseType) {
      errors.missingPurchaseItem = false;
    }
    errors.missingComponentItem = false;
    return component;
  });

  // Push validation messages based on errors
  if (errors.missingSellItem) {
    PendingJobs.push({ reason: "Sell item must have at least one item_id." });
  }
  if (errors.missingPurchaseItem) {
    PendingJobs.push({
      reason: "Purchase item must have at least one component_id.",
    });
  }
  if (errors.missingComponentItem) {
    PendingJobs.push({
      reason:
        "Component item must have at least one item_id and one component_id.",
    });
  }

  return PendingJobs;
};

const bomSlice = createSlice({
  name: "boms",
  initialState: {
    components: [],
    error: null,
  },
  reducers: {
    addBom: (state, action) => {
      const { item_id, component_id, quantity } = action.payload;

      // Perform validation before adding
      if (
        item_id &&
        component_id &&
        item_id !== component_id &&
        quantity >= 1 &&
        quantity <= 100
      ) {
        state.components.push(action.payload);
      } else {
        console.error("Invalid BOM entry, cannot add:", action.payload);
      }
    },
    updateBom: (state, action) => {
      const index = state.components.findIndex(
        (bom) => bom.id === action.payload.id
      );
      if (index !== -1) {
        const { item_id, component_id, quantity } = action.payload;

        // Validate before updating
        if (
          item_id &&
          component_id &&
          item_id !== component_id &&
          quantity >= 1 &&
          quantity <= 100
        ) {
          state.components[index] = {
            ...state.components[index],
            ...action.payload,
          };
        } else {
          console.error("Invalid BOM entry, cannot update:", action.payload);
        }
      }
    },
    deleteBom: (state, action) => {
      const itemId = action.payload;
      state.components = state.components.filter((bom) => bom.id !== itemId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBOM.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchBOM.fulfilled, (state, action) => {
        state.components = action.payload;
        state.error = null;
      })
      .addCase(fetchBOM.rejected, (state, action) => {
        state.error = action.error.message;
      });
  },
});

export const { addBom, updateBom, deleteBom } = bomSlice.actions;

export default bomSlice.reducer;
