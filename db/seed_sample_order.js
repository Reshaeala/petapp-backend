const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const db = new sqlite3.Database(path.join(__dirname, "sqlite.db"));

// Create a sample order with items and shipping address
db.serialize(() => {
  const status = "pending";
  const date = new Date().toISOString();

  db.run(
    `INSERT INTO orders (customerId, customerName, customerEmail, shippingAddress, shippingCity, shippingState, total, status, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      3, // customer user ID
      "John Doe",
      "customer@petmart.ng",
      "123 Pet Street, Victoria Island",
      "Lagos",
      "Lagos State",
      15800, // total
      status,
      date
    ],
    function (err) {
      if (err) {
        console.error("Error creating order:", err.message);
        db.close();
        return;
      }

      const orderId = this.lastID;
      console.log(`✅ Created sample order ID: ${orderId}`);

      // Add order items
      const items = [
        { productId: 1, productName: "Premium Dog Food - Chicken & Rice", quantity: 2, price: 4500 },
        { productId: 5, productName: "Dog Treats - Training Bites", quantity: 3, price: 1200 },
        { productId: 15, productName: "Puppy Milk Replacer", quantity: 1, price: 3500 }
      ];

      const stmt = db.prepare(
        "INSERT INTO order_items (orderId, productId, productName, quantity, price) VALUES (?, ?, ?, ?, ?)"
      );

      items.forEach((item) => {
        stmt.run(orderId, item.productId, item.productName, item.quantity, item.price);
      });

      stmt.finalize((err) => {
        if (err) {
          console.error("Error adding order items:", err.message);
        } else {
          console.log(`✅ Added ${items.length} items to order ${orderId}`);
        }
        db.close();
      });
    }
  );
});
