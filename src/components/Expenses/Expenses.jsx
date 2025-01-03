import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './expenses.css';
import { Sidebar } from '../Sidebar/Sidebar';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Form state
  const [expenseData, setExpenseData] = useState({
    description: '',
    amount: '',
    category: '',
    date: '',
    notes: ''
  });

  // Base URL
  const baseUrl = window.location.hostname === "localhost" 
    ? "http://localhost:4000/temiperi" 
    : "https://temiperi-backend.onrender.com/temiperi";

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/expenses`);
      if (response.data?.data) {
        setExpenses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(`${baseUrl}/expenses`, expenseData);
      // Clear form
      setExpenseData({
        description: '',
        amount: '',
        category: '',
        date: '',
        notes: ''
      });
      // Refresh expenses list
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle expense deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/expenses/${id}`);
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter expenses by date
  const filterExpenses = () => {
    if (!startDate && !endDate) return expenses;

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      return expenseDate >= start && expenseDate <= end;
    });
  };

  // Calculate total expenses
  const calculateTotal = (expenses) => {
    return expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
  };

  const filteredExpenses = filterExpenses();
  const totalExpenses = calculateTotal(filteredExpenses);

  return (
    <div className="expenses-container">
      <Sidebar />
      
      <div className="expenses-header">
        <h2>Manage Expenses</h2>
      </div>

      {/* Add Expense Form */}
      <form className="expenses-form" onSubmit={handleSubmit}>
        <h3>Add New Expense</h3>
        
        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            name="description"
            value={expenseData.description}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Amount (GH₵)</label>
          <input
            type="number"
            name="amount"
            value={expenseData.amount}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            value={expenseData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Category</option>
            <option value="utilities">Utilities</option>
            <option value="rent">Rent</option>
            <option value="supplies">Supplies</option>
            <option value="salaries">Salaries</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            name="date"
            value={expenseData.date}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Notes (Optional)</label>
          <textarea
            name="notes"
            value={expenseData.notes}
            onChange={handleInputChange}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>

      {/* Expenses List */}
      <div className="expenses-list">
        <h3>Expenses List</h3>

        {/* Date Filters */}
        <div className="date-filters">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
          />
        </div>

        {/* Expenses Summary */}
        <div className="expense-summary">
          <div className="summary-item">
            <h4>Total Expenses</h4>
            <p>GH₵ {totalExpenses.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</p>
          </div>
          <div className="summary-item">
            <h4>Number of Expenses</h4>
            <p>{filteredExpenses.length}</p>
          </div>
        </div>

        {loading ? (
          <p>Loading expenses...</p>
        ) : (
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense._id}>
                  <td>{new Date(expense.date).toLocaleDateString()}</td>
                  <td>{expense.description}</td>
                  <td>{expense.category}</td>
                  <td>GH₵ {parseFloat(expense.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</td>
                  <td>{expense.notes}</td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(expense._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Expenses;
