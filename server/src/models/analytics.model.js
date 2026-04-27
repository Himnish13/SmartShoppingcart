const db = require("../config/db");

function getKPIMetrics() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        ROUND(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN total_amount ELSE 0 END), 2) as current_revenue,
        ROUND(SUM(CASE WHEN created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH) AND created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH) THEN total_amount ELSE 0 END), 2) as previous_revenue,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 ELSE 0 END) as current_orders,
        SUM(CASE WHEN created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH) AND created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH) THEN 1 ELSE 0 END) as previous_orders,
        COUNT(DISTINCT CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN user_id END) as current_customers,
        COUNT(DISTINCT CASE WHEN created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH) AND created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH) THEN user_id END) as previous_customers
      FROM orders
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("KPI metrics query error:", err.message);
        return resolve({
          revenue: 0,
          revenueDelta: 0,
          orders: 0,
          ordersDelta: 0,
          customers: 0,
          customersDelta: 0
        });
      }

      if (!results || results.length === 0) {
        return resolve({
          revenue: 0,
          revenueDelta: 0,
          orders: 0,
          ordersDelta: 0,
          customers: 0,
          customersDelta: 0
        });
      }

      const row = results[0];
      const currentRevenue = parseFloat(row.current_revenue) || 0;
      const previousRevenue = parseFloat(row.previous_revenue) || 0;
      const currentOrders = parseInt(row.current_orders) || 0;
      const previousOrders = parseInt(row.previous_orders) || 0;
      const currentCustomers = parseInt(row.current_customers) || 0;
      const previousCustomers = parseInt(row.previous_customers) || 0;

      const revenueDelta = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const ordersDelta = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0;
      const customersDelta = previousCustomers > 0 ? ((currentCustomers - previousCustomers) / previousCustomers) * 100 : 0;

      resolve({
        revenue: currentRevenue,
        revenueDelta: revenueDelta.toFixed(1),
        orders: currentOrders,
        ordersDelta: ordersDelta.toFixed(1),
        customers: currentCustomers,
        customersDelta: customersDelta.toFixed(1)
      });
    });
  });
}

// ✅ FIXED FUNCTION (this was missing)
function getRevenueTrend() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        DATE_FORMAT(created_at, '%b') as month,
        ROUND(SUM(total_amount), 2) as revenue,
        COUNT(*) as orders,
        COUNT(DISTINCT user_id) as customers
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
      ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC
      LIMIT 6
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Revenue trend query error:", err.message);
        return resolve([]);
      }

      if (!results || results.length === 0) {
        console.log("No revenue trend data found, using defaults");
        return resolve([]);
      }

      const transformedResults = results.map(row => ({
        month: row.month || "N/A",
        revenue: parseFloat(row.revenue) || 0,
        orders: parseInt(row.orders) || 0,
        customers: parseInt(row.customers) || 0
      }));

      resolve(transformedResults);
    });
  });
}

function getCategoryShare() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        COALESCE(c.category_name, 'Other') as name,
        ROUND(SUM(COALESCE(oi.quantity * oi.price_at_time, 0)), 2) as value
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN product_mastery pm ON oi.product_id = pm.product_id
      LEFT JOIN category c ON pm.category_id = c.category_id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY COALESCE(c.category_id, 0), COALESCE(c.category_name, 'Other')
      HAVING value > 0
      ORDER BY value DESC
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Category share query error:", err.message);
        return resolve([]);
      }

      if (!results || results.length === 0) {
        console.log("No category share data found, using defaults");
        return resolve([]);
      }

      const total = results.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0);

      const transformedResults = results.map(row => ({
        name: row.name || "Other",
        value: total > 0 ? Math.round((parseFloat(row.value) / total) * 100) : 0
      }));

      resolve(transformedResults);
    });
  });
}

function getOrdersAndCustomers() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        DATE_FORMAT(created_at, '%b') as month,
        COUNT(*) as orders,
        COUNT(DISTINCT user_id) as customers
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
      ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC
      LIMIT 6
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Orders and customers query error:", err.message);
        return resolve([]);
      }

      if (!results || results.length === 0) {
        console.log("No orders/customers data found, using defaults");
        return resolve([]);
      }

      const transformedResults = results.map(row => ({
        month: row.month || "N/A",
        orders: parseInt(row.orders) || 0,
        customers: parseInt(row.customers) || 0
      }));

      resolve(transformedResults);
    });
  });
}

module.exports = {
  getKPIMetrics,
  getRevenueTrend,
  getCategoryShare,
  getOrdersAndCustomers
};