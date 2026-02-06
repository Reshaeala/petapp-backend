CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    image TEXT NOT NULL,
    stock INTEGER NOT NULL,
    rating REAL NOT NULL
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerId INTEGER NOT NULL,
    customerName TEXT NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL,
    date TEXT NOT NULL,
    shippingAddress TEXT,
    shippingCity TEXT,
    shippingState TEXT,
    customerEmail TEXT,
    customerPhone TEXT,
    lastStatusUpdate TEXT,
    FOREIGN KEY (customerId) REFERENCES users (id)
);

CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    action TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
);