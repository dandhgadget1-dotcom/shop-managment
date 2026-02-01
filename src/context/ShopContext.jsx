"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { customerAPI } from "@/lib/api";

const ShopContext = createContext();

export function ShopProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load customers from API on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerAPI.getAll();
      setCustomers(data);
    } catch (err) {
      console.error("Error loading customers:", err);
      const errorMessage = err.message || "Failed to load customers. Please make sure the backend server is running.";
      setError(errorMessage);
      // Don't show empty array on error, keep previous data if available
      if (customers.length === 0) {
        setCustomers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customerData) => {
    try {
      setError(null);
      const newCustomer = await customerAPI.create(customerData);
      setCustomers((prev) => [...prev, newCustomer]);
      return newCustomer.id;
    } catch (err) {
      console.error("Error adding customer:", err);
      setError(err.message);
      throw err;
    }
  };

  const updateCustomer = async (id, updatedData) => {
    try {
      setError(null);
      const updatedCustomer = await customerAPI.update(id, updatedData);
      setCustomers((prev) =>
        prev.map((customer) => (customer.id === id ? updatedCustomer : customer))
      );
      return updatedCustomer;
    } catch (err) {
      console.error("Error updating customer:", err);
      setError(err.message);
      throw err;
    }
  };

  const deleteCustomer = async (id) => {
    try {
      setError(null);
      await customerAPI.delete(id);
      setCustomers((prev) => prev.filter((customer) => customer.id !== id));
    } catch (err) {
      console.error("Error deleting customer:", err);
      setError(err.message);
      throw err;
    }
  };

  const getCustomerById = (id) => {
    return customers.find((customer) => customer.id === id);
  };

  return (
    <ShopContext.Provider
      value={{
        customers,
        loading,
        error,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomerById,
        refreshCustomers: loadCustomers,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}

