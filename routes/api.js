const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const db = new sqlite3.Database(path.join(__dirname, "../db/sqlite.db"));

// Middleware to log activity
const logActivity = (userId, action) => {
  db.run(
    "INSERT INTO activity_log (userId, action) VALUES (?, ?)",
    [userId, action],
    (err) => {
      if (err) console.error("Error logging activity:", err);
    }
  );
};

// Authentication middleware
const authenticate = (req, res, next) => {
  // In production, use JWT tokens
  // For now, we'll use a simple session check
  const userId = req.headers["x-user-id"];
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = parseInt(userId);
  next();
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    db.get("SELECT role FROM users WHERE id = ?", [req.userId], (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      req.userRole = user.role;
      next();
    });
  };
};

// ============ AUTHENTICATION ============

// Sign up endpoint for new customers
router.post("/signup", (req, res) => {
  const { email, password, name, phone } = req.body;

  // Validate required fields
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required" });
  }

  // Check if user already exists
  db.get("SELECT id FROM users WHERE email = ?", [email], (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create new customer account
    db.run(
      "INSERT INTO users (email, password, name, role, phone) VALUES (?, ?, ?, 'customer', ?)",
      [email, password, name, phone || null],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        const userId = this.lastID;
        logActivity(userId, `New customer registered: ${email}`);
        res.json({
          id: userId,
          email,
          name,
          role: "customer",
          phone: phone || null,
        });
      }
    );
  });
});

// Unified login endpoint for all user types (customer, admin, superadmin)
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.get(
    "SELECT id, email, name, role, phone FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      logActivity(user.id, `User logged in: ${user.email} (${user.role})`);
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || null,
      });
    }
  );
});

// Get current user profile
router.get("/user/profile", authenticate, (req, res) => {
  const userId = req.headers["x-user-id"];
  db.get(
    "SELECT id, email, name, role, phone FROM users WHERE id = ?",
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    }
  );
});

// Update user profile
router.put("/user/profile", authenticate, (req, res) => {
  const userId = req.headers["x-user-id"];
  const { name, email, phone } = req.body;

  db.run(
    "UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?",
    [name, email, phone, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      logActivity(userId, `Profile updated`);
      res.json({ message: "Profile updated successfully" });
    }
  );
});

// ============ PRODUCTS ============

// Get all products (public)
router.get("/products", (req, res) => {
  const { animal, category } = req.query;
  let query = "SELECT * FROM products WHERE 1=1";
  const params = [];

  if (animal) {
    query += " AND animal = ?";
    params.push(animal);
  }
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get a product by ID (public)
router.get("/products/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(row);
  });
});

// Create product (Super Admin only)
router.post("/products", authenticate, authorize("superadmin"), (req, res) => {
  const {
    name,
    animal,
    category,
    price,
    image,
    stock,
    rating,
    brand,
    lifeStage,
    sku,
    description,
  } = req.body;

  if (
    !name ||
    !animal ||
    !category ||
    !price ||
    !image ||
    stock === undefined ||
    !rating
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  db.run(
    "INSERT INTO products (name, animal, category, price, image, stock, rating, brand, lifeStage, sku, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      name,
      animal,
      category,
      price,
      image,
      stock,
      rating,
      brand || "Save My Pet",
      lifeStage || "Adult",
      sku || null,
      description || null,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      logActivity(req.userId, `Created product: ${name}`);
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

// Update product (Super Admin only)
router.put(
  "/products/:id",
  authenticate,
  authorize("superadmin"),
  (req, res) => {
    const { id } = req.params;
    const {
      name,
      animal,
      category,
      price,
      image,
      stock,
      rating,
      brand,
      lifeStage,
      sku,
      description,
    } = req.body;

    db.run(
      "UPDATE products SET name = ?, animal = ?, category = ?, price = ?, image = ?, stock = ?, rating = ?, brand = ?, lifeStage = ?, sku = ?, description = ? WHERE id = ?",
      [
        name,
        animal,
        category,
        price,
        image,
        stock,
        rating,
        brand || "Save My Pet",
        lifeStage || "Adult",
        sku || null,
        description || null,
        id,
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: "Product not found" });
        }
        logActivity(req.userId, `Updated product ID: ${id}`);
        res.json({ id, ...req.body });
      }
    );
  }
);

// Delete product (Super Admin only)
router.delete(
  "/products/:id",
  authenticate,
  authorize("superadmin"),
  (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      logActivity(req.userId, `Deleted product ID: ${id}`);
      res.json({ message: "Product deleted successfully" });
    });
  }
);

