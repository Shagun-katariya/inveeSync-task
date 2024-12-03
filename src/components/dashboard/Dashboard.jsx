import React, { useState, useEffect } from "react";
import styles from "./Dashboard.module.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ItemMaster from "../itemMaster/ItemMaster.jsx";
import NewBom from "../bom/NewBom.jsx";
import BulkUpload from "../bulkUpload/BulkUpload.jsx";
import Loader from "../loader/Loader.jsx";
import { FaBars, FaTimes } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import Modal from "../modal/Modal.jsx";
import { showModal } from "../../Redux/slices/modalSlice.js";
import { fetchItems } from "../../Redux/slices/itemSlice";
import { v4 as uuidv4 } from "uuid";
import ComponentModal from "../componentModal/ComponentModal.jsx";
import AuditLogs from "../auditLogs/AuditLogs.jsx";

const Dashboard = () => {
  const [selectedItem, setSelectedItem] = useState(null); // Track the selected item for resolving
  const [selectedSidebarItem, setSelectedSidebarItem] = useState("Items Master");
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [records, setRecords] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen); // Toggle sidebar open/close
  };
  const [componentModal, setComponentModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  // Handle resolving a component
  const handleResolveBomClick = (component) => {
    setSelectedComponent(component);
    setComponentModal(true);
  };
  const buttonText = selectedSidebarItem.includes("Items")
    ? "Upload Bulk Item Data"
    : "Upload Bulk Bom Data";

  const dispatch = useDispatch();
  const isModal = useSelector((state) => state.modal);
  const isLoading = useSelector((state) => state.loading);
  const pendingItems = useSelector((state) => state.pendingItems);

  const handleTogglepending = () => {
    setPendingOpen(!pendingOpen); // Toggle sidebar open/close
  };

  useEffect(() => {
    dispatch(fetchItems());
    console.log("pendingItems: ", pendingItems);
  }, []);

  const handleModalClose = () => {
    setShowBulkUpload(!showBulkUpload); // Close the modal
  };

  const handleSelectSidebarItems = (item) => {
    setSelectedSidebarItem(item);
  };

  // Handle Resolve Now Click
  const handleResolveClick = (item) => {
    console.log("Upation item: ", item);
    setSelectedItem(item);
    dispatch(showModal());
  };

  //Download Template
  const handleTemplate = () => {
    if (!records || records.length === 0) {
      toast.info("Please upload the data and validate it");
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
                selectedSidebarItem === "Bill of Materials"
                  ? styles.selected
                  : ""
              }
              onClick={() => handleSelectSidebarItems("Bill of Materials")}
            >
              Bill of Materials
            </li>
          </ul>
          <div className={styles.quickActions}>
            <h4>Quick Actions</h4>
            <button
              onClick={() => {
                setShowBulkUpload(true);
                setUploadSuccess(true);
              }}
            >
              {buttonText}
            </button>
            <button onClick={handleTemplate}>Download Templates</button>
            <button
              onClick={() => {
                setShowAuditLogs(true);
              }}
            >
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
                <div className={styles.progress} style={{ width: "80%" }}></div>
              </div>
            </div>
          </section>

          {/* Item */}
          {selectedSidebarItem == "Items Master" && (
            <ItemMaster handleResolveClick={handleResolveClick} />
          )}
          {/* Bom */}
          {selectedSidebarItem == "Bill of Materials" && (
            <NewBom
              componentModal={componentModal}
              setComponentModal={setComponentModal}
              handleResolveBomClick={handleResolveBomClick}
              selectedComponent={selectedComponent}
              setSelectedComponent={setSelectedComponent}
            />
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
          {pendingItems.length != 0 ? (
            <ul>
              {pendingItems.map((item) => (
                <li key={uuidv4()} style={{ marginBottom: "1rem" }}>
                  {item.reason ? (
                    <>
                      <p>
                        <strong>Component ID:</strong> {item.component_name}
                        <br />
                        <strong>Issue:</strong> {item.reason}
                      </p>
                      <button onClick={() => handleResolveBomClick({})}>
                        Resolve Now ➡
                      </button>
                    </>
                  ) : item.issues && item.issues.length > 0 ? (
                    <>
                      <p>
                        <strong>{item.internal_item_name}</strong>
                        <br />
                        {item.issues.join(", ")}
                      </p>
                      <button onClick={() => handleResolveClick(item)}>
                        Resolve Now ➡
                      </button>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noPendingItems}>No pending items.</p>
          )}
        </aside>

        {/* Modal for Resolving Issues */}
        {isModal && (
          <Modal
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
          />
        )}
        {componentModal && (
          <ComponentModal
            selectedComponent={selectedComponent}
            setComponentModal={setComponentModal}
            setSelectedComponent={setSelectedComponent}
          />
        )}
        {showAuditLogs && <AuditLogs onClose={() => setShowAuditLogs(false)} />}
        {showBulkUpload && (
          <BulkUpload
            onClose={handleModalClose}
            uploadSuccess={uploadSuccess}
            setUploadSuccess={setUploadSuccess}
            records={records}
            setRecords={setRecords}
            selectedSidebarItem={selectedSidebarItem}
          />
        )}
      </div>
    </>
  );
};

export default Dashboard;
