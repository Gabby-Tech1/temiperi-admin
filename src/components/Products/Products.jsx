import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import axios from "axios";
// import "./product.css";
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
  const [selectedProduct, setSelectedProduct] = useState(null);
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
  const [productsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // Changed to match InvoiceTable

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedProducts = products.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(products.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate page numbers with ellipsis
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisible = 5;
    const totalPages = Math.ceil(products.length / itemsPerPage);

    if (totalPages <= maxVisible) {
      // If total pages is less than max visible, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      if (currentPage <= 3) {
        // If current page is near the start
        for (let i = 2; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // If current page is near the end
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // If current page is in the middle
        pageNumbers.push("...");
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

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
  // const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle edit click
  const handleEditClick = (product) => {
    setSelectedProduct(product);
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
  const handleEditFormChange = (e) => {
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
    setSelectedProduct(product);
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

  const handleCloseModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedProduct(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    handleUpdate(e);
    handleCloseModals();
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
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="text-gray-500 bg-white text-sm">
                  <tr>
                    <th className="text-left">Name</th>
                    <th className="text-left">Category</th>
                    <th className="text-left">Retail Price</th>
                    <th className="text-left">Wholesale Price</th>
                    <th className="text-left">Quantity</th>
                    <th className="text-left">Created At</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProducts.length > 0 ? (
                    paginatedProducts.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {product?.name || "Unnamed Product"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {product?.category || "Uncategorized"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          GH₵
                          {product?.price?.retail_price?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          GH₵
                          {product?.price?.whole_sale_price?.toFixed(2) ||
                            "0.00"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {product?.quantity || 0}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
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
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-2 text-center">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                    ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                    ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{indexOfFirstItem + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, products.length)}
                    </span>{" "}
                    of <span className="font-medium">{products.length}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium 
                        ${
                          currentPage === 1
                            ? "text-gray-300"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                    >
                      Previous
                    </button>
                    {getPageNumbers().map((number, idx) =>
                      number === "..." ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          {number}
                        </span>
                      ) : (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium 
                            ${
                              currentPage === number
                                ? "z-10 bg-blue text-white border-blue"
                                : "bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                          {number}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium 
                        ${
                          currentPage === totalPages
                            ? "text-gray-300"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Edit Product</h2>
                  <button
                    onClick={handleCloseModals}
                    className="text-white bg-red-400 w-fit rounded-full"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleEditSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        name="category"
                        value={editForm.category}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Retail Price (GH₵)
                      </label>
                      <input
                        type="number"
                        name="retail_price"
                        value={editForm.retail_price}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wholesale Price (GH₵)
                      </label>
                      <input
                        type="number"
                        name="whole_sale_price"
                        value={editForm.whole_sale_price}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={editForm.quantity}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModals}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Delete Product</h2>
                  <button
                    onClick={handleCloseModals}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this product? This action
                  cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCloseModals}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
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
