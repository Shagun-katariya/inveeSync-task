import React, { useState, useEffect } from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import styles from "./ItemMaster.module.css";

function ItemMaster({
  items,
  handleResolveClick,
  handleDelete,
  setshowNewItemModal,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState(items);

  // Sync filteredItems with items prop
  useEffect(() => {
    if (!searchQuery) {
      setFilteredItems(items);
    }
  }, [items, searchQuery]);

  // Handle search query changes
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    // Filter items based on the query
    if (query) {
      setFilteredItems(
        items.filter(
          (item) =>
            item.internal_item_name && // Ensure internal_item_name is defined
            item.internal_item_name.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredItems(items); // Reset to original items if query is empty
    }
  };

  return (
    <>
      <div className={styles.searchContainer}>
        <button
          className={styles.addItemButton}
          onClick={() => setshowNewItemModal(true)}
        >
          Add New Item
        </button>
        <input
          type="text"
          placeholder="Search by Item Name..."
          value={searchQuery}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
      </div>
      <section className={styles.itemsTable} style={{ overflowY: "auto" }}>
        {filteredItems.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Type</th>
                <th>UOM</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.internal_item_name}</td>
                  <td>{item.type}</td>
                  <td>{item.uom}</td>
                  <td className={`${styles.status} ${item.status.toLowerCase()}`}>
                    {item.status}
                  </td>
                  <td className={styles.actions}>
                    <FaEdit
                      className={styles.editIcon}
                      onClick={() => handleResolveClick(item, "edit")}
                      title="Edit Item"
                    />
                    <FaTrashAlt
                      className={styles.deleteIcon}
                      onClick={() => handleDelete(item.id)}
                      title="Delete Item"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.noItemsFound}>No items found</div>
        )}
      </section>
    </>
  );
}

export default ItemMaster;
