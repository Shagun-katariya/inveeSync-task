import React, { useState, useEffect } from "react";
import styles from "./Dashboard.module.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ItemMaster from "../itemMaster/ItemMaster.jsx";
import Processes from "../processes/Processes.jsx";
import NewBom from "../bom/NewBom.jsx";
import ProcessSteps from "../processSteps/ProcessSteps.jsx";
import BulkUpload from "../bulkUpload/BulkUpload.jsx";
import AuditLogs from "../auditLogs/AuditLogs.jsx";
import Loader from "../loader/Loader.jsx";
import { FaBars, FaTimes } from "react-icons/fa";

const Dashboard = () => {
  const [items, setItems] = useState([]);
  //error items
  const [pendingItems, setPendingItems] = useState([]);
  //for edit
  const [selectedItem, setSelectedItem] = useState(null); // Track the selected item for resolving
  const [showModal, setShowModal] = useState(false); // Track modal visibility
  const [showNewItemModal, setshowNewItemModal] = useState(false); // Track modal visibility
  const [selectedSidebarItem, setSelectedSidebarItem] =
    useState("Items Master");
  const [edit, setEdit] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen); // Toggle sidebar open/close
  };
  const [pendingOpen, setPendingOpen] = useState(false);

  const handleTogglepending = () => {
    setPendingOpen(!pendingOpen); // Toggle sidebar open/close
  };
  // Fetch items from API
  useEffect(() => {
    setIsLoading(true);
    const fetchItems = async () => {
      try {
        const response = await fetch(
          "https://api-assignment.inveesync.in/items"
        );
        if (!response.ok) {
          toast.error(`HTTP error! status: ${response.status}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Check for missing columns and populate pending items
        const pending = [];
        const transformedItems = data.map((item) => {
          const issues = [];
          if (!item.internal_item_name) issues.push("Missing Item Name");
          if (!item.type) issues.push("Missing Type");
          if (!item.uom) issues.push("Missing UOM");

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

          return {
            id: item.id,
            internal_item_name: item.internal_item_name || "Not Found",
            type: item.type,
            uom: item.uom,
            status: issues.length > 0 ? "Pending" : "Complete",
          };
        });

        setItems(transformedItems);
        setPendingItems(pending);
      } catch (error) {
        toast.error("Failed to fetch items");
        console.error("Failed to fetch items:", error);
      } finally {
        setIsLoading(false); // Hide loader after data fetching is complete
      }
    };

    fetchItems();
  }, []);

  const handleModalClose = () => {
    setShowBulkUpload(!showBulkUpload); // Close the modal
  };

  // Handle Resolve Now Click
  const handleResolveClick = (item, editable) => {
    if (editable == "edit") {
      setEdit(true);
    } else {
      setEdit(false);
    }
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleSelectSidebarItems = (item) => {
    console.log("upload: ", item);
    setSelectedSidebarItem(item);
    if (item == "Audit Logs") {
      setShowAuditLogs(true);
    }
    if (item == "Bulk Upload") {
      setShowBulkUpload(true);
      setUploadSuccess(true);
    }
  };

  //Delete Item
  const handleDelete = async (itemId) => {
    setIsLoading(true);
    const itemToDelete = items.find((item) => item.id === itemId);
    try {
      // Find the item that was clicked for deletion

      if (!itemToDelete) {
        throw new Error("Item not found.");
      }

      // Optimistically remove the item from the UI
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));

      // Make DELETE request to the server
      const response = await fetch(
        `https://api-assignment.inveesync.in/items/${itemId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Key Constraint Error");
      }

      const data = await response.json();
      console.log("Deleted item with ID:", data.id);

      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(error.message);

      // Revert the state if the deletion fails by adding the original item back
      setItems((prevItems) => [...prevItems, itemToDelete]);
    } finally {
      setIsLoading(false); // Hide loader after data fetching is complete
    }
  };

  // Handle Create Item
  const handleCreate = async (createdData) => {
    console.log("createdData: ", createdData);
    // Construct the process data with dummy values
    setIsLoading(true);
    const itemData = {
      internal_item_name: createdData.internal_item_name,
      tenant_id: 123, // Dummy value
      item_description: "sample Item", // Dummy value
      uom: createdData.uom,
      created_by: "user1", // Dummy value
      last_updated_by: "user2", // Dummy value
      type: createdData.type,
      max_buffer: 10,
      min_buffer: 5,
      customer_item_name: "Customer ABC",
      is_deleted: false,
      createdAt: new Date().toISOString(), // Current time as ISO string
      updatedAt: new Date().toISOString(), // Current time as ISO string
      additional_attributes: {
        drawing_revision_number: 1,
        drawing_revision_date: "2023-04-01",
        avg_weight_needed: 2.5,
        scrap_type: "scrap_a",
        shelf_floor_alternate_name: "shelf_1",
      },
    };

    try {
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

      savedData.status = "complete";

      // Add the new process to the list in the parent component
      setItems((prevData) => [...prevData, savedData]);
      setshowNewItemModal(false);
      toast.success("Item Created successfully!");
    } catch (error) {
      console.error("Failed to create item:", error);
      toast.error("Failed to create item");
    } finally {
      setIsLoading(false); // Hide loader after data fetching is complete
    }
  };

  //Handle Update Item
  const handleUpdate = async (updatedData) => {
    setIsLoading(true);
    try {
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

      // Update local state
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === updatedData.id
            ? { ...item, ...updatedData, status: "Complete" }
            : item
        )
      );
      setPendingItems((prevPending) =>
        prevPending.filter((pending) => pending.id !== updatedData.id)
      );

      setShowModal(false);
      setSelectedItem(null);
      toast.success("Item updated successfully!");
    } catch (error) {
      console.error("Failed to update item:", error);
      toast.error("Failed to update item");
    } finally {
      setIsLoading(false); // Hide loader after data fetching is complete
    }
  };

  //Download Template
  const handleTemplate = () => {
    if (!records || records.length === 0) {
      toast.error("No records available to generate the template.");
      return;
    }

    console.log(records);

    // Extract headers from the keys of the first record
    const headers = Object.keys(records[0]).filter((key) => key !== "id"); // Exclude 'id' if not needed
    const dataRows = records.map(
      (record) => headers.map((header) => record[header] || "") // Map each record to its values
    );

    // Combine headers and data rows
    const csvContentArray = [headers, ...dataRows];

    // Convert the array to a CSV string
    const csvContent = csvContentArray.map((row) => row.join(",")).join("\n");

    // Create a Blob from the CSV string
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a temporary link element
    const link = document.createElement("a");

    // Set the link's download attribute with the filename
    link.download = "dynamic_template.csv";

    // Create a URL for the Blob object and set it as the link's href
    if (navigator.msSaveBlob) {
      // For IE
      navigator.msSaveBlob(blob, "dynamic_template.csv");
    } else {
      link.href = URL.createObjectURL(blob);
      link.click(); // Simulate the download by clicking the link
      URL.revokeObjectURL(link.href); // Clean up the URL object
    }

    toast.success("File downloaded successfully!");
  };

  return (
    <>
      {isLoading && <Loader />}
      <div className={styles.dashboardContainer}>
        {/* Sidebar */}
        <button className={styles.sidebarToggle} onClick={handleToggleSidebar}>
          {sidebarOpen ? <FaTimes /> : <FaBars />} {/* Toggle icon */}
        </button>
        <aside
          className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}
        >
          {" "}
          {/* Toggle button */}
          <h3>Setup Progress</h3>
          <ul>
            <li className={styles.completed}>Tenant Configuration</li>

            <li
              className={
                selectedSidebarItem === "Items Master" ? styles.selected : ""
              }
              onClick={() => handleSelectSidebarItems("Items Master")}
            >
              Items Master
            </li>
            <li
              className={
                selectedSidebarItem === "Processes" ? styles.selected : ""
              }
              onClick={() => handleSelectSidebarItems("Processes")}
            >
              Processes
            </li>
            <li
              className={
                selectedSidebarItem === "Bill of Materials"
                  ? styles.selected
                  : ""
              }
              onClick={() => handleSelectSidebarItems("Bill of Materials")}
            >
              Bill of Materials
            </li>
            <li
              className={
                selectedSidebarItem === "Process Steps" ? styles.selected : ""
              }
              onClick={() => handleSelectSidebarItems("Process Steps")}
            >
              Process Steps
            </li>
          </ul>
          <div className={styles.quickActions}>
            <h4>Quick Actions</h4>
            <button onClick={() => handleSelectSidebarItems("Bulk Upload")}>
              Upload Bulk Data
            </button>
            <button onClick={handleTemplate}>Download Templates</button>
            <button onClick={() => handleSelectSidebarItems("Audit Logs")}>
              View Audit Log
            </button>
          </div>
        </aside>
        {/* Main Content */}
        <main className={styles.mainContent}>
          <header>
            <h1>Data Onboarding</h1>
          </header>
          <section className={styles.summaryCards}>
            {/* we can set these values dynamically  */}
            <div className={styles.card}>
              <h2>Processes</h2>
              <p>12</p>
            </div>
            <div className={styles.card}>
              <h2>BOMs</h2>
              <p>
                28<span>/35</span>
              </p>
              <div className={styles.progressBar}>
                <div
                  className={styles.progress}
                  style={{ width: "80%" }}
                ></div>
              </div>
            </div>
          </section>

          {/* Item */}
          {selectedSidebarItem == "Items Master" && (
            <ItemMaster
              items={items}
              setItems={setItems}
              handleResolveClick={handleResolveClick}
              handleDelete={handleDelete}
              setshowNewItemModal={setshowNewItemModal}
            />
          )}
          {/* {Process} */}
          {selectedSidebarItem == "Processes" && <Processes />}
          {/* Bom */}
          {selectedSidebarItem == "Bill of Materials" && (
            <NewBom items={items} />
          )}
          {/* Process-step  */}
          {selectedSidebarItem == "Process Steps" && (
            <ProcessSteps items={items} />
          )}
          {/* Bulk Upload  */}
          {selectedSidebarItem == "Bulk Upload" && showBulkUpload && (
            <BulkUpload
              onClose={handleModalClose}
              uploadSuccess={uploadSuccess}
              setUploadSuccess={setUploadSuccess}
              records={records}
              setRecords={setRecords}
            />
          )}
          {/* Audit Logs  */}
          {selectedSidebarItem == "Audit Logs" && showAuditLogs && (
            <AuditLogs onClose={() => setShowAuditLogs(false)} />
          )}
        </main>

        {/* Pending Setup */}
        <button className={styles.pendingToggle} onClick={handleTogglepending}>
          {pendingOpen ? <FaTimes /> : <FaBars />}{" "}
          {/* Toggle icon based on pendingOpen state */}
        </button>

        <aside
          className={`${styles.pendingSetup} ${pendingOpen ? styles.open : ""}`}
        >
          <h3>Pending Setup</h3>
          {pendingItems.length > 0 ? (
            <ul>
              {pendingItems.map((item) => (
                <li key={item.id}>
                  <p>
                    <strong>{item.internal_item_name}</strong>
                    <br />
                    {item.issues.join(", ")}
                  </p>
                  <button onClick={() => handleResolveClick(item)}>
                    Resolve Now ➡
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noPendingItems}>No pending items.</p>
          )}
        </aside>

        {/* Modal for Resolving Issues */}
        {showModal && selectedItem && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              {edit && <h2>Edit Item</h2>}
              {!edit && <h2>Resolve Item Issues</h2>}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const updatedData = {
                    ...selectedItem,
                    internal_item_name: formData.get("internal_item_name"),
                    type: formData.get("type"),
                    uom: formData.get("uom"),
                  };
                  handleUpdate(updatedData);
                }}
              >
                <label>
                  Item Name:
                  <input
                    type="text"
                    name="internal_item_name"
                    value={selectedItem.internal_item_name}
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
                    onChange={(e) =>
                      setSelectedItem((prevItem) => ({
                        ...prevItem,
                        type: e.target.value,
                      }))
                    }
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
                        selectedItem.issues.includes("Missing Type")
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
                    <option value="" disabled selected>
                      Select UOM
                    </option>
                    <option value="kgs">KGS</option>
                    <option value="nos">NOS</option>
                  </select>
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
        {showNewItemModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Create Item</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const createdData = {
                    internal_item_name: formData.get("internal_item_name"),
                    type: formData.get("type"),
                    uom: formData.get("uom"),
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
                  <select name="type" required>
                    <option value="" disabled selected>
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
                    <option value="" disabled selected>
                      Select UOM
                    </option>
                    <option value="kgs">KGS</option>
                    <option value="nos">NOS</option>
                  </select>
                </label>

                {/* Button Container */}
                <div className={styles.buttonContainer}>
                  <button type="submit" className={styles.submitButton}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setshowNewItemModal(false)}
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

export default Dashboard;
