import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import styles from "./Processes.module.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../loader/Loader.jsx";
import { useDebounce } from "use-debounce";

function Processes() {
  const [showModal, setShowModal] = useState(false); // Track modal visibility
  const [newProcess, setNewProcess] = useState(false); // Track modal visibility
  const [processData, setProcessData] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  // Fetch items from API
  useEffect(() => {
    setIsLoading(true);
    const fetchProcesses = async () => {
      try {
        const response = await fetch(
          "https://api-assignment.inveesync.in/process"
        );
        if (!response.ok) {
          toast.error(`HTTP error! status: ${response.status}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProcessData(data);
      } catch (error) {
        toast.error("Failed to fetch items");
        console.error("Failed to fetch items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProcesses();
  }, []);

  // Filter items based on the debounced search query using useMemo to optimize performance
  const filteredItems = useMemo(() => {
    if (debouncedQuery) {
      return processData.filter((item) =>
        item.process_name.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    }
    return processData; // Return all items if the search query is empty
  }, [debouncedQuery, processData]);

  // Handle Resolve Now Click
  const handleResolveClick = (process) => {
    setSelectedProcess(process);
    setShowModal(true);
  };

  // Handle search query changes, memoized using useCallback to prevent re-creation on each render
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
  }, []);

  const handleDelete = async (itemId) => {
    setIsLoading(true);
    try {
      // Make DELETE request to the server
      console.log(itemId);
      const response = await fetch(
        `https://api-assignment.inveesync.in/process/${itemId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete the process");
      }
      // Update the UI by removing the deleted item from the process list
      setProcessData((prevItems) =>
        prevItems.filter((process) => process.id !== itemId)
      );
      toast.success("Process Delete successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("An error occurred while deleting the Process");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Update Item
  const handleUpdateProcess = async (updatedData) => {
    setIsLoading(true);
    try {
      const { id, ...dataWithoutId } = updatedData;
      console.log(JSON.stringify(dataWithoutId));
      const response = await fetch(
        `https://api-assignment.inveesync.in/process/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataWithoutId),
        }
      );

      if (!response.ok) {
        toast.error("Failed to update process");
        throw new Error("Failed to update process");
      }

      // Update local state with the updated process
      setProcessData((prevItems) => {
        // Ensure prevItems is an array before calling map
        if (!Array.isArray(prevItems)) {
          console.error("prevItems is not an array:", prevItems);
          return prevItems; // Return prevItems unchanged if not an array
        }

        return prevItems.map((process) =>
          process.id === updatedData.id
            ? { ...process, ...updatedData }
            : process
        );
      });

      setShowModal(false);
      setSelectedProcess(null);
      toast.success("Process updated successfully!");
    } catch (error) {
      console.error("Failed to update process:", error);
      toast.error("Failed to update process");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProcess = async (createData) => {
    setIsLoading(true);
    // Construct the process data with dummy values
    const processData = {
      process_name: createData.process_name,
      factory_id: createData.factory_id, // Dummy value
      tenant_id: createData.tenant_id, // Dummy value
      type: "internal",
      created_by: "user3", // Dummy value
      last_updated_by: "user3", // Dummy value
      createdAt: new Date().toISOString(), // Current time as ISO string
      updatedAt: new Date().toISOString(), // Current time as ISO string
    };

    console.log("Process Data to be posted:", processData);

    try {
      const response = await fetch(
        "https://api-assignment.inveesync.in/process",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(processData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save the process");
      }

      const savedData = await response.json();
      console.log("Process saved successfully:", savedData);

      // Add the new process to the list in the parent component
      setProcessData((prevData) => [...prevData, savedData]);
      toast.success("Process saved successfully!");
      setNewProcess(false);
    } catch (error) {
      console.error("Error saving process:", error);
      toast.error("An error occurred while saving the process");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <Loader />}
      <div className={styles.processSearchQuery}>
        <button className={styles.addItemButton} onClick={() => setNewProcess(true)}>
          Add New Process
        </button>
        <input
          type="text"
          placeholder="Search by Item Name..."
          value={searchQuery}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
      </div>
      <section className={styles.itemsTable}>
        {filteredItems.length > 0 ? (
          <table className={styles.processTableContainer}>
            <thead>
              <tr>
                <th>Process Name</th>
                <th>Tenant Id</th>
                <th>Factory Id</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((process) => (
                <tr key={process.id}>
                  <td>{process.process_name}</td>
                  <td>{process.tenant_id}</td>
                  <td>{process.factory_id}</td>
                  <td className={styles.actions}>
                    <FaEdit
                      className={styles.editIcon}
                      onClick={() => handleResolveClick(process)}
                      title="Edit Process"
                    />
                    <FaTrashAlt
                      className={styles.deleteIcon}
                      onClick={() => handleDelete(process.id)}
                      title="Delete Process"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.noProcessFound}>No process found</div>
        )}
      </section>
      {/* Modal for edit process */}
      {showModal && selectedProcess && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Edit Process</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updatedData = {
                  ...selectedProcess,
                  process_name: formData.get("process_name"),
                  tenant_id: parseInt(formData.get("tenant_id"), 10), // Convert to number
                  factory_id: parseInt(formData.get("factory_id"), 10),
                };
                handleUpdateProcess(updatedData);
              }}
            >
              <label>
                Process Name:
                <input
                  type="text"
                  name="process_name"
                  defaultValue={selectedProcess.process_name}
                  style={{width: "90%"}}
                />
              </label>
              <label>
                Tenant Id:
                <input
                  type="text"
                  name="tenant_id"
                  defaultValue={selectedProcess.tenant_id}
                  style={{width: "90%"}}
                />
              </label>
              <label>
                Factory ID:
                <input
                  type="text"
                  name="factory_id"
                  defaultValue={selectedProcess.factory_id}
                  style={{width: "90%"}}
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
      {/* Modal for create process */}
      {newProcess && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Create Process</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const createData = {
                  process_name: formData.get("process_name"),
                  tenant_id: parseInt(formData.get("tenant_id"), 10), // Convert to number
                  factory_id: parseInt(formData.get("factory_id"), 10),
                };
                handleCreateProcess(createData);
              }}
            >
              <label>
                Process Name:
                <input type="text" name="process_name" required style={{width: "90%"}}/>
              </label>
              <label>
                Tenant Id:
                <input type="number" name="tenant_id" required style={{width: "90%"}}/>
              </label>
              <label>
                Factory ID:
                <input type="number" name="factory_id" required style={{width: "90%"}}/>
              </label>

              {/* Button Container */}
              <div className={styles.buttonContainer}>
                <button type="submit" className={styles.submitButton}>
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setNewProcess(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Processes;