// ============ ORDERS ============

// Get orders for current user (Customer orders)
router.get("/user/orders", authenticate, (req, res) => {
  const userId = req.headers["x-user-id"];
  db.all(
    "SELECT * FROM orders WHERE customerId = ? ORDER BY date DESC",
    [userId],
    (err, orders) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(orders);
    }
  );
});

// Get single order details for current user
router.get("/user/orders/:id", authenticate, (req, res) => {
  const userId = req.headers["x-user-id"];
  const { id } = req.params;

  // First verify this order belongs to the user
  db.get(
    "SELECT * FROM orders WHERE id = ? AND customerId = ?",
    [id, userId],
    (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Fetch order items
      db.all(
        "SELECT * FROM order_items WHERE orderId = ?",
        [id],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ ...order, items: items || [] });
        }
      );
    }
  );
});

// Get all orders (Admin and Super Admin)
router.get(
  "/orders",
  authenticate,
  authorize("admin", "superadmin"),
  (req, res) => {
    db.all("SELECT * FROM orders ORDER BY date DESC", [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  }
);

// Get order by ID with items (Admin and Super Admin)
router.get(
  "/orders/:id",
  authenticate,
  authorize("admin", "superadmin"),
  (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM orders WHERE id = ?", [id], (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Fetch order items
      db.all(
        "SELECT * FROM order_items WHERE orderId = ?",
        [id],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ ...order, items: items || [] });
        }
      );
    });
  }
);

// Verify Paystack payment
router.get("/verify-payment/:reference", authenticate, async (req, res) => {
  const { reference } = req.params;

  try {
    const https = require('https');

    console.log('Verifying payment with reference:', reference);
    console.log('Secret key (first 15 chars):', process.env.PAYSTACK_SECRET_KEY?.substring(0, 15));

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    };

    const paystackRequest = https.request(options, (paystackRes) => {
      let data = '';

      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      paystackRes.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Paystack verification response:', JSON.stringify(response, null, 2));
          console.log('Transaction status:', response.data?.status);
          res.json(response);
        } catch (error) {
          console.error('Failed to parse Paystack response:', error);
          res.status(500).json({ error: 'Failed to parse Paystack response' });
        }
      });
    });

    paystackRequest.on('error', (error) => {
      console.error('Paystack verification error:', error);
      res.status(500).json({ error: 'Failed to verify payment' });
    });

    paystackRequest.end();
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create order (Customer, Admin, Super Admin)
router.post("/orders", authenticate, (req, res) => {
  const { customerName, customerEmail, customerPhone, shippingAddress, shippingCity, shippingState, total, items, paymentReference } = req.body;

  if (!customerName || !total || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Set status to "pending" when payment is verified
  // Admin will manually change to "processing" when they review/acknowledge the order
  const status = "pending";
  const date = new Date().toISOString();

  db.run(
    "INSERT INTO orders (customerId, customerName, customerEmail, shippingAddress, shippingCity, shippingState, total, status, date, lastStatusUpdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [req.userId, customerName, customerEmail || null, shippingAddress || null, shippingCity || null, shippingState || null, total, status, date, date],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const orderId = this.lastID;

      // Insert order items
      const stmt = db.prepare(
        "INSERT INTO order_items (orderId, productId, productName, quantity, price) VALUES (?, ?, ?, ?, ?)"
      );

      items.forEach((item) => {
        stmt.run(orderId, item.productId, item.productName, item.quantity, item.price);
      });

      stmt.finalize((err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Reduce inventory for each product
        const updateStmt = db.prepare(
          "UPDATE products SET stock = stock - ? WHERE id = ?"
        );

        items.forEach((item) => {
          updateStmt.run(item.quantity, item.productId);
        });

        updateStmt.finalize((err) => {
          if (err) {
            console.error("Error updating inventory:", err.message);
          }

          // Log payment information if available
          if (paymentReference) {
            logActivity(req.userId, `Created order ID: ${orderId} with payment ref: ${paymentReference}`);
          } else {
            logActivity(req.userId, `Created order ID: ${orderId}`);
          }

          res.json({
            orderId: orderId,
            id: orderId,
            customerName,
            total,
            status,
            date,
            items,
            paymentReference: paymentReference || null,
            customerPhone: customerPhone || null
          });
        });
      });
    }
  );
});

