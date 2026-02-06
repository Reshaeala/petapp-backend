const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const db = new sqlite3.Database(path.join(__dirname, "sqlite.db"));

// Add brand and lifeStage columns to products table
db.serialize(() => {
  // Add brand column if it doesn't exist
  db.run(
    "ALTER TABLE products ADD COLUMN brand TEXT DEFAULT 'Save My Pet'",
    (err) => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("Error adding brand column:", err.message);
      } else {
        console.log("✅ Brand column added/verified");
      }
    }
  );

  // Add lifeStage column if it doesn't exist
  db.run(
    "ALTER TABLE products ADD COLUMN lifeStage TEXT DEFAULT 'Adult'",
    (err) => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("Error adding lifeStage column:", err.message);
      } else {
        console.log("✅ LifeStage column added/verified");
      }
    }
  );

  // Update existing products with brands and life stages
  const brands = [
    "Save My Pet",
    "Premium Paws",
    "Healthy Pets",
    "Natural Choice",
    "Vet Recommended",
    "Pro Care",
    "Elite Pet",
    "Nature's Best",
  ];

  const lifeStages = ["Puppy/Kitten", "Adult", "Senior"];

  db.all("SELECT id, name FROM products", [], (err, products) => {
    if (err) {
      console.error("Error fetching products:", err);
      db.close();
      return;
    }

    const updateStmt = db.prepare(
      "UPDATE products SET brand = ?, lifeStage = ? WHERE id = ?"
    );

    products.forEach((product, index) => {
      const brand = brands[index % brands.length];
      // Determine life stage based on product name
      let lifeStage = "Adult";
      const name = product.name.toLowerCase();
      if (
        name.includes("puppy") ||
        name.includes("kitten") ||
        name.includes("baby")
      ) {
        lifeStage = "Puppy/Kitten";
      } else if (name.includes("senior")) {
        lifeStage = "Senior";
      } else {
        lifeStage = lifeStages[Math.floor(Math.random() * lifeStages.length)];
      }

      updateStmt.run(brand, lifeStage, product.id);
    });

    updateStmt.finalize();
    console.log(
      `✅ Updated ${products.length} products with brands and life stages`
    );
    db.close();
  });
});
