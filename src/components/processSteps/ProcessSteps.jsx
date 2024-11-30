import React, { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./ProcessSteps.module.css"; // Import the CSS file
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import Loader from "../loader/Loader.jsx";

const ProcessSteps = ({ items }) => {
  const [selectedFinalProduct, setSelectedFinalProduct] = useState("");
  const [processSteps, setProcessSteps] = useState([]);
  const [showModal, setShowModal] = useState(false); // Track modal visibility
  const [processIds, setProcessIds] = useState([]); // For process IDs
  const [editProcessStep, setEditProcessStep] = useState(false);
  const [editProcessData, setEditProcessData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (items.length > 0) {
      setSelectedFinalProduct(items[0].id); // Default to the first item's id
    }
  }, [items]);

  const fetchProcessData = useCallback(async () => {
    if (!selectedFinalProduct) return;

    setIsLoading(true);
    try {
      // Parallel API calls to fetch both process steps and process IDs
      const [processStepRes, processIdRes] = await Promise.all([
        fetch(
          `https://api-assignment.inveesync.in/process-step?item_id=${selectedFinalProduct}`
        ),
        fetch(
          `https://api-assignment.inveesync.in/process?item_id=${selectedFinalProduct}`
        ),
      ]);

      if (!processStepRes.ok || !processIdRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [processStepsData, processIdsData] = await Promise.all([
        processStepRes.json(),
        processIdRes.json(),
      ]);

      setProcessSteps(processStepsData);
      setProcessIds(processIdsData);
    } catch (error) {
      toast.error("Failed to fetch data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFinalProduct]);

  useEffect(() => {
    fetchProcessData();
  }, [selectedFinalProduct, fetchProcessData]);

  const handleResolveProcessData = (step) => {
    console.log("step: ", step);
    setEditProcessStep(true);
    setEditProcessData(step);
  };
  // Memoized map of process IDs to process names
  const processIdToNameMap = useMemo(() => {
    return processIds.reduce((acc, process) => {
      acc[process.id] = process.process_name;
      return acc;
    }, {});
  }, [processIds]);

  const handleCreateProcessStep = async (creatData) => {
    console.log("steps updated data: ", creatData);
    setIsLoading(true);
    // Construct the request data
    const requestData = {
      item_id: creatData.item_id || 2, // Default to 2 if not provided
      process_id: creatData.process_id || 2, // Default to 2 if not provided
      sequence: creatData.sequence || 1, // Default to 1 if not provided
      created_by: creatData.created_by || "user3", // Default to "user3" if not provided
      last_updated_by: creatData.last_updated_by || "user3", // Default to "user3" if not provided
      createdAt: creatData.createdAt || new Date().toISOString(), // Default to given timestamp if not provided
      updatedAt: creatData.updatedAt || new Date().toISOString(), // Default to given timestamp if not provided
    };

    // Post the data
    try {
      const response = await fetch(
        "https://api-assignment.inveesync.in/process-step",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to post process step");
      }
      const data = await response.json();
      setProcessSteps((prevSteps) => [...prevSteps, data]);
      toast.success("process-step added successfully");
    } catch (error) {
      console.error("Error posting process step:", error);
      toast.error("error creating process-step");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProcessStep = async (updatedData) => {
    console.log("steps updated data: ", updatedData);
    setIsLoading(true);
    // Construct the request data
    const requestData = {
      item_id: updatedData.item_id || 2, // Default to 2 if not provided
      process_id: updatedData.process_id || 2, // Default to 2 if not provided
      sequence: updatedData.sequence || 1, // Default to 1 if not provided
      created_by: updatedData.created_by || "user3", // Default to "user3" if not provided
      last_updated_by: updatedData.last_updated_by || "user3", // Default to "user3" if not provided
      createdAt: updatedData.createdAt || new Date().toISOString(), // Default to given timestamp if not provided
      updatedAt: updatedData.updatedAt || new Date().toISOString(), // Default to given timestamp if not provided
    };

    // Post the data
    try {
      const response = await fetch(
        `https://api-assignment.inveesync.in/process-step/${updatedData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      // Update local state
      setProcessSteps((prevItems) =>
        prevItems.map((item) =>
          item.id === updatedData.id ? { ...item, ...updatedData } : item
        )
      );

      setEditProcessStep(false);
      setEditProcessData(null);
      toast.success("process-step updated successfully");
    } catch (error) {
      console.error("Error updating process step:", error);
      toast.error("error updating process-step");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProcessStep = async (id) => {
    console.log("delete Id: ", id);
    setIsLoading(true);
    const processStepToDelete = processSteps.find((item) => item.id === id);
    try {
      // Find the item that was clicked for deletion

      if (!processStepToDelete) {
        throw new Error("Item not found.");
      }

      // Optimistically remove the item from the UI
      setProcessSteps((prevItems) =>
        prevItems.filter((item) => item.id !== id)
      );

      // Make DELETE request to the server
      const response = await fetch(
        `https://api-assignment.inveesync.in/process-step/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Key Constraint Error");
      }
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(error.message);

      // Revert the state if the deletion fails by adding the original item back
      setProcessSteps((prevItems) => [...prevItems, processStepToDelete]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <Loader />}
      <div className={styles.processStepsContainer}>
        <h2>Process Steps Configuration</h2>
        <p>Define manufacturing sequence and parameters</p>

        <div className={styles.formGroup}>
          <label htmlFor="finalProduct">Select Item</label>
          <select
            id="finalProduct"
            value={selectedFinalProduct}
            onChange={(e) => setSelectedFinalProduct(e.target.value)}
          >
            {/* <option value="" readOnly>Select a product</option> */}
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.internal_item_name}
              </option>
            ))}
          </select>
        </div>

        <button className={styles.addStepBtn} onClick={() => setShowModal(true)}>
          + Add Process Step
        </button>

        <div className={styles.processSteps}>
          {processSteps.map((step, index) => (
            <div className={styles.processStep} key={step.id}>
              <div className={styles.processStepDetails}>
                <span className={styles.stepNumber}>{index + 1}. Manufacturing</span>
                <div className={styles.stepDetails}>
                  <div className={styles.processLabel}>
                    Process:{" "}
                    <span className={styles.processValue}>
                      {processIdToNameMap[step.process_id] ||
                        "Dummy process name"}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.iconClass}>
                <FaEdit
                  className={styles.editIcon}
                  onClick={() => handleResolveProcessData(step)}
                  title="Edit Process Step"
                />
                <FaTrashAlt
                  className={styles.deleteIcon}
                  onClick={() => handleDeleteProcessStep(step.id)}
                  title="Delete Process Step"
                />
              </div>
            </div>
          ))}
          {processSteps.length === 0 && (
            <div className={styles.noData}>No process steps available.</div>
          )}
        </div>
        {showModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Add Process Step</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault(); // Prevent default form submission behavior
                  const formData = new FormData(e.target);
                  const createData = {
                    item_id: parseInt(formData.get("item_id"), 10),
                    process_id: parseInt(formData.get("process_id"), 10),
                    sequence: parseInt(formData.get("sequence"), 10),
                  };
                  handleCreateProcessStep(createData); // Call the handleUpdate function
                  setShowModal(false); // Close the modal after successful form submission
                }}
              >
                {/* Non-editable Item ID */}
                <label>
                  Item ID:
                  <input
                    type="text"
                    name="item_id"
                    value={selectedFinalProduct} // This should come from the selected Item ID
                    readOnly
                    style={{width: "96%"}}
                  />
                </label>

                {/* Dropdown for Process IDs */}
                <label>
                  Process ID:
                  <select name="process_id" required>
                    <option value="">Select Process ID</option>
                    {processIds.map((process) => (
                      <option key={process.id} value={process.id}>
                        {process.process_name}{" "}
                        {/* Adjust this to the correct property */}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Sequence Input */}
                <label>
                  Sequence:
                  <input
                    type="number"
                    name="sequence"
                    placeholder="Enter Sequence"
                    required
                    style={{width: "96%"}}
                  />
                </label>

                {/* Button Container */}
                <div className={styles.buttonContainer}>
                  <button type="submit" className={styles.submitButton}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {editProcessStep && editProcessData && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Edit Process Step</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const updatedData = {
                    ...editProcessData,
                    item_id: parseInt(formData.get("item_id"), 10),
                    process_id: parseInt(formData.get("process_id"), 10),
                    sequence: parseInt(formData.get("sequence"), 10),
                  };
                  handleUpdateProcessStep(updatedData);
                }}
              >
                <label>
                  Item Name:
                  <input
                    type="text"
                    name="item_id"
                    defaultValue={editProcessData.item_id}
                    required
                    readOnly
                    style={{width: "96%"}}
                  />
                </label>
                <label>
                  Process ID:
                  <select
                    name="process_id"
                    required
                    className={styles.dropdown}
                    defaultValue={editProcessData.process_id}
                  >
                    <option value="" disabled>
                      Select Process ID
                    </option>
                    {processIds.map((process) => (
                      <option key={process.id} value={process.id}>
                        {process.process_name}{" "}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Sequence:
                  <input
                    type="number"
                    name="sequence"
                    placeholder="Enter Sequence"
                    defaultValue={editProcessData.sequence}
                    required
                    style={{width: "96%"}}
                  />
                </label>

                {/* Button Container */}
                <div className={styles.buttonContainer}>
                  <button type="submit" className={styles.submitButton}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditProcessStep(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProcessSteps;
