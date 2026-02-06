const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "sqlite.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Add phone column to users table
  db.run("ALTER TABLE users ADD COLUMN phone TEXT", (err) => {
    if (err) {
      console.log("Phone column may already exist or error occurred:", err.message);
    } else {
      console.log("✅ Phone column added to users table");
    }
  });

  // Add phone column to orders table for customer contact
  db.run("ALTER TABLE orders ADD COLUMN customerPhone TEXT", (err) => {
    if (err) {
      console.log("customerPhone column may already exist or error occurred:", err.message);
    } else {
      console.log("✅ customerPhone column added to orders table");
    }
  });

  // Add ingredients column to products table
  db.run("ALTER TABLE products ADD COLUMN ingredients TEXT", (err) => {
    if (err) {
      console.log("Ingredients column may already exist or error occurred:", err.message);
    } else {
      console.log("✅ Ingredients column added to products table");
    }
  });

  console.log("✅ Migration completed!");
});

db.close();
