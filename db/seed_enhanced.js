const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const db = new sqlite3.Database(path.join(__dirname, "sqlite.db"));

// Realistic product data structure
const dogBrands = [
  "Purina Pro Plan",
  "Blue Buffalo",
  "Hill's Science Diet",
  "Royal Canin",
  "Iams",
  "Pedigree",
];

const catBrands = [
  "Purina ONE",
  "Blue Buffalo Wilderness",
  "Hill's Science Diet",
  "Royal Canin",
  "Iams",
  "Sheba",
];

const birdBrands = [
  "Kaytee",
  "Harrison's",
  "Prevue Hendryx",
  "ZuPreem",
  "Lafeber",
  "Vitakraft",
];

const dogFoods = [
  "Adult",
  "Puppy",
  "Large Breed",
  "Small Breed",
  "Sensitive Skin",
  "Weight Control",
];

const dogFlavors = [
  "Chicken & Rice",
  "Beef & Brown Rice",
  "Lamb & Oatmeal",
  "Salmon & Rice",
  "Turkey & Sweet Potato",
];

const catLines = [
  "Indoor",
  "Adult",
  "Kitten",
  "Hairball Control",
  "Sensitive Stomach",
  "Weight Control",
];

const catFlavors = [
  "Chicken",
  "Salmon",
  "Tuna",
  "Turkey",
  "Whitefish",
  "Chicken & Rice",
];

// Price arrays in Naira (converted from USD * 1600)
const foodNGN = [36800, 44800, 56000, 64000, 72000, 80000, 88000, 96000];
const treatsNGN = [11200, 14400, 17600, 20800, 24000, 27200];
const toysNGN = [12800, 16000, 20000, 24000, 32000, 40000];
const litterNGN = [16000, 20000, 24000, 28800, 32000, 36800];
const cagesNGN = [64000, 96000, 128000, 160000, 208000];
const fleaNGN = [24000, 32000, 40000, 48000, 56000];

// Image URLs
const DOG_IMG =
  "https://www.petsense.com/cdn/shop/products/30780-1613060731_1b8fcfc7-7cb2-4dad-ab0a-c2e69a60cfe6_2000x.png?v=1739291836";
const CAT_IMG =
  "https://target.scene7.com/is/image/Target/GUEST_1655bbe0-ec99-4063-b0c8-87f2a46da6ad?wid=300&hei=300&fmt=pjpeg";
const BIRD_IMG =
  "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQ3UcS3SLnM-oreBb4evolp_ANmmR_0EdfbR4wIyyzBB9khJ_72MkFEAIqCnQ-L5ETNvUa8to3GtNohpHxoo7EzSejC1-qmp9ydAJoukg1CGInENHK_deaD3A";
const FLEA_TICK_IMG =
  "https://i5.walmartimages.com/seo/Hartz-UltraGuard-Topical-Flea-and-Tick-Prevention-Treatment-for-Cats-Kittens-3-Treatments_43f6bd94-ce69-46ab-b166-e02e21598ee0.bacb6cc37daa87df20e86a6a3407e9ee.jpeg?odnHeight=573&odnWidth=573&odnBg=FFFFFF";

const sku = (prefix, slug, i) =>
  `${prefix}-${slug.toUpperCase().replace(/-/g, "_")}-${String(i).padStart(
    3,
    "0"
  )}`;

const cycle = (arr, i) => arr[(i - 1) % arr.length];

