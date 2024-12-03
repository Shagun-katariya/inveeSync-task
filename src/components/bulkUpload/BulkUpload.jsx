import React, { useState } from "react";
import styles from "./BulkUpload.module.css";
import Papa from "papaparse";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../loader/Loader.jsx";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../../Redux/slices/itemSlice.js";
import { addBom } from "../../Redux/slices/bomSlice.js";
import { startLoading, stopLoading } from "../../Redux/slices/loadingSlice.js";
import { v4 as uuidv4 } from "uuid";

const BulkUpload = ({
  onClose,
  uploadSuccess,
  setUploadSuccess,
  records,
  setRecords,
  selectedSidebarItem,
}) => {
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [showErrorConsole, setShowErrorConsole] = useState(false);
  const [skipHeader, setSkipHeader] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { items, error } = useSelector((state) => state.items);
  const boms = useSelector((state) => state.boms.components);
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

  const handleCreateItem = async (createdData) => {
    console.log("createdData: ", createdData);
    const minBuffer = createdData.min_buffer ?? Math.floor(Math.random() * 5); // Random value between 0-5
    const maxBuffer =
      createdData.max_buffer ?? minBuffer + Math.floor(Math.random() * 10 + 1); // Ensure max_buffer >= min_buffer

    createdData.status = "Complete";

    // Step 2: Generate random tenant_id and construct the item data
    const itemData = {
      id: createdData.id || generateUniqueId(),
      internal_item_name: createdData.internal_item_name,
      tenant_id: createdData.tenant_id || Math.floor(Math.random() * 1000), // Random tenant ID
      item_description: createdData.item_description || "sample Item",
      uom: createdData.uom,
      created_by: "user1",
      last_updated_by: "user2",
      type: createdData.type,
      max_buffer: createdData.max_buffer || maxBuffer,
      min_buffer: createdData.min_buffer || minBuffer,
      customer_item_name: createdData.customer_item_name || "Customer ABC",
      is_deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      additional_attributes: {
        drawing_revision_number: createdData.drawing_revision_number || 1,
        drawing_revision_date:
          createdData.drawing_revision_date || "2023-04-01",
        avg_weight_needed:
          createdData.additional_attributes__avg_weight_needed ?? true,
        scrap_type:
          createdData.additional_attributes__scrap_type ||
          (createdData.type === "sell" ? "default_scrap" : null),
        shelf_floor_alternate_name:
          createdData.shelf_floor_alternate_name || "shelf_1",
      },
    };

    // Step 3: Send the request to the API
    try {
      dispatch(startLoading());
      console.log("itemData: ", JSON.stringify(itemData));
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

      dispatch(addItem(savedData));
    } catch (error) {
      console.error("Failed to create item:", error);
      toast.error("Failed to create item");
    } finally {
      dispatch(stopLoading()); // Hide loader after operation is complete
    }
  };

  const handleSkipHeaderChange = (e) => {
    setSkipHeader(e.target.checked);
  };

  const validateRecord = (item) => {
    const issues = [];

    const isDuplicate = items.some(
      (existingItem) =>
        existingItem.internal_item_name === item.internal_item_name &&
        existingItem.tenant_id === item.tenant_id
    );

    if (isDuplicate) {
      issues.push("Duplicate combination of internal_item_name and tenant_id");
    }

    // Key validations
    if (!item.internal_item_name || item.internal_item_name == "null") {
      issues.push("Missing Item Name");
    }
    if (!item.tenant_id || item.tenant_id == "null") {
      issues.push("Missing Tenant ID");
    }
    if (!item.type || item.type == "null") {
      issues.push("Missing Type");
    } else if (
      item.type != "sell" &&
      item.type != "purchase" &&
      item.type != "component"
    ) {
      issues.push("Invalid Type");
    }

    // Non-null scrap_type for items with type = sell
    if (
      item.type === "sell" &&
      (!item.additional_attributes__scrap_type ||
        item.additional_attributes__scrap_type == "")
    ) {
      issues.push("Missing Scrap Type for items with type 'sell'");
    }

    // Min buffer validations for sell and purchase
    if (
      (item.type === "sell" || item.type === "purchase") &&
      (!item.min_buffer || item.min_buffer == "null")
    ) {
      issues.push(
        "Min Buffer is required for items with type 'sell' or 'purchase'"
      );
    } else if (item.type === "sell" || item.type === "purchase") {
      item.min_buffer = item.min_buffer == "null" ? 0 : item.min_buffer;
      item.max_buffer = item.max_buffer == "null" ? 0 : item.max_buffer;

      if (Number(item.max_buffer) < Number(item.min_buffer)) {
        issues.push("Max Buffer must be greater than or equal to Min Buffer");
      }
    }

    if (
      (item.max_buffer && item.max_buffer < 0) ||
      (item.min_buffer && item.min_buffer < 0)
    ) {
      issues.push("Negative Buffer Value");
    }

    // Missing or invalid UOM
    if (!item.uom) {
      issues.push("Missing UOM");
    } else if (!["kgs", "nos"].includes(item.uom.toLowerCase())) {
      issues.push("Invalid UoM value (not kgs/nos)");
    }

    // Avg weight needed validations
    const avgWeightNeeded = item.additional_attributes__avg_weight_needed;
    console.log("avgWeightNeeded: ", avgWeightNeeded);
    if (avgWeightNeeded == null || avgWeightNeeded === "") {
      issues.push("Avg weight needed is missing");
    } else if (avgWeightNeeded != "TRUE" && avgWeightNeeded != "FALSE") {
      issues.push("Avg weight needed not boolean");
    }

    // Date validation
    const createdAt = new Date(item.createdAt);
    const updatedAt = new Date(item.updatedAt);
    if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
      issues.push("Invalid date provided for createdAt or updatedAt");
    }

    // Set item status based on issues
    item.status = issues.length > 0 ? "Pending" : "Complete";

    console.log("issues: ", issues);

    return { data: item, issues };
  };

  const validBomRecord = (bom, itemMaster) => {
    const issues = [];

    const exists = boms.some(
      (component) =>
        component.component_id === Number(bom.component_id) &&
        component.item_id === Number(bom.item_id)
    );

    if (exists) {
      issues.push("Duplicate combination of item_id and component_id");
    }

    const matchingComponent = itemMaster.find(
      (item) => Number(item.id) === Number(bom.component_id)
    );

    if (matchingComponent && matchingComponent.type === "sell") {
      issues.push("Sell item cannot be a component in BOM");
    }

    const matchingItem = itemMaster.find(
      (item) => Number(item.id) === Number(bom.item_id)
    );

    if (!matchingItem || !matchingComponent) {
      issues.push("BOM cannot be created for items not created yet");
    }
    if (matchingItem && matchingItem.type === "purchase") {
      issues.push("purchase item cannot be a item in BOM");
    }

    // Item ID + Component ID combination should be unique
    if (bom.item_id && bom.component_id && bom.item_id === bom.component_id) {
      issues.push("Item id + component id should be unique");
    }

    // Quantity validation
    if (bom.quantity < 1 || bom.quantity > 100) {
      issues.push("Quantity should be between 1 to 100");
    }

    console.log("issues: ", issues);

    return { data: bom, issues };
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleCreateComponent = async (createdData) => {
    dispatch(startLoading());
    const payload = {
      id: createdData.id || generateUniqueId(),
      component_id: Number(createdData.component_id),
      quantity: Number(createdData.quantity),
      item_id: Number(createdData.item_id),
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
    } catch (error) {
      toast.error("Failed to create component");
      console.error("Failed to create component:", error);
    } finally {
      dispatch(stopLoading());
    }
  };

  const handleUpload = () => {
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      Papa.parse(e.target.result, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const seenCombinations = new Set();
          const parsedRecords = results.data.map((record, index) => {
            let validation;
            if (selectedSidebarItem.includes("Items")) {
              validation = validateRecord(record);
              // Validate uniqueness of internal_item_name + tenant
              const uniqueKey = `${record.internal_item_name}-${record.tenant_id}`;
              if (seenCombinations.has(uniqueKey)) {
                validation.issues.push(
                  `Duplicate combination of internal_item_name and tenant: ${uniqueKey}`
                );
              } else {
                seenCombinations.add(uniqueKey);
              }
            } else {
              validation = validBomRecord(record, items);
              // Validate uniqueness of internal_item_name + tenant
              const uniqueKey = `${record.item_id}-${record.component_id}`;
              if (seenCombinations.has(uniqueKey)) {
                validation.issues.push(
                  `Duplicate combination of item_id and tenant_id: ${uniqueKey}`
                );
              } else {
                seenCombinations.add(uniqueKey);
              }
            }

            return {
              id: index + 1,
              ...validation.data,
              errors: validation.issues.join("; "),
            };
          });

          const failedRecords = parsedRecords.filter((record) => record.errors);
          console.log("failedRecords: ", failedRecords);
          console.log("parsedData: ", parsedRecords);
          if (
            failedRecords.length === 0 &&
            selectedSidebarItem.includes("Items")
          ) {
            // console.log("0");
            parsedRecords.forEach((entry) => handleCreateItem(entry));
          } else {
            parsedRecords.forEach((entry) => handleCreateComponent(entry));
          }
          setRecords(parsedRecords);
          setUploadErrors(failedRecords);
          if (failedRecords.length == 0) {
            setShowErrorConsole(false);
          } else {
            setShowErrorConsole(true);
          }
          setIsUploading(false);
          setUploadSuccess(failedRecords.length === 0);

          if (failedRecords.length === 0) {
            toast.success("File uploaded and validated successfully!");
            setFile(null);
          } else {
            toast.error("File uploaded with errors, please review and fix");
          }
        },
        error: (error) => {
          console.error("Error parsing file:", error);
          setIsUploading(false);
        },
      });
    };

    reader.readAsText(file);
  };

  const handleDownloadErrors = () => {
    if (!uploadErrors.length) {
      toast.info("No errors to download!");
      return;
    }

    const csvData = Papa.unparse(
      uploadErrors.map((record) => ({
        ...record,
        errors: record.errors,
      }))
    );

    console.log("error data: ", csvData);

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ErrorRecords.csv";
    link.click();
  };

  const buttonText = selectedSidebarItem.includes("Items")
    ? "Upload Bulk Item Data"
    : "Upload Bulk Bom Data";

  return (
    <>
      {isLoading && <Loader />}
      {uploadSuccess && (
        <div className={styles.bulkUploadModal}>
          <div className={styles.modalContent}>
            <button
              className={styles.closeButton}
              style={{ background: "#888" }}
              onClick={onClose}
            >
              ×
            </button>
            <h2>{buttonText}</h2>
            <div
              className={styles.fileDropZone}
              onClick={() => document.getElementById("file-input").click()}
            >
              {file ? (
                <p>{file.name}</p>
              ) : (
                <>
                  <p>Drag and drop files here</p>
                  <p>or</p>
                  <button className={styles.browseButton}>Browse Files</button>
                  <input
                    type="file"
                    id="file-input"
                    onChange={handleFileChange}
                    accept=".csv"
                    hidden
                  />
                </>
              )}
            </div>

            <p>Supported file types: .csv</p>

            <div className={styles.toggleContainer}>
              <label
                className={styles.toggleSwitch}
                style={{ marginBottom: "0" }}
              >
                <input
                  type="checkbox"
                  id="skip-header"
                  checked={skipHeader}
                  onChange={handleSkipHeaderChange}
                />
                <span className={styles.toggleSlider}></span>
              </label>
              <span className={styles.toggleLabel}>Skip header row</span>
            </div>

            <div className={styles.buttonContainer}>
              <button className={styles.cancelButton} onClick={onClose}>
                Cancel
              </button>
              <button
                className={styles.uploadButton}
                onClick={handleUpload}
                disabled={isUploading || !file}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showErrorConsole && (
        <div className={styles.bulkUploadModal}>
          <div className={styles.modalContent}>
            <h3>Error Management Console</h3>
            <div className={styles.consoleSection}>
              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <span>Total Records:</span>
                  <span>{records.length}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Successful:</span>
                  <span>{records.length - uploadErrors.length}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Failed:</span>
                  <span>{uploadErrors.length}</span>
                </div>
              </div>
              <div className={styles.buttonContainer}>
                <button className={styles.cancelUploadButton} onClick={onClose}>
                  Cancel Upload
                </button>
                <button
                  className={styles.applyFixesButton}
                  onClick={handleDownloadErrors}
                >
                  Download Errors
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkUpload;
