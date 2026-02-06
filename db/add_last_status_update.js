const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../sqlite.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Check if column already exists
  db.all("PRAGMA table_info(orders)", (err, columns) => {
    if (err) {
      console.error("Error checking table schema:", err);
      return;
    }

    const hasLastStatusUpdate = columns.some(
      (col) => col.name === "lastStatusUpdate"
    );

    if (!hasLastStatusUpdate) {
      console.log("Adding lastStatusUpdate column to orders table...");
      db.run(
        `ALTER TABLE orders ADD COLUMN lastStatusUpdate TEXT`,
        (err) => {
          if (err) {
            console.error("Error adding column:", err);
          } else {
            console.log("✓ lastStatusUpdate column added successfully!");

            // Set lastStatusUpdate to the order date for existing orders
            db.run(
              `UPDATE orders SET lastStatusUpdate = date WHERE lastStatusUpdate IS NULL`,
              (err) => {
                if (err) {
                  console.error("Error updating existing orders:", err);
                } else {
                  console.log("✓ Updated existing orders with lastStatusUpdate!");
                }
                db.close();
              }
            );
          }
        }
      );
    } else {
      console.log("lastStatusUpdate column already exists");
      db.close();
    }
  });
});
