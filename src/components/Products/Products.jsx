import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { Sidebar } from "../Sidebar/Sidebar";
import "./product.css";
import { icons } from "../../icons/heroIcons";
import { toast } from "react-toastify";

const Products = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    retail_price: "",
    whole_sale_price: "",
    quantity: ""
  });

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      const productsData = response.data.products;
      setProducts(productsData);
      setFilteredProducts(productsData);

      // Extract unique categories
      const uniqueCategories = [...new Set(productsData.map(product => product.category))];
      setCategories(uniqueCategories);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search term and category
  useEffect(() => {
    let result = products;

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower)
      );
    }

    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, products]);

  // Handle edit click
  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      category: product.category,
      retail_price: product.price.retail_price,
      whole_sale_price: product.price.whole_sale_price,
      quantity: product.quantity,
    });
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    console.log(editingProduct);
    console.log(editForm);
  };

  // Handle update submission
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const loadingToast = toast.loading("Updating product...");

      const updateData = {
        name: editForm.name,
        category: editForm.category,
        price: {
          retail_price: parseFloat(editForm.retail_price),
          whole_sale_price: parseFloat(editForm.whole_sale_price)
        },
        quantity: parseInt(editForm.quantity)
      };

      const response = await api.patch(
        `/products/?id=${editingProduct._id}`,
        updateData
      );

      if (response.data) {
        const updatedProducts = products.map((prod) =>
          prod._id === editingProduct._id ? response.data : prod
        );
        setProducts(updatedProducts);

        setShowEditModal(false);
        setEditingProduct(null);
        setEditForm({
          name: "",
          category: "",
          retail_price: "",
          whole_sale_price: "",
          quantity: ""
        });

        toast.dismiss(loadingToast);
        toast.success("Product updated successfully!");
        fetchProducts();
      }
    } catch (err) {
      console.error("Error updating product:", err);
      toast.error(
        err.response?.data?.message || "Failed to update product. Please try again."
      );
    }
  };

  // Handle delete click
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      const loadingToast = toast.loading("Deleting product...");

      await api.delete(`/delete-product?id=${productToDelete._id}`);

      setProducts(products.filter((prod) => prod._id !== productToDelete._id));
      setShowDeleteModal(false);
      setProductToDelete(null);

      toast.dismiss(loadingToast);
      toast.success("Product deleted successfully!");
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error(
        err.response?.data?.message || "Failed to delete product. Please try again."
      );
    }
  };

  return (
    <div>
      <div className="body_container">
        <Sidebar />

        <div className="product_container">
          <div className="header-section">
            <h2 className="text-2xl font-bold">Products</h2>
            <div className="filter-section">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">{icons.search}</span>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p>Loading products...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Retail Price</th>
                    <th>Wholesale Price</th>
                    <th>Quantity</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>GH₵{product.price.retail_price}</td>
                      <td>GH₵{product.price.whole_sale_price}</td>
                      <td>{product.quantity}</td>
                      <td>
                        {new Date(product.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <span
                            className="cursor-pointer edit-icon"
                            onClick={() => handleEditClick(product)}
                          >
                            {icons.edit}
                          </span>
                          <span
                            className="cursor-pointer text-red-600 delete-icon"
                            onClick={() => handleDeleteClick(product)}
                          >
                            {icons.trash}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <p className="no-results">
                  No products found matching your criteria.
                </p>
              )}
            </div>
          )}

          {/* Edit Modal */}
          {showEditModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>Edit Product</h2>
                <form onSubmit={handleUpdate}>
                  <div className="form-group">
                    <label>Product Name:</label>
                    <input
                      type="text"
                      name="name"
                      value={editForm.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category:</label>
                    <input
                      type="text"
                      name="category"
                      value={editForm.category}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Retail Price:</label>
                    <input
                      type="number"
                      name="retail_price"
                      value={editForm.retail_price}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Wholesale Price:</label>
                    <input
                      type="number"
                      name="whole_sale_price"
                      value={editForm.whole_sale_price}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantity:</label>
                    <input
                      type="number"
                      name="quantity"
                      value={editForm.quantity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="modal-buttons">
                    <button type="submit" className="update-btn">
                      Update Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="modal-overlay">
              <div className="modal-content-delete delete-modal">
                <h2 style={{ textAlign: "center", fontWeight: "bold" }}>
                  Delete Product
                </h2>
                <div
                  style={{
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <p>
                    Are you sure you want to delete {productToDelete?.name}?
                  </p>
                </div>
                <p className="warning-text">This action cannot be undone.</p>
                <div className="modal-buttons">
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    className="delete-btn"
                  >
                    Delete Product
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setProductToDelete(null);
                    }}
                    className="bg-gray-400 text-white rounded-md hover:bg-gray-500 duration-300 ease-linear"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
