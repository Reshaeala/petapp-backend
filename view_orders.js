const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "sqlite.db");
const db = new sqlite3.Database(dbPath);

console.log("\n=== ORDERS TABLE ===\n");

db.all(
  "SELECT id, customerName, total, status, date, lastStatusUpdate FROM orders ORDER BY id DESC LIMIT 20",
  (err, rows) => {
    if (err) {
      console.error("Error:", err);
      return;
    }

    if (rows.length === 0) {
      console.log("No orders found.");
      db.close();
      return;
    }

    console.log("Latest 20 orders:\n");
    rows.forEach((row) => {
      const daysSinceUpdate = row.lastStatusUpdate
        ? Math.floor(
            (new Date() - new Date(row.lastStatusUpdate)) / (1000 * 60 * 60 * 24)
          )
        : "N/A";

      console.log(`Order #${row.id}`);
      console.log(`  Customer: ${row.customerName}`);
      console.log(`  Total: ₦${row.total.toLocaleString()}`);
      console.log(`  Status: ${row.status}`);
      console.log(`  Date: ${new Date(row.date).toLocaleString()}`);
      console.log(
        `  Last Updated: ${
          row.lastStatusUpdate
            ? new Date(row.lastStatusUpdate).toLocaleString()
            : "N/A"
        }`
      );
      console.log(`  Days since update: ${daysSinceUpdate}`);
      console.log("");
    });

    db.close();
  }
);
