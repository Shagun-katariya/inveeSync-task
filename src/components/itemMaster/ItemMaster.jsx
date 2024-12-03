import React, { useState, useEffect } from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import styles from "./ItemMaster.module.css";
import { useDispatch, useSelector } from "react-redux";
import { startLoading, stopLoading } from "../../Redux/slices/loadingSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { deleteItem } from "../../Redux/slices/itemSlice";
import { removePendingItem } from "../../Redux/slices/pendingItemsSlice.js";

function ItemMaster({ handleResolveClick }) {
  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useDispatch();
  const { items, error } = useSelector((state) => state.items);
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

  //Delete Item
  const handleDelete = async (itemId) => {
    dispatch(startLoading());
    const itemToDelete = items.find((item) => item.id === itemId);
    try {
      // Find the item that was clicked for deletion

      if (!itemToDelete) {
        throw new Error("Item not found.");
      }

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
      dispatch(deleteItem(itemId));
      dispatch(removePendingItem(itemId));
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(error.message);
    } finally {
      dispatch(stopLoading()); // Hide loader after data fetching is complete
    }
  };

  return (
    <>
      <div className={styles.itemBuilder}>
        <div className={styles.searchContainer}>
          <button
            className={styles.addItemButton}
            onClick={() => handleResolveClick({})}
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
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.internal_item_name}</td>
                    <td>{item.type}</td>
                    <td>{item.uom}</td>
                    <td className={`${styles.status}`}>{item.status}</td>
                    <td className={styles.actions}>
                      <FaEdit
                        className={styles.editIcon}
                        onClick={() => handleResolveClick(item)}
                        title="Edit Item"
                      />
                      <FaTrashAlt
                        className={styles.deleteIcon}
                        onClick={() => handleDelete(item.id)}
                        title="Delete Item"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <div className={styles.noItemsFound}>No items found</div>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}

export default ItemMaster;
