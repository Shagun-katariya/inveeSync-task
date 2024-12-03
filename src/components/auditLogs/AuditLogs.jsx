import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./AuditLogs.module.css";
import activityLog from "./activityLog.json";
import { debounce } from "lodash";

const AuditLogs = ({ onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("90");
  const [selectedAction, setSelectedAction] = useState("All");
  const [logsPerPage, setLogsPerPage] = useState(10); // Define the breakpoints for the screen sizes
  const breakpoints = {
    small: 480, // Small devices (phones)
    medium: 768, // Medium devices (tablets)
    large: 1024, // Large devices (laptops/desktops)
  };

  // Adjust logsPerPage based on the screen width
  useEffect(() => {
    const updateLogsPerPage = () => {
      const width = window.innerWidth;

      if (width <= breakpoints.small) {
        setLogsPerPage(5); // Small screens, show fewer logs per page
      } else if (width <= breakpoints.medium) {
        setLogsPerPage(7); // Medium screens, show more logs per page
      } else {
        setLogsPerPage(10); // Large screens, show more logs per page
      }
    };

    updateLogsPerPage(); // Set initial value on load

    // Add event listener to handle window resize
    window.addEventListener("resize", updateLogsPerPage);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("resize", updateLogsPerPage);
    };
  }, []);
  const filterByDateRange = useCallback(
    (log) => {
      const now = new Date();
      const logDate = new Date(log.timestamp);
      const daysDifference = (now - logDate) / (1000 * 60 * 60 * 24);

      if (selectedDateRange === "7") return daysDifference <= 7;
      if (selectedDateRange === "30") return daysDifference <= 30;
      if (selectedDateRange === "90") return daysDifference <= 90;
      return true;
    },
    [selectedDateRange]
  );

  const filterByAction = useCallback(
    (log) => {
      if (selectedAction === "All") return true;
      return log.action.toLowerCase() === selectedAction.toLowerCase();
    },
    [selectedAction]
  );

  const filteredLogs = useMemo(() => {
    return activityLog
      .filter(filterByDateRange)
      .filter(filterByAction)
      .filter((log) =>
        Object.values(log)
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
  }, [activityLog, filterByDateRange, filterByAction, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const currentLogs = useMemo(
    () => filteredLogs.slice(startIndex, startIndex + logsPerPage),
    [filteredLogs, startIndex, logsPerPage]
  );

  const debouncedSearch = useCallback(
    debounce((query) => setSearchQuery(query), 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationButtons = useMemo(() => {
    const buttons = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`${styles.paginationButton} ${
            currentPage === i ? styles.active : ""
          }`}
          onClick={() => handlePageChange(i)}
          aria-label={`Go to page ${i}`}
        >
          {i}
        </button>
      );
    }

    return buttons;
  }, [currentPage, totalPages]);

  return (
    <div className={styles.auditLogModal}>
      <div className={styles.auditLogContainer}>
        <div className={styles.auditLogHeader}>
          <span className={styles.auditLogTitle}>Audit Log</span>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className={styles.filterBar}>
          <select
            value={selectedDateRange}
            onChange={(e) => {
              setSelectedDateRange(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by date range"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="All">All Time</option>
          </select>
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by action"
          >
            <option value="All">All Actions</option>
            <option value="Created">Created</option>
            <option value="Deleted">Deleted</option>
            <option value="Updated">Updated</option>
          </select>
          <input
            type="text"
            placeholder="Search logs..."
            onChange={handleSearchChange}
            aria-label="Search logs"
          />
        </div>

        {filteredLogs.length > 0 ? (
          <>
            <table className={styles.auditLogTable}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((log, index) => (
                  <tr key={index}>
                    <td>{log.timestamp}</td>
                    <td>{log.user}</td>
                    <td
                      className={`${styles.status}-${log.action.toLowerCase()}`}
                    >
                      {log.action}
                    </td>
                    <td>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Showing {startIndex + 1}-
                {Math.min(startIndex + logsPerPage, filteredLogs.length)} of{" "}
                {filteredLogs.length} entries
              </span>
              <div className={styles.paginationButtons}>
                <button
                  className={styles.paginationButton}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  ←
                </button>
                {renderPaginationButtons}
                <button
                  className={styles.paginationButton}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  →
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.noData}>No data found</div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;