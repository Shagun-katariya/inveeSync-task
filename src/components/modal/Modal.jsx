import React, { useState, useEffect } from "react";
import { stopModal } from "../../Redux/slices/modalSlice.js";
import { useDispatch } from "react-redux";
import styles from "./Modal.module.css";
import { startLoading, stopLoading } from "../../Redux/slices/loadingSlice.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { addItem, updateItem } from "../../Redux/slices/itemSlice.js";
import { removePendingItem } from "../../Redux/slices/pendingItemsSlice.js";
import { v4 as uuidv4 } from "uuid";

function Modal({ selectedItem, setSelectedItem }) {
  console.log("selectedItem: ", selectedItem);
  const dispatch = useDispatch();
  const [type, setType] = useState("sell");

  useEffect(() => {
    if (selectedItem != null && selectedItem.id) {
      setType(selectedItem.type);
    }
  }, [selectedItem]);

  const validateItemData = (data) => {
    if (!data.internal_item_name || !data.type || !data.uom) {
      return {
        isValid: false,
        errorMessage: "internal_item_name, type, and uom are mandatory fields.",
      };
    }

    if (data.type === "sell" && !data.additional_attributes.scrap_type) {
      return {
        isValid: false,
        errorMessage: "scrap_type is required for items with type 'sell'.",
      };
    }

    return {
      isValid: true,
    };
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

  // Handle Create Item
  const handleCreate = async (createdData) => {
    const minBuffer = createdData.min_buffer ?? Math.floor(Math.random() * 5); // Random value between 0-5
    const maxBuffer =
      createdData.max_buffer ?? minBuffer + Math.floor(Math.random() * 10 + 1); // Ensure max_buffer >= min_buffer

    createdData.status = "Complete";

    // Step 2: Generate random tenant_id and construct the item data
    const itemData = {
      id: generateUniqueId(),
      internal_item_name: createdData.internal_item_name,
      tenant_id: Math.floor(Math.random() * 1000), // Random tenant ID
      item_description: createdData.item_description || "sample Item",
      uom: createdData.uom,
      created_by: "user1",
      last_updated_by: "user2",
      type: createdData.type,
      max_buffer: maxBuffer,
      min_buffer: minBuffer,
      customer_item_name: createdData.customer_item_name || "Customer ABC",
      is_deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      additional_attributes: {
        drawing_revision_number: createdData.drawing_revision_number || 1,
        drawing_revision_date:
          createdData.drawing_revision_date || "2023-04-01",
        avg_weight_needed: createdData.avg_weight_needed ?? true,
        scrap_type:
          createdData.scrap_type ||
          (createdData.type === "sell" ? "default_scrap" : null),
        shelf_floor_alternate_name:
          createdData.shelf_floor_alternate_name || "shelf_1",
      },
    };

    // Step 1: Validate Data
    const validation = validateItemData(itemData);
    if (!validation.isValid) {
      toast.error(validation.errorMessage);
      return;
    }

    // Step 3: Send the request to the API
    try {
      dispatch(startLoading());
      console.log("createdData: ", JSON.stringify(itemData));
      const response = await fetch(
        "https://api-assignment.inveesync.in/items",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save the process");
      }

      const savedData = await response.json();
      console.log("item created successfully:", savedData);

      savedData.status = "complete"; // Set status to "complete" upon successful creation

      // Step 4: Update local state and Redux store
      dispatch(addItem(savedData));
      dispatch(stopModal());
      toast.success("Item Created successfully!");
    } catch (error) {
      console.error("Failed to create item:", error);
      toast.error("Failed to create item");
    } finally {
      dispatch(stopLoading()); // Hide loader after operation is complete
    }
  };

  const handleUpdate = async (updatedData) => {
    // Step 1: Validate Data
    console.log("Updated Data: ", updatedData);
    const validation = validateItemData(updatedData);
    if (!validation.isValid) {
      toast.error(validation.errorMessage);
      return;
    }

    const minBuffer = updatedData.min_buffer ?? Math.floor(Math.random() * 5); // Random value between 0-5
    let maxBuffer =
      updatedData.max_buffer ?? minBuffer + Math.floor(Math.random() * 10 + 1);

    if (maxBuffer < minBuffer) {
      maxBuffer = minBuffer; // Set maxBuffer to be at least minBuffer
    }

    updatedData.min_buffer = minBuffer;
    updatedData.max_buffer = maxBuffer;
    updatedData.status = "Complete";

    console.log("need to Updated Data: ", JSON.stringify(updatedData));
    try {
      dispatch(startLoading());
      // Update the item on the server
      const response = await fetch(
        `https://api-assignment.inveesync.in/items/${updatedData.id}`,
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

      const updatedItem = await response.json();
      console.log("updatedItem: ", updateItem);

      // Update the Redux store with the updated item
      dispatch(updateItem(updatedItem)); // Dispatch the action to update the item in the store
      dispatch(removePendingItem(updatedItem.id));
      // Close the modal and reset the form
      dispatch(stopModal());
      setSelectedItem(null);
      toast.success("Item updated successfully!");
    } catch (error) {
      console.error("Failed to update item:", error);
      toast.error("Failed to update item");
    } finally {
      dispatch(stopLoading()); // Stop the loader
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h2>
          {selectedItem != null && selectedItem.id
            ? "Update Item"
            : "Create Item"}
        </h2>
        {selectedItem != null && selectedItem.id ? (
          // Update Item Form
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const updatedData = {
                ...selectedItem,
                internal_item_name: formData.get("internal_item_name"),
                type: formData.get("type"),
                uom: formData.get("uom"),
                additional_attributes: {
                  ...selectedItem.additional_attributes,
                  avg_weight_needed: formData.get("avg_weight_needed"),
                  scrap_type: formData.get("scrap_type"), // Correctly updating scrap_type
                },
              };
              handleUpdate(updatedData);
            }}
          >
            <label>
              Item Name:
              <input
                type="text"
                name="internal_item_name"
                value={selectedItem.internal_item_name || ""}
                required
                style={{
                  borderColor:
                    selectedItem.issues &&
                    selectedItem.issues.includes("Missing Item Name")
                      ? "red"
                      : "black",
                }}
                onChange={(e) =>
                  setSelectedItem((prevItem) => ({
                    ...prevItem,
                    internal_item_name: e.target.value,
                  }))
                }
                placeholder="Enter Item Name"
              />
            </label>

            <label>
              Type:
              <select
                name="type"
                required
                className={styles.dropdown}
                style={{
                  borderColor:
                    selectedItem.issues &&
                    selectedItem.issues.includes("Missing Type")
                      ? "red"
                      : "black",
                }}
                value={selectedItem.type || ""}
                onChange={(e) => {
                  const newType = e.target.value;
                  setSelectedItem((prevItem) => ({
                    ...prevItem,
                    type: newType,
                  }));
                }}
              >
                <option value="" disabled>
                  Select Type
                </option>
                <option value="sell">Sell</option>
                <option value="purchase">Purchase</option>
                <option value="component">Component</option>
              </select>
            </label>

            <label>
              UOM:
              <select
                name="uom"
                required
                className={styles.dropdown}
                style={{
                  borderColor:
                    selectedItem.issues &&
                    selectedItem.issues.includes("Missing UOM")
                      ? "red"
                      : "black",
                }}
                value={selectedItem.uom || ""}
                onChange={(e) =>
                  setSelectedItem((prevItem) => ({
                    ...prevItem,
                    uom: e.target.value,
                  }))
                }
              >
                <option value="" disabled>
                  Select UOM
                </option>
                <option value="kgs">KGS</option>
                <option value="nos">NOS</option>
              </select>
            </label>

            <label>
              Avg Weight Needed:
              <select
                name="avg_weight_needed"
                required
                className={styles.dropdown}
                style={{
                  borderColor:
                    selectedItem.issues &&
                    selectedItem.issues.includes("Missing UOM")
                      ? "red"
                      : "black",
                }}
                value={
                  selectedItem.additional_attributes?.avg_weight_needed || ""
                }
                onChange={(e) =>
                  setSelectedItem((prevItem) => ({
                    ...prevItem,
                    additional_attributes: {
                      ...prevItem.additional_attributes,
                      avg_weight_needed: e.target.value,
                    },
                  }))
                }
              >
                <option value="" disabled>
                  Select Avg Weight Needed
                </option>
                <option value="True">Yes</option>
                <option value="False">NO</option>
              </select>
            </label>

            {selectedItem.type === "sell" && (
              <label>
                Scrap Type:
                <input
                  type="text"
                  name="scrap_type"
                  value={selectedItem.additional_attributes?.scrap_type || ""}
                  onChange={(e) =>
                    setSelectedItem((prevItem) => ({
                      ...prevItem,
                      additional_attributes: {
                        ...prevItem.additional_attributes,
                        scrap_type: e.target.value,
                      },
                    }))
                  }
                />
              </label>
            )}

            <div className={styles.buttonContainer}>
              <button type="submit" className={styles.submitButton}>
                Save
              </button>
              <button
                type="button"
                onClick={() => dispatch(stopModal())}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          // Create Item Form
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const createdData = {
                internal_item_name: formData.get("internal_item_name"),
                type: formData.get("type"),
                uom: formData.get("uom"),
                avg_weight_needed: formData.get("avg_weight_needed"),
                scrap_type: formData.get("scrap_type"),
              };
              handleCreate(createdData);
            }}
          >
            <label>
              Item Name:
              <input
                type="text"
                name="internal_item_name"
                placeholder="Enter item name"
                required
              />
            </label>

            <label>
              Type:
              <select
                name="type"
                required
                onChange={(e) => {
                  setType(e.target.value);
                }}
              >
                <option value="" disabled>
                  Select Type
                </option>
                <option value="sell">Sell</option>
                <option value="purchase">Purchase</option>
                <option value="component">Component</option>
              </select>
            </label>

            <label>
              UOM:
              <select name="uom" required>
                <option value="" disabled>
                  Select UOM
                </option>
                <option value="kgs">KGS</option>
                <option value="nos">NOS</option>
              </select>
            </label>

            <label>
              Avg Weight Needed:
              <select
                name="avg_weight_needed"
                required
                className={styles.dropdown}
              >
                <option value="" disabled>
                  Select Avg Weight Needed
                </option>
                <option value="True">Yes</option>
                <option value="False">NO</option>
              </select>
            </label>

            {type === "sell" && (
              <label>
                Scrap Type:
                <input
                  type="text"
                  name="scrap_type"
                  placeholder="Enter Scrap Type"
                  required
                />
              </label>
            )}

            <div className={styles.buttonContainer}>
              <button type="submit" className={styles.submitButton}>
                Save
              </button>
              <button
                type="button"
                onClick={() => dispatch(stopModal())}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Modal;