function makeDog(i) {
  const slugs = [
    "dog-food",
    "dog-treats",
    "dog-toys",
    "dog-grooming",
    "dog-flea-tick",
  ];
  const s = cycle(slugs, i);
  const brand = dogBrands[i % dogBrands.length];

  let name, price, description, lifeStage;

  if (s === "dog-food") {
    const line = dogFoods[i % dogFoods.length];
    const flavor = dogFlavors[i % dogFlavors.length];
    name = `${brand} ${line} ${flavor} Dry Dog Food`;
    price = foodNGN[i % foodNGN.length];
    description = "Balanced formula with premium ingredients.";
    lifeStage =
      line === "Puppy"
        ? "Puppy/Kitten"
        : line === "Senior" || line.includes("Senior")
        ? "Senior"
        : "Adult";
  } else if (s === "dog-treats") {
    name = `${brand} Soft-Baked Dog Treats`;
    price = treatsNGN[i % treatsNGN.length];
    description = "Tasty training rewards your dog will love.";
    lifeStage = "Adult";
  } else if (s === "dog-toys") {
    name = `${brand} Durable Chew Toy`;
    price = toysNGN[i % toysNGN.length];
    description = "Interactive play toy for mental stimulation.";
    lifeStage = "Adult";
  } else if (s === "dog-grooming") {
    name = `${brand} Gentle Dog Shampoo`;
    price = litterNGN[i % litterNGN.length];
    description = "Cleans and conditions your dog's coat.";
    lifeStage = "Adult";
  } else {
    name = `${brand} Flea & Tick Topical for Dogs`;
    price = fleaNGN[i % fleaNGN.length];
    description = "Topical prevention treatment.";
    lifeStage = "Adult";
  }

  return {
    name,
    animal: "Dogs",
    category:
      s === "dog-food"
        ? "Food & Treats"
        : s === "dog-treats"
        ? "Food & Treats"
        : s === "dog-toys"
        ? "Toys & Accessories"
        : s === "dog-grooming"
        ? "Health & Grooming"
        : "Health & Grooming",
    price,
    image: s === "dog-flea-tick" ? FLEA_TICK_IMG : DOG_IMG,
    stock: 40 + (i % 60),
    rating: 4.5 + (Math.random() * 0.5).toFixed(1),
    brand,
    lifeStage,
    sku: sku("DOG", s, i),
    description,
  };
}

function makeCat(i) {
  const slugs = [
    "cat-food",
    "cat-treats",
    "cat-toys",
    "cat-litter",
    "cat-flea-tick",
  ];
  const s = cycle(slugs, i);
  const brand = catBrands[i % catBrands.length];

  let name, price, description, lifeStage;

  if (s === "cat-food") {
    const line = catLines[i % catLines.length];
    const flavor = catFlavors[i % catFlavors.length];
    name = `${brand} ${line} ${flavor} Cat Food`;
    price = foodNGN[i % foodNGN.length];
    description = "High-protein formula for optimal health.";
    lifeStage =
      line === "Kitten"
        ? "Puppy/Kitten"
        : line === "Senior" || line.includes("Senior")
        ? "Senior"
        : "Adult";
  } else if (s === "cat-treats") {
    name = `${brand} Crunchy Cat Treats`;
    price = treatsNGN[i % treatsNGN.length];
    description = "Bite-size treats your cat will adore.";
    lifeStage = "Adult";
  } else if (s === "cat-toys") {
    name = `${brand} Feather Teaser Toy`;
    price = toysNGN[i % toysNGN.length];
    description = "Interactive play toy for active cats.";
    lifeStage = "Adult";
  } else if (s === "cat-litter") {
    name = `${brand} Clumping Cat Litter`;
    price = litterNGN[i % litterNGN.length];
    description = "Odor control and easy cleanup.";
    lifeStage = "Adult";
  } else {
    name = `${brand} Flea & Tick Topical for Cats`;
    price = fleaNGN[i % fleaNGN.length];
    description = "Topical prevention treatment.";
    lifeStage = "Adult";
  }

  return {
    name,
    animal: "Cats",
    category:
      s === "cat-food"
        ? "Food & Treats"
        : s === "cat-treats"
        ? "Food & Treats"
        : s === "cat-toys"
        ? "Toys & Accessories"
        : s === "cat-litter"
        ? "Toys & Accessories"
        : "Health & Grooming",
    price,
    image: s === "cat-flea-tick" ? FLEA_TICK_IMG : CAT_IMG,
    stock: 35 + (i % 50),
    rating: 4.5 + (Math.random() * 0.5).toFixed(1),
    brand,
    lifeStage,
    sku: sku("CAT", s, i),
    description,
  };
}

