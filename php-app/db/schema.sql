-- JP Laagan MotoPOS — MySQL schema (PHP/InfinityFree edition)
-- Import this file via phpMyAdmin (or `mysql -u user -p dbname < schema.sql`).
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  username      VARCHAR(50) NOT NULL UNIQUE,
  email         VARCHAR(200) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('ADMIN','CASHIER') NOT NULL DEFAULT 'CASHIER',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS brands (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS suppliers (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(200) NOT NULL,
  contact_person VARCHAR(200) NULL,
  phone          VARCHAR(50) NULL,
  email          VARCHAR(200) NULL,
  address        VARCHAR(500) NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  sku            VARCHAR(64) NOT NULL UNIQUE,
  barcode        VARCHAR(64) NULL UNIQUE,
  name           VARCHAR(200) NOT NULL,
  description    VARCHAR(1000) NULL,
  unit           VARCHAR(20) NOT NULL DEFAULT 'pc',
  cost_price     DECIMAL(12,2) NOT NULL DEFAULT 0,
  selling_price  DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantity       INT NOT NULL DEFAULT 0,
  reorder_level  INT NOT NULL DEFAULT 5,
  image_url      VARCHAR(500) NULL,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  category_id    INT NOT NULL,
  brand_id       INT NULL,
  supplier_id    INT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category_id),
  INDEX idx_products_brand (brand_id),
  INDEX idx_products_name (name),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id),
  CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sales (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  invoice_no     VARCHAR(40) NOT NULL UNIQUE,
  customer_name  VARCHAR(200) NULL,
  customer_phone VARCHAR(50) NULL,
  subtotal       DECIMAL(12,2) NOT NULL,
  discount       DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax            DECIMAL(12,2) NOT NULL DEFAULT 0,
  total          DECIMAL(12,2) NOT NULL,
  amount_paid    DECIMAL(12,2) NOT NULL,
  change_due     DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method ENUM('CASH','GCASH','CARD','BANK_TRANSFER') NOT NULL DEFAULT 'CASH',
  status         ENUM('COMPLETED','VOIDED','REFUNDED') NOT NULL DEFAULT 'COMPLETED',
  cashier_id     INT NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sales_cashier (cashier_id),
  INDEX idx_sales_created (created_at),
  CONSTRAINT fk_sales_cashier FOREIGN KEY (cashier_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sale_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  sale_id      INT NOT NULL,
  product_id   INT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  sku          VARCHAR(64) NOT NULL,
  unit_price   DECIMAL(12,2) NOT NULL,
  quantity     INT NOT NULL,
  line_total   DECIMAL(12,2) NOT NULL,
  INDEX idx_sale_items_sale (sale_id),
  INDEX idx_sale_items_product (product_id),
  CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_movements (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type       ENUM('RECEIVE','ADJUSTMENT_IN','ADJUSTMENT_OUT','SALE','RETURN') NOT NULL,
  quantity   INT NOT NULL,
  reason     VARCHAR(300) NULL,
  user_id    INT NOT NULL,
  sale_id    INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_movements_product (product_id),
  INDEX idx_movements_sale (sale_id),
  CONSTRAINT fk_movements_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_movements_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_movements_sale FOREIGN KEY (sale_id) REFERENCES sales(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  business_name       VARCHAR(200) NOT NULL DEFAULT 'JP Laagan MotoPOS',
  address             VARCHAR(500) NULL,
  phone               VARCHAR(50) NULL,
  email               VARCHAR(200) NULL,
  tax_rate            DECIMAL(5,2) NOT NULL DEFAULT 0,
  currency            VARCHAR(10) NOT NULL DEFAULT 'PHP',
  receipt_footer      VARCHAR(500) NULL,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
