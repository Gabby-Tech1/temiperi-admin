import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import axios from "axios";
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
    quantity: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "https://temiperi-stocks-backend.onrender.com/temiperi/products"
      );
      const productsData = response?.data?.products || [];
      setProducts(productsData);
      setFilteredProducts(productsData);

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(productsData?.map((product) => product?.category)),
      ];
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
        (product) => product?.category === selectedCategory
      );
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (product) =>
          product?.name?.toLowerCase().includes(searchLower) ||
          product?.category?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, products]);

  // Get current products
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle edit click
  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product?.name,
      category: product?.category,
      retail_price: product?.price?.retail_price,
      whole_sale_price: product?.price?.whole_sale_price,
      quantity: product?.quantity,
    });
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
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
          retail_price: parseFloat(editForm?.retail_price),
          whole_sale_price: parseFloat(editForm?.whole_sale_price),
        },
        quantity: parseInt(editForm.quantity),
      };

      const response = await api.patch(
        `https://temiperi-stocks-backend.onrender.com/temiperi/products/?id=${editingProduct?._id}`,
        updateData
      );

      if (response?.data) {
        const updatedProducts = products.map((prod) =>
          prod._id === editingProduct?._id ? response?.data : prod
        );
        setProducts(updatedProducts);

        setShowEditModal(false);
        setEditingProduct(null);
        setEditForm({
          name: "",
          category: "",
          retail_price: "",
          whole_sale_price: "",
          quantity: "",
        });

        toast.dismiss(loadingToast);
        toast.success("Product updated successfully!");
        fetchProducts();
      }
    } catch (err) {
      console.error("Error updating product:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to update product. Please try again."
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

      await api.delete(
        `https://temiperi-stocks-backend.onrender.com/temiperi/delete-product?id=${productToDelete?._id}`
      );

      setProducts(
        products.filter((prod) => prod?._id !== productToDelete?._id)
      );
      setShowDeleteModal(false);
      setProductToDelete(null);

      toast.dismiss(loadingToast);
      toast.success("Product deleted successfully!");
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to delete product. Please try again."
      );
    }
  };

  return (
    <div>
      <div className="body_container">
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
              <table className="w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Retail Price</th>
                    <th className="px-4 py-2 text-left">Wholesale Price</th>
                    <th className="px-4 py-2 text-left">Quantity</th>
                    <th className="px-4 py-2 text-left">Created At</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-2 text-center">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    currentProducts.map((product) => (
                      <tr key={product._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{product?.name}</td>
                        <td className="px-4 py-2">{product?.category}</td>
                        <td className="px-4 py-2">GH₵{product?.price?.retail_price}</td>
                        <td className="px-4 py-2">GH₵{product?.price?.whole_sale_price}</td>
                        <td className="px-4 py-2">{product?.quantity}</td>
                        <td className="px-4 py-2">
                          {new Date(product?.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditClick(product)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {icons.edit}
                            </button>
                            <button
                              onClick={() => handleDeleteClick(product)}
                              className="text-red-600 hover:text-red-800"
                            >
                              {icons.trash}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="pagination-container mt-4 flex justify-center items-center gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>

            {Array.from({
              length: Math.ceil(filteredProducts.length / productsPerPage),
            }).map((_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === index + 1
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === Math.ceil(filteredProducts.length / productsPerPage)}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>

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
