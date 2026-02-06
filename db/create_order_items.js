const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const db = new sqlite3.Database(path.join(__dirname, "sqlite.db"));

// Create order_items table
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      productName TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price INTEGER NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products (id)
    )`,
    (err) => {
      if (err) {
        console.error("Error creating order_items table:", err.message);
      } else {
        console.log("✅ order_items table created successfully");
      }
      db.close();
    }
  );
});