// Update order status (Admin and Super Admin)
router.put(
  "/orders/:id/status",
  authenticate,
  authorize("admin", "superadmin"),
  (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const now = new Date().toISOString();
    db.run(
      "UPDATE orders SET status = ?, lastStatusUpdate = ? WHERE id = ?",
      [status, now, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: "Order not found" });
        }
        logActivity(req.userId, `Updated order ${id} status to ${status}`);
        res.json({ id, status });
      }
    );
  }
);

// ============ DASHBOARD ============

// Get dashboard data (Admin and Super Admin)
router.get(
  "/dashboard",
  authenticate,
  authorize("admin", "superadmin"),
  (req, res) => {
    db.all(
      `SELECT
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'delivered') as revenue,
        (SELECT COUNT(*) FROM orders) as ordersCount,
        (SELECT COUNT(*) FROM products) as productsCount,
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as customersCount`,
      [],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(
          rows[0] || {
            revenue: 0,
            ordersCount: 0,
            productsCount: 0,
            customersCount: 0,
          }
        );
      }
    );
  }
);

// Get comprehensive metrics (Super Admin only)
router.get(
  "/metrics",
  authenticate,
  authorize("superadmin"),
  (req, res) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString();
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1).toISOString();

    db.all(
      `SELECT
        -- Revenue snapshots (only delivered orders)
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE date >= ? AND status = 'delivered') as todayRevenue,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE date >= ? AND status = 'delivered') as weekRevenue,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE date >= ? AND status = 'delivered') as monthRevenue,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE date >= ? AND status = 'delivered') as sixMonthRevenue,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE date >= ? AND status = 'delivered') as yearRevenue,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE date >= ? AND status = 'delivered') as twelveMonthRevenue,

        -- Customer metrics
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as totalCustomers,
        (SELECT COUNT(*) FROM users WHERE role = 'customer' AND id >= (SELECT MAX(id) - 10 FROM users)) as newCustomers,

        -- Sales metrics
        (SELECT COUNT(*) FROM orders) as totalOrders,
        (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') as cancelledOrders,
        (SELECT COUNT(*) FROM products) as totalProducts,
        (SELECT COUNT(*) FROM products WHERE stock = 0) as stockouts`,
      [todayStart, weekStart, monthStart, sixMonthsAgo, yearStart, twelveMonthsAgo],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const metrics = rows[0] || {};

        // Calculate derived metrics
        metrics.returningCustomerRate = metrics.totalCustomers > 0
          ? ((metrics.totalCustomers - metrics.newCustomers) / metrics.totalCustomers * 100).toFixed(1)
          : 0;
        metrics.refundRate = metrics.totalOrders > 0
          ? (metrics.cancelledOrders / metrics.totalOrders * 100).toFixed(1)
          : 0;

        res.json(metrics);
      }
    );
  }
);

// Get category sales data (Super Admin only)
router.get(
  "/metrics/categories",
  authenticate,
  authorize("superadmin"),
  (req, res) => {
    db.all(
      `SELECT
        category,
        COUNT(*) as unitsSold,
        SUM(price) as revenue
      FROM products
      GROUP BY category
      ORDER BY revenue DESC`,
      [],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const total = rows.reduce((sum, row) => sum + row.revenue, 0);
        const categoriesWithPercentage = rows.map(row => ({
          ...row,
          percentOfTotal: total > 0 ? ((row.revenue / total) * 100).toFixed(1) : 0
        }));

        res.json(categoriesWithPercentage);
      }
    );
  }
);

