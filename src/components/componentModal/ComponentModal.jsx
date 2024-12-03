import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { startLoading, stopLoading } from "../../Redux/slices/loadingSlice.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./ComponentModal.module.css";
import { updateBom, addBom } from "../../Redux/slices/bomSlice.js";
import { setPendingItems } from "../../Redux/slices/pendingItemsSlice.js";
import store from "../../Redux/store.js";
import { v4 as uuidv4 } from "uuid";

function ComponentModal({
  selectedComponent,
  setComponentModal,
  setSelectedComponent,
}) {
  const [newComponent, setNewComponent] = useState({
    component_id: "",
    quantity: "",
    item_id: "",
  });
  const dispatch = useDispatch();
  const { items, error } = useSelector((state) => state.items);
  const nonSellItems =
    items
      ?.filter((item) => item.type !== "sell") // Exclude items of type 'sell'
      .filter((item) => item.status !== "pending") || []; // Exclude items with status 'pending'
  const nonPurchaseItems =
    items
      ?.filter((item) => item.type !== "purchase") // Exclude items of type 'purchase'
      .filter((item) => item.status !== "pending") || []; // Exclude items with status 'pending'

  const boms = useSelector((state) => state.boms.components);
  const validateBOM = (data, currentPendingState) => {
    const errors = {
      missingSellItem: true, // For sell items
      missingPurchaseItem: true, // For purchase items
      missingComponentItem: true, // For component items
    };

    const removePendingJobs = [];
    const PendingJobs = [];

    // Loop through the updated boms data
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
    if (!errors.missingSellItem) {
      removePendingJobs.push({
        reason: "Sell item must have at least one item_id.",
      });
    } else {
      PendingJobs.push({
        reason: "Sell item must have at least one item_id.",
      });
    }

    if (!errors.missingPurchaseItem) {
      removePendingJobs.push({
        reason: "Purchase item must have at least one component_id.",
      });
    } else {
      PendingJobs.push({
        reason: "Purchase item must have at least one component_id.",
      });
    }

    if (!errors.missingComponentItem) {
      removePendingJobs.push({
        reason:
          "Component item must have at least one item_id and one component_id.",
      });
    } else {
      PendingJobs.push({
        reason:
          "Component item must have at least one item_id and one component_id.",
      });
    }

    // Directly update the currentPendingState
    // Remove jobs from the current state
    const updatedState = currentPendingState.filter(
      (item) =>
        !removePendingJobs.some((removeJob) => removeJob.reason === item.reason)
    );

    // Add new pending jobs to the current state
    PendingJobs.forEach((newJob) => {
      const existingJob = updatedState.find(
        (item) => item.reason === newJob.reason
      );
      if (!existingJob) {
        updatedState.push(newJob);
      }
    });

    return updatedState; // Return the updated state
  };
  const generateUniqueId = (min, max) => {
    // Generate a UUIDv4 string
    const uuid = uuidv4();

    // Convert part of the UUID to an integer
    const numericId = Math.abs(
      parseInt(uuid.replace(/-/g, "").slice(0, 8), 16)
    );

    // Ensure the generated ID is within the provided range [min, max]
    const rangeId = min + (numericId % (max - min + 1));

    return rangeId;
  };

  const handleUpdateComponent = async (updatedData) => {
    console.log("update Bom: ", boms);
    const exists = boms.some(
      (component) =>
        component.component_id === updatedData.component_id &&
        component.item_id === updatedData.item_id &&
        component.id !== updatedData.id
    );

    if (exists) {
      toast.error("A component with the same ID already exists");
      return;
    }

    dispatch(startLoading());
    try {
      // Fetch the updated item name based on the updated item_id
      const matchingItem = items.find(
        (item) => item.id === updatedData.item_id
      );
      if (matchingItem) {
        updatedData.internal_item_name = matchingItem.internal_item_name;
      }

      const response = await fetch(
        `https://api-assignment.inveesync.in/bom/${updatedData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        toast.error("Failed to update item");
        throw new Error("Failed to update item");
      }

      dispatch(updateBom(updatedData));
      const currentPendingState = store.getState().pendingItems;
      // Validate the BOM and get the updated pending jobs
      const updatedPendingState = validateBOM(boms, currentPendingState);

      // Dispatch the new state to update the Redux store
      dispatch(setPendingItems(updatedPendingState));
      setComponentModal(false);
      setSelectedComponent(null);
      toast.success("Bom updated successfully!");
    } catch (error) {
      console.error("Failed to update bom:", error);
      toast.error("Failed to update bom");
    } finally {
      dispatch(stopLoading());
    }
  };
  // Handle adding a new component
  const handleCreateComponent = async () => {
    if (
      !newComponent.component_id ||
      !newComponent.item_id ||
      !newComponent.quantity
    ) {
      toast.error("Input values are missing");
      return;
    }

    // Check if the component already exists
    const exists = boms.some(
      (component) =>
        component.component_id === Number(newComponent.component_id) &&
        component.item_id === Number(newComponent.item_id)
    );

    if (exists) {
      toast.error("Component already exists");
      return;
    }

    dispatch(startLoading());
    const payload = {
      id: generateUniqueId(),
      component_id: Number(newComponent.component_id),
      quantity: Number(newComponent.quantity),
      item_id: Number(newComponent.item_id),
      created_by: "user3",
      last_updated_by: "user3",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const matchingItem = items.find(
        (item) => item.id === payload.item_id
      ) || {
        internal_item_name: "Unknown",
      };
      const matchingComponent = items.find(
        (item) => item.id === payload.component_id
      ) || {
        internal_item_name: "Unknown",
      };

      console.log("payload: ", JSON.stringify(payload));
      const response = await fetch("https://api-assignment.inveesync.in/bom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save the process");
      }

      const savedData = await response.json();
      savedData.internal_item_name = matchingItem.internal_item_name;
      savedData.component_name = matchingComponent.internal_item_name;
      dispatch(addBom(savedData));
      const currentPendingState = store.getState().pendingItems;
      // Validate the BOM and get the updated pending jobs
      const updatedPendingState = validateBOM(boms, currentPendingState);

      // Dispatch the new state to update the Redux store
      dispatch(setPendingItems(updatedPendingState));

      setNewComponent({ component_id: "", quantity: "", item_id: "" });
      setComponentModal(false);
      toast.success("Component added successfully!");
    } catch (error) {
      toast.error("Failed to create component");
      console.error("Failed to create component:", error);
    } finally {
      dispatch(stopLoading());
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h2>
          {selectedComponent && selectedComponent.component_id
            ? "Update Component"
            : "Add Component"}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updatedData = {
              component_id: Number(formData.get("component_id")),
              item_id: Number(formData.get("item_id")),
              quantity: Number(formData.get("quantity")),
            };

            if (updatedData.quantity < 1 || updatedData.quantity > 100) {
              toast.error("quantity should be from 1 to 100");
              return;
            }
            if (updatedData.component_id == updatedData.item_id) {
              toast.error("Component Id and Item Id cannot be same");
              return;
            }

            if (selectedComponent && selectedComponent.component_id) {
              handleUpdateComponent({ ...selectedComponent, ...updatedData });
            } else {
              handleCreateComponent(updatedData);
            }
          }}
        >
          <label>
            Component Id:
            <select
              name="component_id"
              value={
                selectedComponent?.component_id ||
                newComponent.component_id ||
                ""
              }
              required
              onChange={(e) => {
                const newValue = e.target.value;
                if (selectedComponent && selectedComponent.component_id) {
                  setSelectedComponent((prevItem) => ({
                    ...prevItem,
                    component_id: newValue,
                  }));
                } else {
                  setNewComponent((prevItem) => ({
                    ...prevItem,
                    component_id: newValue,
                  }));
                }
              }}
            >
              <option value="">Select Component ID</option>
              {nonSellItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.internal_item_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Item Id:
            <select
              name="item_id"
              value={selectedComponent?.item_id || newComponent.item_id || ""}
              required
              onChange={(e) => {
                const newValue = e.target.value;
                if (selectedComponent && selectedComponent.component_id) {
                  setSelectedComponent((prevItem) => ({
                    ...prevItem,
                    item_id: newValue,
                  }));
                } else {
                  setNewComponent((prevItem) => ({
                    ...prevItem,
                    item_id: newValue,
                  }));
                }
              }}
            >
              <option value="">Select Item ID</option>
              {nonPurchaseItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.internal_item_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity:
            <input
              type="number"
              name="quantity"
              value={selectedComponent?.quantity || newComponent.quantity || ""}
              required
              onChange={(e) => {
                const newValue = Number(e.target.value); // Convert value to a number

                if (selectedComponent && selectedComponent.component_id) {
                  setSelectedComponent((prevItem) => ({
                    ...prevItem,
                    quantity: newValue,
                  }));
                } else {
                  setNewComponent((prevItem) => ({
                    ...prevItem,
                    quantity: newValue,
                  }));
                }
              }}
            />
          </label>

          {/* Button Container */}
          <div className={styles.buttonContainer}>
            <button type="submit" className={styles.submitButton}>
              Save
            </button>
            <button
              type="button"
              onClick={() => setComponentModal(false)}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ComponentModal;
