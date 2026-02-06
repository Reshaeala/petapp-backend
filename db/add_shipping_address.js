const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const db = new sqlite3.Database(path.join(__dirname, "sqlite.db"));

// Add shipping address columns to orders table
db.serialize(() => {
  const columns = [
    "ALTER TABLE orders ADD COLUMN shippingAddress TEXT",
    "ALTER TABLE orders ADD COLUMN shippingCity TEXT",
    "ALTER TABLE orders ADD COLUMN shippingState TEXT",
    "ALTER TABLE orders ADD COLUMN customerEmail TEXT"
  ];

  let completed = 0;
  columns.forEach((sql) => {
    db.run(sql, (err) => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("Error adding column:", err.message);
      } else {
        console.log(`✅ Column added/verified: ${sql.split(" ")[5]}`);
      }
      completed++;
      if (completed === columns.length) {
        console.log("✅ All shipping address columns added successfully");
        db.close();
      }
    });
  });
});