// Get detailed revenue breakdown with items sold (Super Admin only)
router.get(
  "/metrics/revenue-details",
  authenticate,
  authorize("superadmin"),
  (req, res) => {
    db.all(
      `SELECT
        o.id as orderId,
        o.date,
        o.customerName,
        o.total,
        oi.productName,
        oi.quantity,
        oi.price,
        (oi.quantity * oi.price) as itemTotal
      FROM orders o
      JOIN order_items oi ON o.id = oi.orderId
      WHERE o.status = 'delivered'
      ORDER BY o.date DESC`,
      [],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Group by order
        const orderMap = {};
        rows.forEach(row => {
          if (!orderMap[row.orderId]) {
            orderMap[row.orderId] = {
              orderId: row.orderId,
              date: row.date,
              customerName: row.customerName,
              total: row.total,
              items: []
            };
          }
          orderMap[row.orderId].items.push({
            productName: row.productName,
            quantity: row.quantity,
            price: row.price,
            itemTotal: row.itemTotal
          });
        });

        const orders = Object.values(orderMap);
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

        res.json({
          orders,
          totalRevenue,
          totalOrders: orders.length
        });
      }
    );
  }
);

// Get monthly revenue data for chart (Super Admin only)
router.get(
  "/metrics/monthly-revenue",
  authenticate,
  authorize("superadmin"),
  (req, res) => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    db.all(
      `SELECT
        strftime('%Y-%m', date) as month,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(*) as orderCount
      FROM orders
      WHERE date >= ? AND status = 'delivered'
      GROUP BY month
      ORDER BY month ASC`,
      [twelveMonthsAgo.toISOString()],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
      }
    );
  }
);

// Get stock levels (Admin and Super Admin - read-only)
router.get(
  "/stock",
  authenticate,
  authorize("admin", "superadmin"),
  (req, res) => {
    db.all(
      "SELECT id, name, animal, category, stock FROM products ORDER BY stock ASC",
      [],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
      }
    );
  }
);

// ============ USERS (Super Admin only) ============

// Get current user info (for session restoration)
router.get("/users/:id", authenticate, (req, res) => {
  const { id } = req.params;

  // First, get the requesting user's role
  db.get("SELECT role FROM users WHERE id = ?", [req.userId], (err, requestingUser) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Users can only fetch their own info unless they're superadmin
    if (parseInt(id) !== req.userId && requestingUser?.role !== "superadmin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    db.get(
      "SELECT id, email, name, phone, role FROM users WHERE id = ?",
      [id],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (!row) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json(row);
      }
    );
  });
});

// Get all users (Super Admin only)
router.get("/users", authenticate, authorize("superadmin"), (req, res) => {
  db.all("SELECT id, email, name, role FROM users", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create admin user (Super Admin only)
router.post("/users", authenticate, authorize("superadmin"), (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!["admin", "customer"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  db.run(
    "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
    [email, password, name, role],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Email already exists" });
        }
        return res.status(500).json({ error: err.message });
      }
      logActivity(req.userId, `Created user: ${email} with role ${role}`);
      res.json({ id: this.lastID, email, name, role });
    }
  );
});

// Delete user (Super Admin only)
router.delete(
  "/users/:id",
  authenticate,
  authorize("superadmin"),
  (req, res) => {
    const { id } = req.params;

    if (parseInt(id) === req.userId) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }

    db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      logActivity(req.userId, `Deleted user ID: ${id}`);
      res.json({ message: "User deleted successfully" });
    });
  }
);

// Get activity logs (Super Admin only)
router.get(
  "/activity-logs",
  authenticate,
  authorize("superadmin"),
  (req, res) => {
    db.all(
      "SELECT al.*, u.email, u.name FROM activity_log al LEFT JOIN users u ON al.userId = u.id ORDER BY al.timestamp DESC LIMIT 100",
      [],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
      }
    );
  }
);

module.exports = router;
