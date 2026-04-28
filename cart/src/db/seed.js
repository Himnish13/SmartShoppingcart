const initializeTables = require("./models");
const db = initializeTables();

function seedData() {
  db.serialize(() => {

//     // ---- NODES ----
//     db.run(`
//       INSERT INTO nodes (node_id, x, y) VALUES
//       (1,10,10),(2,10,7),(3,10,4),(4,10,0),
//       (5,5,10),(6,5,7),(7,5,4),(8,5,0),
//       (9,0,10),(10,0,7),(11,0,4),(12,0,2),(13,0,0),
//       (20,2,2),(25,3,3)  -- added missing nodes
//     `);

//     // ---- CATEGORY ----
//     db.run(`
//       INSERT INTO category (category_id, category_name, node_id) VALUES
//       (1,'Chocolates',5),
//       (2,'Biscuits',10),
//       (3,'Chips',9),
//       (4,'Stationary',3),
//       (5,'Skin Care',7),
//       (6,'Fridge',8),
//       (7,'Billing',12)
//     `);

//     // ---- PRODUCTS ----
//     db.run(`
//   INSERT INTO products 
// (product_id, barcode, name, price, stock, category_id, node_id, image_url) VALUES

// -- 🍫 Chocolates
// (1,'890100000001','Dairy Milk Chocolate',50.00,20,1,5,'https://fbflowerbasket.com/wp-content/uploads/2023/11/5-Cadbury-Dairy-Milk-Chcolates-13.2-gms.jpg'),
// (2,'890100000002','KitKat',40.00,20,1,5,'https://ik.imagekit.io/wlfr/wellness/images/products/300995-1.jpg'),
// (3,'890100000003','Five Star',35.00,20,1,5,'https://www.snackspause.com/cdn/shop/products/image_c265338f-aa28-4eec-a740-cc873ad51391.jpg'),
// (101,'890100001019','Munch',20.00,20,1,5,'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/NI_CATALOG/IMAGES/CIW/2026/2/28/47ef4582-28b8-485e-868f-0135e9465b7c_61015_1.png'),

// -- 🍪 Biscuits
// (4,'890100000004','Oreo Biscuits',30.00,20,2,10,'https://www.bbassets.com/media/uploads/p/l/100609485_42-cadbury-oreo-creame-biscuit-chocolate.jpg'),
// (5,'890100000005','Good Day Biscuits',25.00,20,2,10,'https://hbkirana.in/wp-content/uploads/2025/03/image_19_z4kx-rb_1920x.jpg'),
// (6,'890100000006','Marie Gold',20.00,20,2,10,'https://www.haridwarmart.com/wp-content/uploads/2021/01/haridwar-mart-marie-gold.png'),

// -- 🍟 Chips
// (7,'890100000007','Lays Masala',20.00,20,3,9,'https://www.bbassets.com/media/uploads/p/xl/102750_17-lays-potato-chips-indias-magic-masala.jpg'),
// (8,'890100000008','Kurkure Masala Munch',20.00,20,3,9,'https://m.media-amazon.com/images/I/71LyKlizpuL.jpg'),
// (9,'890100000009','Doritos Nacho Cheese',35.00,20,3,9,'https://m.media-amazon.com/images/I/81IyMnDbyaL.jpg'),

// -- ❗ Pringles = 0 stock
// (102,'890100001020','Pringles',30.00,0,3,9,'https://m.media-amazon.com/images/I/71Am3+vMg+L.jpg'),

// -- ✏️ Stationary
// (10,'890100000010','Ball Pen',10.00,20,4,3,'https://www.sfdstore.com/wp-content/uploads/2020/04/CelloPinpoint.jpg'),
// (11,'890100000011','Classmate Notebook',60.00,20,4,3,'https://i0.wp.com/grovertechno.com/wp-content/uploads/2024/07/Untitled-4_0000_Layer-2-1.jpg'),
// (12,'890100000012','Marker',25.00,20,4,3,'https://i0.wp.com/wisycart.com/wp-content/uploads/2022/09/WBM-Black-sqr-img.png'),
// (104,'8901765126122','Hauser Black Pen',10.00,20,4,3,'https://www.rangbeerangee.com/wp-content/uploads/2021/08/Hauser-XO-Ball-point-pen-Black.jpg'),

// -- 🧴 Skin Care
// (13,'890100000013','Nivea Face Wash',180.00,20,5,7,'https://static.beautytocare.com/media/catalog/product/n/i/nivea-men-protect-care-deep-cleaning-face-wash-100ml_1.jpg'),
// (14,'890100000014','Ponds Cream',150.00,20,5,7,'https://www.bbassets.com/media/uploads/p/l/40002056_11-ponds-bright-beauty-spot-less-glow-spf-15-day-cream.jpg'),

// -- ❗ Himalaya products = 1 stock
// (15,'890100000015','Himalaya Face Scrub',200.00,1,5,7,'https://himalayawellness.in/cdn/shop/products/PURIFYING-NEEM-FACE-SCRUB-50G.jpg'),
// (103,'8901138508159','Himalaya Body Lotion',300.00,1,5,7,'https://m.media-amazon.com/images/I/51HzgC8ytcL._SY879_.jpg'),

// -- 🥛 Fridge Items
// (16,'890100000016','Amul Milk',60.00,20,6,8,'https://image.cdn.shpy.in/340140/amul-milk-450ml-1702624298460_SKU-1665_0.jpg'),
// (17,'890100000017','Coco Cola Bottle',40.00,20,6,8,'https://m.media-amazon.com/images/I/81kx2IPueEL.jpg'),
// (18,'890100000018','Butter Pack',120.00,20,6,8,'https://cdn.rationatmydoor.com/wp-content/uploads/2019/02/amul-butter-250x250.jpg')
// `);
//     // ---- EDGES (FULL) ----
//     db.run(`
//       INSERT INTO edges (from_node, to_node, distance) VALUES
//       (1,2,3),
//       (1,5,5),
//       (2,3,3),
//       (2,6,5),
//       (3,4,4),
//       (3,7,5),
//       (4,8,5),
//       (5,6,3),
//       (5,9,5),
//       (6,7,3),
//       (7,8,4),
//       (8,13,5),
//       (9,10,3),
//       (10,11,3),
//       (11,7,5),
//       (11,12,2),
//       (12,13,2)
//     `);

//     // ---- BEACONS ----
//     db.run(`
//       INSERT INTO beacons (beacon_id, node_id) VALUES
//       ('B1',1),
//       ('B2',5),
//       ('B3',6),
//       ('B4',10),
//       ('B5',7)
//     `);

//     // ---- OFFERS ----
//     db.run(`
//       INSERT INTO offers (product_id, discount) VALUES
//       (1,10),
//       (4,5),
//       (7,10),
//       (13,15)
//     `);

//     // ---- CROWD ----
//     db.run(`
//       INSERT INTO crowd (node_id, density) VALUES
//       (1,2),
//       (5,6),
//       (7,4),
//       (9,3),
//       (10,2)
//     `);

    // ---- CART ITEMS ----
    db.run(`
      INSERT INTO cart_items (product_id, quantity, price_at_scan) VALUES
      (1,2,45.00),
      (4,1,28.50),
      (13,1,153.00)
    `);

    console.log("✅ FULL DATABASE SEEDED PERFECTLY");
  });
}

seedData();