function makeBird(i) {
  const slugs = [
    "bird-food",
    "bird-treats",
    "bird-toys",
    "bird-cages",
    "bird-flea-tick",
  ];
  const s = cycle(slugs, i);
  const brand = birdBrands[i % birdBrands.length];

  let name, price, description, lifeStage;

  if (s === "bird-food") {
    const type = [
      "Parakeet",
      "Cockatiel",
      "Parrot",
      "Finch",
      "Canary",
      "Lovebird",
    ][i % 6];
    name = `${brand} ${type} Seed Mix`;
    price = Math.round(foodNGN[i % foodNGN.length] * 0.6);
    description = `Fortified seed mix for ${type.toLowerCase()}s.`;
    lifeStage = "Adult";
  } else if (s === "bird-treats") {
    name = `${brand} Honey Treat Sticks`;
    price = Math.round(treatsNGN[i % treatsNGN.length] * 0.6);
    description = "Crunchy treat sticks for birds.";
    lifeStage = "Adult";
  } else if (s === "bird-toys") {
    name = `${brand} Foraging Bird Toy`;
    price = Math.round(toysNGN[i % toysNGN.length] * 0.7);
    description = "Stimulating toy for mental enrichment.";
    lifeStage = "Adult";
  } else if (s === "bird-cages") {
    name = `${brand} Easy-Clean Flight Cage`;
    price = cagesNGN[i % cagesNGN.length];
    description = "Spacious cage for your feathered friend.";
    lifeStage = "Adult";
  } else {
    name = `${brand} Flea & Tick Care for Birds`;
    price = Math.round(fleaNGN[i % fleaNGN.length] * 0.8);
    description = "Parasite care treatment.";
    lifeStage = "Adult";
  }

  return {
    name,
    animal: "Birds",
    category:
      s === "bird-food"
        ? "Food & Treats"
        : s === "bird-treats"
        ? "Food & Treats"
        : s === "bird-toys"
        ? "Toys & Accessories"
        : s === "bird-cages"
        ? "Toys & Accessories"
        : "Health & Grooming",
    price,
    image: s === "bird-flea-tick" ? FLEA_TICK_IMG : BIRD_IMG,
    stock: 20 + (i % 40),
    rating: 4.5 + (Math.random() * 0.5).toFixed(1),
    brand,
    lifeStage,
    sku: sku("BIRD", s, i),
    description,
  };
}

// Generate products
const dogs = Array.from({ length: 20 }, (_, i) => makeDog(i + 1));
const cats = Array.from({ length: 20 }, (_, i) => makeCat(i + 1));
const birds = Array.from({ length: 20 }, (_, i) => makeBird(i + 1));

const products = [...dogs, ...cats, ...birds];

// Users
const users = [
  {
    email: "superadmin@petmart.ng",
    password: "super123",
    name: "Super Admin",
    role: "superadmin",
  },
  {
    email: "admin@petmart.ng",
    password: "admin123",
    name: "Admin User",
    role: "admin",
  },
  {
    email: "customer@petmart.ng",
    password: "customer123",
    name: "Customer User",
    role: "customer",
  },
];

// Initialize database
db.serialize(() => {
  // Drop existing tables
  db.run("DROP TABLE IF EXISTS products");
  db.run("DROP TABLE IF EXISTS users");
  db.run("DROP TABLE IF EXISTS orders");
  db.run("DROP TABLE IF EXISTS activity_log");

  // Create tables with updated schema
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      animal TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      image TEXT NOT NULL,
      stock INTEGER NOT NULL,
      rating REAL NOT NULL,
      brand TEXT DEFAULT 'Save My Pet',
      lifeStage TEXT DEFAULT 'Adult',
      sku TEXT,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER NOT NULL,
      customerName TEXT NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (customerId) REFERENCES users (id)
    )
  `);

  db.run(`
    CREATE TABLE activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      action TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `);

  // Insert users
  const userStmt = db.prepare(
    "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)"
  );
  users.forEach((user) => {
    userStmt.run(user.email, user.password, user.name, user.role);
  });
  userStmt.finalize();

  // Insert products
  const productStmt = db.prepare(
    "INSERT INTO products (name, animal, category, price, image, stock, rating, brand, lifeStage, sku, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  products.forEach((product) => {
    productStmt.run(
      product.name,
      product.animal,
      product.category,
      product.price,
      product.image,
      product.stock,
      parseFloat(product.rating),
      product.brand,
      product.lifeStage,
      product.sku,
      product.description
    );
  });
  productStmt.finalize();

  console.log(`✅ Database seeded successfully!`);
  console.log(`   - ${users.length} users created`);
  console.log(`   - ${products.length} products created`);
  console.log(
    `   - Dogs: ${products.filter((p) => p.animal === "Dogs").length} products`
  );
  console.log(
    `   - Cats: ${products.filter((p) => p.animal === "Cats").length} products`
  );
  console.log(
    `   - Birds: ${
      products.filter((p) => p.animal === "Birds").length
    } products`
  );

  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
    } else {
      console.log("Database connection closed.");
    }
    process.exit(0);
  });
});
