import React, { useState } from "react";
import styles from "./BulkUpload.module.css";
import Papa from "papaparse";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../loader/Loader.jsx";

const BulkUpload = ({
  onClose,
  uploadSuccess,
  setUploadSuccess,
  records,
  setRecords,
}) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [showErrorConsole, setShowErrorConsole] = useState(false);
  const [skipHeader, setSkipHeader] = useState(false);
  const [formFixes, setFormFixes] = useState({
    supplierItem: "",
    processDescription: "",
    qualityCheck: "",
    conversionRatio: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSkipHeaderChange = (e) => {
    console.log("skipHeader: ", skipHeader);
    setSkipHeader(e.target.checked);
  };

  const validateRecord = (record) => {
    const errors = [];
    const columns = Object.keys(record);

    columns.forEach((column, colIndex) => {
      if (!record[column]) {
        errors.push({
          column,
          columnNumber: colIndex + 1,
          message: `Missing value in column ${column}`,
        });
      }

      if (column === "conversionRatio" && Number(record[column]) <= 0) {
        errors.push({
          column,
          columnNumber: colIndex + 1,
          message: `Invalid conversion ratio`,
        });
      }

      if (column === "supplierItem" && record[column].length < 3) {
        errors.push({
          column,
          columnNumber: colIndex + 1,
          message: `Supplier item name too short`,
        });
      }
    });

    return errors.length ? errors : null;
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFixesChange = (e) => {
    const { name, value } = e.target;
    setFormFixes({ ...formFixes, [name]: value });
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
            const errors = validateRecord(record);
            return { id: index + 1, ...record, error: errors };
          });

          const failedRecords = parsedRecords.filter((record) => record.error);
          setRecords(parsedRecords);
          setUploadErrors(failedRecords);
          setShowErrorConsole(true);
          setIsUploading(false);
          setUploadSuccess(false);

          if (failedRecords.length === 0) {
            toast.success("File uploaded and validated successfully!");
            setFile(null); // Clear the file for a new upload
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

  const handleApplyFixes = () => {
    // Create a copy of the current records and errors
    setIsLoading(true);
    try {
      let updatedRecords = [...records];
      let unresolvedErrors = [];

      console.log("uploadErrors: ", uploadErrors);

      // Loop through each error record
      uploadErrors.forEach((errorRecord) => {
        const updatedRecord = { ...errorRecord }; // Copy the record to update
        console.log("errorRecord: ", errorRecord);

        // Apply form fixes only to columns that have errors
        console.log("formFixes: ", formFixes);
        Object.keys(formFixes).forEach((column) => {
          if (errorRecord.error.some((err) => err.column === column)) {
            // Update only if the current column matches an error in the record
            updatedRecord[column] = formFixes[column]; // Replace value with form input
          }
        });

        // Revalidate the updated record
        const newErrors = validateRecord(updatedRecord) || [];

        // Update the main records array
        const recordIndex = updatedRecords.findIndex(
          (rec) => rec.id === updatedRecord.id
        );
        if (recordIndex !== -1) {
          updatedRecords[recordIndex] = { ...updatedRecord, error: newErrors };
        }

        // Track unresolved errors
        if (newErrors.length > 0) {
          unresolvedErrors.push({ ...updatedRecord, error: newErrors });
        }
      });

      // Update state with resolved records and remaining errors
      setRecords(updatedRecords);
      console.log("Updated Records: ", updatedRecords);
      console.log("Unresolved Errors: ", unresolvedErrors);
      setUploadErrors(unresolvedErrors);

      // Notify the user of the results
      if (unresolvedErrors.length === 0) {
        toast.success(
          "All fixes applied successfully! Data is now error-free."
        );
        setShowErrorConsole(false);
        onClose();
      } else {
        toast.error(
          `${unresolvedErrors.length} records still have errors. Please review and fix them.`
        );
      }
    } catch (error) {
      console.log("error at fixes: ", error);
      toast.error("error occuring at fixes");
    } finally {
      setIsLoading(false);
    }

    // Clear form fixes
    setFormFixes({
      supplierItem: "",
      processDescription: "",
      qualityCheck: "",
      conversionRatio: "",
    });
  };

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
            <h2>Bulk Data Upload</h2>
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
            <h3>Bulk Upload Error Management Console</h3>
            <div className={styles.ErrorContainer}>
              <div className={styles.consoleSection}>
                <div className={styles.summary}>
                  <div className={styles.summaryRow}>
                    <span>Total Records:</span>
                    <span>{records.length}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Successfully Uploaded:</span>
                    <span>{records.length - uploadErrors.length}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Failed Records:</span>
                    <span>{uploadErrors.length}</span>
                  </div>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressSuccess}
                    style={{
                      width: `${
                        ((records.length - uploadErrors.length) /
                          records.length) *
                        100
                      }%`,
                    }}
                  ></div>
                  <div
                    className={styles.progressError}
                    style={{
                      width: `${(uploadErrors.length / records.length) * 100}%`,
                    }}
                  ></div>
                  {/* Display Percentage */}
                  <span className={styles.progressText}>
                    {records.length > 0
                      ? `${Math.round(
                          ((records.length - uploadErrors.length) /
                            records.length) *
                            100
                        )}%`
                      : "0%"}
                    <span>Complete</span>
                  </span>
                </div>

                <div className={styles.errorList}>
                  {uploadErrors.length ? (
                    uploadErrors.map((record) => (
                      <div key={record.id} className={styles.errorItem}>
                        <p>
                          <b>Row:</b> {record.id}
                        </p>
                        {record.error.map((err, idx) => (
                          <div key={idx}>
                            <p>
                              <b>Column:</b> {err.column} (Column{" "}
                              {err.columnNumber})
                            </p>
                            <p>
                              <b>Error:</b> {err.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <p>No errors to display.</p>
                  )}
                </div>
              </div>
              {/* Form Section */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  Error Resolution Form
                </div>
                <form className={styles.errorForm}>
                  <label>
                    Supplier Item Name
                    <input
                      type="text"
                      name="supplierItem"
                      style={{ width: "90%" }}
                      value={formFixes.supplierItem}
                      onChange={handleFixesChange}
                    />
                  </label>
                  <label>
                    Process Description
                    <input
                      type="text"
                      name="processDescription"
                      style={{ width: "90%" }}
                      value={formFixes.processDescription}
                      onChange={handleFixesChange}
                    />
                  </label>
                  <label>
                    Quality Check
                    <input
                      type="text"
                      name="qualityCheck"
                      style={{ width: "90%" }}
                      value={formFixes.qualityCheck}
                      onChange={handleFixesChange}
                    />
                  </label>
                  <label>
                    Conversion Ratio
                    <input
                      type="text"
                      name="conversionRatio"
                      style={{ width: "90%" }}
                      value={formFixes.conversionRatio}
                      onChange={handleFixesChange}
                    />
                  </label>
                </form>
                <div className={styles.buttonContainer}>
                  <button
                    className={styles.cancelUploadButton}
                    onClick={onClose}
                  >
                    Cancel Upload
                  </button>
                  <button
                    className={styles.applyFixesButton}
                    onClick={handleApplyFixes}
                  >
                    Apply Fixes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkUpload;
