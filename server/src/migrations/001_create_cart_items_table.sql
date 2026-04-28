-- Create cart_items table to track items added/removed from carts
CREATE TABLE IF NOT EXISTS cart_items (
  cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
  cart_id VARCHAR(255) NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price_at_scan DECIMAL(10, 2),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  removed_at TIMESTAMP NULL,
  FOREIGN KEY (product_id) REFERENCES product_mastery(product_id),
  INDEX idx_cart_id (cart_id),
  INDEX idx_product_id (product_id),
  INDEX idx_removed_at (removed_at)
);
