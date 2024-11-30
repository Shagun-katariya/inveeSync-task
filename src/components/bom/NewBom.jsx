import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./NewBom.module.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import Loader from "../loader/Loader.jsx";
import { useDebounce } from "use-debounce";

const NewBom = ({ items }) => {
  const [components, setComponents] = useState([]);
  const [newComponent, setNewComponent] = useState({
    component_id: "",
    quantity: "",
    item_id: "",
  });
  const [selectedComponent, setSelectedComponent] = useState(null); // Track the selected item for resolving
  const [componentModal, setComponentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  // Fetch components on mount
  useEffect(() => {
    const fetchComponents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("https://api-assignment.inveesync.in/bom");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const newData = data.map((component) => {
          const matchingItem = items.find(
            (item) => item.id === component.item_id
          );
          return {
            ...component,
            internal_item_name: matchingItem?.internal_item_name || "Unknown",
          };
        });

        setComponents(newData);
      } catch (error) {
        toast.error("Failed to fetch bom");
        console.error("Failed to fetch bom:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComponents();
  }, [items]);

  // Memoize filtered items to reduce recalculations
  const filteredItems = useMemo(() => {
    if (!debouncedQuery) return components;
    return components.filter((item) =>
      item.internal_item_name.toLowerCase().includes(debouncedQuery)
    );
  }, [debouncedQuery, components]);

  // Handle search input changes
  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  // Handle adding a new component
  const handleAddComponent = async () => {
    if (
      !newComponent.component_id ||
      !newComponent.item_id ||
      !newComponent.quantity
    ) {
      toast.error("Input values are missing");
      return;
    }

    // Check if the component already exists
    const exists = components.some(
      (component) =>
        component.component_id === Number(newComponent.component_id) &&
        component.item_id === Number(newComponent.item_id)
    );

    if (exists) {
      toast.error("Component already exists");
      return;
    }

    setIsLoading(true);
    const payload = {
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
      setComponents((prevComponents) => [...prevComponents, savedData]);
      setNewComponent({ component_id: "", quantity: "", item_id: "" });
      toast.success("Component added successfully!");
    } catch (error) {
      toast.error("Failed to create component");
      console.error("Failed to create component:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateComponent = async (updatedData) => {
    const exists = components.some(
      (component) =>
        component.component_id === updatedData.component_id &&
        component.item_id === updatedData.item_id &&
        component.id !== updatedData.id
    );

    if (exists) {
      toast.error("A component with the same ID already exists");
      return;
    }

    setIsLoading(true);
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

      // Update local state
      setComponents((prevItems) =>
        prevItems.map((item) =>
          item.id === updatedData.id ? { ...item, ...updatedData } : item
        )
      );

      setComponentModal(false);
      setSelectedComponent(null);
      toast.success("Bom updated successfully!");
    } catch (error) {
      console.error("Failed to update bom:", error);
      toast.error("Failed to update bom");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resolving a component
  const handleResolveClick = (component) => {
    setSelectedComponent(component);
    setComponentModal(true);
  };

  // Handle deleting a component
  const handleDeleteComponent = async (id) => {
    setIsLoading(true);
    try {
      setComponents((prevItems) => prevItems.filter((item) => item.id !== id));

      const response = await fetch(
        `https://api-assignment.inveesync.in/bom/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete the item.");
      }

      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {" "}
      {isLoading && <Loader />}
      <div className={styles.bomBuilder}>
        <h2>Bill of Materials Builder</h2>
        <p>Define product composition and component relationships</p>

        <form className={styles.bomForm}>
          {/* Add Component Form */}
          <div className={styles.searchInputQuery}>
            <h3>Add Bom</h3>
            <input
              type="text"
              placeholder="Search by Item Name..."
              value={searchQuery}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.addComponentForm}>
            <select
              value={newComponent.component_id}
              onChange={(e) =>
                setNewComponent({
                  ...newComponent,
                  component_id: e.target.value,
                })
              }
              required
            >
              <option value="">Select Component ID</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.internal_item_name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Quantity"
              required
              value={newComponent.quantity}
              onChange={(e) =>
                setNewComponent({ ...newComponent, quantity: e.target.value })
              }
            />
            <select
              value={newComponent.item_id}
              required
              onChange={(e) =>
                setNewComponent({ ...newComponent, item_id: e.target.value })
              }
            >
              <option value="">Select Item ID</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.internal_item_name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.addButton}
              onClick={handleAddComponent}
            >
              Add
            </button>
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
                    <td>{component.component_id}</td>
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
                        onClick={() => handleResolveClick(component)}
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
              <div className={styles.noData}>
                No matching components found.
              </div>
            )}
          </div>
        </form>
        {componentModal && selectedComponent && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Edit Component</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const updatedData = {
                    ...selectedComponent,
                    component_id: Number(formData.get("component_id")),
                    item_id: Number(formData.get("item_id")),
                    quantity: Number(formData.get("quantity")),
                  };
                  handleUpdateComponent(updatedData);
                }}
              >
                <label>
                  Component Id:
                  <select
                    value={selectedComponent.component_id}
                    name="component_id"
                    required
                    onChange={(e) =>
                      setSelectedComponent((prevItem) => ({
                        ...prevItem,
                        component_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Component ID</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.internal_item_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Item Id:
                  <select
                    value={selectedComponent.item_id}
                    name="item_id"
                    required
                    onChange={(e) =>
                      setSelectedComponent((prevItem) => ({
                        ...prevItem,
                        item_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Component ID</option>
                    {items.map((item) => (
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
                    value={selectedComponent.quantity}
                    required
                    onChange={(e) =>
                      setSelectedComponent((prevItem) => ({
                        ...prevItem,
                        quantity: e.target.value,
                      }))
                    }
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
        )}
      </div>
    </>
  );
};

export default NewBom;
