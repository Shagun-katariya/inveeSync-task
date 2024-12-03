import React, { useState } from "react";
import styles from "./BulkUpload.module.css";
import Papa from "papaparse";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../loader/Loader.jsx";
import { useSelector } from "react-redux";
const BulkUpload = ({
  onClose,
  uploadSuccess,
  setUploadSuccess,
  records,
  setRecords,
  selectedSidebarItem,
}) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [showErrorConsole, setShowErrorConsole] = useState(false);
  const [skipHeader, setSkipHeader] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { items, error } = useSelector((state) => state.items);

  const handleSkipHeaderChange = (e) => {
    setSkipHeader(e.target.checked);
  };

  const validateRecord = (item) => {
    const issues = [];

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

  const handleUpload = () => {
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      Papa.parse(e.target.result, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedRecords = results.data.map((record, index) => {
            let validation;
            if (selectedSidebarItem.includes("Items")) {
              validation = validateRecord(record);
            } else {
              validation = validBomRecord(record, items);
            }
            return {
              id: index + 1,
              ...validation.data,
              errors: validation.issues.join("; "),
            };
          });

          const failedRecords = parsedRecords.filter((record) => record.errors);
          console.log("failedRecords: ", failedRecords);
          setRecords(parsedRecords);
          setUploadErrors(failedRecords);
          if(failedRecords.length == 0){
            setShowErrorConsole(false);
          }else{
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
