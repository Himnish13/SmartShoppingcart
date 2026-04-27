const analyticsModel = require("../models/analytics.model");

const mockRevenueTrend = [
  { month: "Nov", revenue: 12400, orders: 142, customers: 96 },
  { month: "Dec", revenue: 18950, orders: 211, customers: 148 },
  { month: "Jan", revenue: 15200, orders: 178, customers: 121 },
  { month: "Feb", revenue: 17840, orders: 196, customers: 139 },
  { month: "Mar", revenue: 21300, orders: 234, customers: 167 },
  { month: "Apr", revenue: 24680, orders: 271, customers: 192 },
];

const mockCategoryShare = [
  { name: "Audio", value: 32 },
  { name: "Computing", value: 28 },
  { name: "Wearables", value: 18 },
  { name: "Home", value: 12 },
  { name: "Accessories", value: 10 },
];

const mockOrdersCustomers = [
  { month: "Nov", orders: 142, customers: 96 },
  { month: "Dec", orders: 211, customers: 148 },
  { month: "Jan", orders: 178, customers: 121 },
  { month: "Feb", orders: 196, customers: 139 },
  { month: "Mar", orders: 234, customers: 167 },
  { month: "Apr", orders: 271, customers: 192 },
];

async function getKPIMetrics() {
  try {
    const data = await analyticsModel.getKPIMetrics();
    console.log("KPI Metrics from database:", data);
    return data;
  } catch (error) {
    console.error("Error fetching KPI metrics:", error.message);
    return {
      revenue: 0,
      revenueDelta: 0,
      orders: 0,
      ordersDelta: 0,
      customers: 0,
      customersDelta: 0
    };
  }
}

async function getRevenueTrend() {
  try {
    const data = await analyticsModel.getRevenueTrend();

    // Use mock data as fallback if database returns empty
    if (!data || data.length === 0) {
      console.log("Using mock revenue trend data (database is empty)");
      return mockRevenueTrend;
    }

    console.log("Revenue trend from database:", data.length, "months");
    return data;
  } catch (error) {
    console.error("Error fetching revenue trend:", error.message);
    return mockRevenueTrend;
  }
}

async function getCategoryShare() {
  try {
    const data = await analyticsModel.getCategoryShare();

    if (!data || data.length === 0) {
      console.log("Using mock category share data (database is empty)");
      return mockCategoryShare;
    }

    console.log("Category share from database:", data.length, "categories");
    return data;
  } catch (error) {
    console.error("Error fetching category share:", error.message);
    return mockCategoryShare;
  }
}

async function getOrdersAndCustomers() {
  try {
    const data = await analyticsModel.getOrdersAndCustomers();

    if (!data || data.length === 0) {
      console.log("Using mock orders/customers data (database is empty)");
      return mockOrdersCustomers;
    }

    console.log("Orders/customers from database:", data.length, "months");
    return data;
  } catch (error) {
    console.error("Error fetching orders and customers:", error.message);
    return mockOrdersCustomers;
  }
}

module.exports = {
  getKPIMetrics,
  getRevenueTrend,
  getCategoryShare,
  getOrdersAndCustomers
};
