import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./NewBom.module.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import Loader from "../loader/Loader.jsx";
import { useDebounce } from "use-debounce";
import { useDispatch, useSelector } from "react-redux";
import { startLoading, stopLoading } from "../../Redux/slices/loadingSlice";
import { fetchBOM, deleteBom } from "../../Redux/slices/bomSlice.js";
import { setPendingItems } from "../../Redux/slices/pendingItemsSlice.js";
import store from "../../Redux/store.js";

const NewBom = ({handleResolveBomClick}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loading);
  const boms = useSelector((state) => state.boms.components);
  const { items, error } = useSelector((state) => state.items);

  useEffect(() => {
    if (items.length > 0) {
      dispatch(fetchBOM(items));
    }
  }, [dispatch, items]);

  // Memoize filtered items to reduce recalculations
  const filteredItems = useMemo(() => {
    console.log("bomsssss: ", boms);

    if (!debouncedQuery) return boms;
    return boms.filter((item) =>
      item.component_name.toLowerCase().includes(debouncedQuery)
    );
  }, [debouncedQuery, boms]);

  // Handle search input changes
  const handleSearchChange = (e) => setSearchQuery(e.target.value);

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

  const handleDeleteComponent = async (id) => {
    dispatch(startLoading());
    try {
      // First, dispatch deleteBom action to remove the component
      dispatch(deleteBom(id));

      const response = await fetch(
        `https://api-assignment.inveesync.in/bom/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete the item.");
      }

      const updatedBoms = await fetch("https://api-assignment.inveesync.in/bom");
      const bomData = await updatedBoms.json();

      // Get the current state of pending items from Redux store
      const currentPendingState = store.getState().pendingItems; // Direct access to Redux store

      // Validate the BOM and get the updated pending jobs
      const updatedPendingState = validateBOM(bomData, currentPendingState);

      // Dispatch the new state to update the Redux store
      dispatch(setPendingItems(updatedPendingState));

      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    } finally {
      dispatch(stopLoading());
    }
  };

  return (
    <>
      {" "}
      {isLoading && <Loader />}
      <div className={styles.bomBuilder}>
        <h2>Bill of Materials Builder</h2>
        <p>Define product composition and component relationships</p>

        <div className={styles.searchContainer}>
          <button
            className={styles.addItemButton}
            onClick={() => handleResolveBomClick({})}
          >
            Add Component
          </button>
          <input
            type="text"
            placeholder="Search by Item Name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>
        {/* Components Table */}
        <div className={styles.tableContainer}>
          <table className={styles.componentsTable}>
            <thead>
              <tr>
                <th>Component ID</th>
                <th>Item ID</th>
                <th>Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((component) => (
                <tr key={component.id}>
                  <td>{component.component_name}</td>
                  <td>{component.internal_item_name}</td>
                  <td>{component.quantity}</td>
                  <td
                    style={{
                      display: "flex",
                      justifyContent: "space-evenly",
                    }}
                  >
                    <FaEdit
                      className={styles.editIcon}
                      onClick={() => handleResolveBomClick(component)}
                      title="Edit Component"
                    />
                    <FaTrashAlt
                      className={styles.deleteIcon}
                      onClick={() => handleDeleteComponent(component.id)}
                      title="Delete Component"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className={styles.noData}>No matching boms found.</div>
          )}
        </div>
      </div>
    </>
  );
};

export default NewBom;
