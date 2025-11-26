use techstore;
-- Встановлюємо кодування та рушій за замовчуванням
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
--
-- Таблиця: Roles (Ролі)
-- Зберігає визначені ролі в системі (Адмін, Клієнт).
--
DROP TABLE IF EXISTS Roles;
CREATE TABLE Roles (
  role_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL,
  UNIQUE KEY role_name_UNIQUE (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Таблиця ролей користувачів';
--
-- Таблиця: Users (Користувачі)
-- Зберігає основну інформацію про користувачів.
--
DROP TABLE IF EXISTS Users;
CREATE TABLE Users (
  user_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) DEFAULT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL COMMENT 'Завжди зберігайте хеш пароля, а не сам пароль!',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY email_UNIQUE (email),
  UNIQUE KEY phone_number_UNIQUE (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Таблиця користувачів';
--
-- Таблиця: UserRoles (Зв'язок Користувачі-Ролі)
-- Зв'язуюча таблиця (багато-до-багатьох) для реалізації рольової моделі.
--
DROP TABLE IF EXISTS UserRoles;
CREATE TABLE UserRoles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  KEY fk_UserRoles_Roles_idx (role_id),
  CONSTRAINT fk_UserRoles_Users
    FOREIGN KEY (user_id)
    REFERENCES Users (user_id)
    ON DELETE CASCADE -- Якщо видалити користувача, його рольові зв'язки зникають
    ON UPDATE CASCADE,
  CONSTRAINT fk_UserRoles_Roles
    FOREIGN KEY (role_id)
    REFERENCES Roles (role_id)
    ON DELETE CASCADE -- Якщо видалити роль, зв'язки зникають
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Зв''язок користувачів з їх ролями';
--
-- Таблиця: Addresses (Адреси доставки)
-- Нормалізована таблиця для адрес. Користувач може мати декілька адрес.
--
DROP TABLE IF EXISTS Addresses;
CREATE TABLE Addresses (
  address_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  city VARCHAR(100) NOT NULL,
  street_address VARCHAR(255) NOT NULL COMMENT 'Вулиця, номер будинку, квартира',
  postal_code VARCHAR(10) DEFAULT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (address_id),
  KEY fk_Addresses_Users_idx (user_id),
  CONSTRAINT fk_Addresses_Users
    FOREIGN KEY (user_id)
    REFERENCES Users (user_id)
    ON DELETE CASCADE -- Якщо видалити користувача, його адреси теж видаляються
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Адреси доставки користувачів';
--
-- Таблиця: Categories (Категорії товарів)
--
DROP TABLE IF EXISTS Categories;
CREATE TABLE Categories (
  category_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  parent_category_id INT DEFAULT NULL COMMENT 'Для реалізації підкатегорій',
  PRIMARY KEY (category_id),
  UNIQUE KEY name_UNIQUE (name),
  KEY fk_Categories_Parent_idx (parent_category_id),
  CONSTRAINT fk_Categories_Parent
    FOREIGN KEY (parent_category_id)
    REFERENCES Categories (category_id)
    ON DELETE SET NULL -- Якщо видалити батьківську категорію, дочірні стають головними
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Категорії товарів';
--
-- Таблиця: Products (Товари)
--
DROP TABLE IF EXISTS Products;
CREATE TABLE Products (
  product_id INT NOT NULL AUTO_INCREMENT,
  category_id INT DEFAULT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0 COMMENT 'Наявність',
  sku VARCHAR(100) DEFAULT NULL COMMENT 'Артикул',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id),
  UNIQUE KEY sku_UNIQUE (sku),
  KEY fk_Products_Categories_idx (category_id),
  CONSTRAINT chk_price_positive CHECK (price > 0), -- Обмеження CHECK
  CONSTRAINT chk_stock_non_negative CHECK (stock_quantity >= 0),
  CONSTRAINT fk_Products_Categories
    FOREIGN KEY (category_id)
    REFERENCES Categories (category_id)
    ON DELETE SET NULL -- Якщо видалити категорію, товар залишається "без категорії"
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Таблиця товарів';
--
-- Таблиця: Orders (Замовлення)
--
DROP TABLE IF EXISTS Orders;
CREATE TABLE Orders (
  order_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  shipping_address_id INT NOT NULL,
  order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (order_id),
  KEY fk_Orders_Users_idx (user_id),
  KEY fk_Orders_Addresses_idx (shipping_address_id),
  CONSTRAINT fk_Orders_Users
    FOREIGN KEY (user_id)
    REFERENCES Users (user_id)
    ON DELETE RESTRICT -- Не дозволяємо видаляти користувача, якщо у нього є замовлення
    ON UPDATE CASCADE,
  CONSTRAINT fk_Orders_Addresses
    FOREIGN KEY (shipping_address_id)
    REFERENCES Addresses (address_id)
    ON DELETE RESTRICT -- Не дозволяємо видаляти адресу, що прив'язана до замовлення
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Таблиця замовлень';
--
-- Таблиця: OrderItems (Позиції в замовленні)
-- Зв'язуюча таблиця (багато-до-багатьох) між Orders та Products.
-- Це виправляє ER-діаграму (Замовлення -> містить -> Товар).
--
DROP TABLE IF EXISTS OrderItems;
CREATE TABLE OrderItems (
  order_item_id INT NOT NULL AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL COMMENT 'Ціна на момент покупки!',
  PRIMARY KEY (order_item_id),
  UNIQUE KEY order_product_UNIQUE (order_id, product_id), -- Товар не може бути двічі в одному замовленні
  KEY fk_OrderItems_Orders_idx (order_id),
  KEY fk_OrderItems_Products_idx (product_id),
  CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
  CONSTRAINT fk_OrderItems_Orders
    FOREIGN KEY (order_id)
    REFERENCES Orders (order_id)
    ON DELETE CASCADE -- Якщо видалити замовлення, його вміст теж видаляється
    ON UPDATE CASCADE,
  CONSTRAINT fk_OrderItems_Products
    FOREIGN KEY (product_id)
    REFERENCES Products (product_id)
    ON DELETE RESTRICT -- Не дозволяємо видаляти товар, якщо він є у замовленнях
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Позиції товарів у кожному замовленні';
--
-- Таблиця: Reviews (Відгуки)
--
DROP TABLE IF EXISTS Reviews;
CREATE TABLE Reviews (
  review_id INT NOT NULL AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  product_id INT NOT NULL,
  rating INT NOT NULL,
  review_text TEXT DEFAULT NULL,
  review_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id),
  KEY fk_Reviews_Users_idx (user_id),
  KEY idx_product_id (product_id) COMMENT 'Індекс для швидкого пошуку відгуків за товаром',
  CONSTRAINT chk_rating_range CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT fk_Reviews_Users
    FOREIGN KEY (user_id)
    REFERENCES Users (user_id)
    ON DELETE SET NULL -- Якщо користувач видаляється, відгук стає анонімним
    ON UPDATE CASCADE,
  CONSTRAINT fk_Reviews_Products
    FOREIGN KEY (product_id)
    REFERENCES Products (product_id)
    ON DELETE CASCADE -- Якщо видалити товар, його відгуки теж видаляються
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Відгуки користувачів про товари';
--
-- Таблиця: Wishlists (Список бажаного)
-- Зв'язуюча таблиця (багато-до-багатьох) між Users та Products.
--
DROP TABLE IF EXISTS Wishlists;
CREATE TABLE Wishlists (
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  KEY fk_Wishlists_Products_idx (product_id),
  CONSTRAINT fk_Wishlists_Users
    FOREIGN KEY (user_id)
    REFERENCES Users (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_Wishlists_Products
    FOREIGN KEY (product_id)
    REFERENCES Products (product_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Список бажаного (багато-до-багатьох)';
--
-- Таблиця: AuditLogs (Журнал аудиту - Опційно, як у завданні)
--
DROP TABLE IF EXISTS AuditLogs;
CREATE TABLE AuditLogs (
  log_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id INT DEFAULT NULL COMMENT 'Користувач, що виконав дію (NULL для системи)',
  action_type VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  old_values JSON DEFAULT NULL,
  new_values JSON DEFAULT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY idx_action_user (user_id),
  KEY idx_action_table_record (table_name, record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Журнал змін (опційно)';

SET foreign_key_checks = 1;

USE techstore;

ALTER TABLE Products
  ADD COLUMN brand VARCHAR(100) DEFAULT NULL AFTER name,
  ADD COLUMN product_type VARCHAR(50) DEFAULT NULL
    COMMENT 'Призначення / тип (office, gaming, ultrabook і т.п.)' AFTER brand;


INSERT INTO Categories (category_id, name, description, parent_category_id) VALUES
(1,  'Смартфони та телефони',       'Смартфони, мобільні телефони та аксесуари', NULL),
(2,  'Телевізори і аудіотехніка',   'Телевізори, саундбари, аудіосистеми',        NULL),
(3,  'Ноутбуки, ПК і Планшети',     'Ноутбуки, настільні ПК та планшети',         NULL),
(4,  'Техніка для кухні',           'Плити, мікрохвильові печі, мультиварки',     NULL),
(5,  'Техніка для дому',            'Пилососи, праски та інша техніка для дому',  NULL),
(6,  'Ігрова зона',                 'Ігрові приставки, геймпади, аксесуари',      NULL),
(7,  'Посуд',                       'Посуд для приготування й сервірування',      NULL),
(8,  'Фото і відео',                'Фотоапарати, відеокамери та аксесуари',      NULL),
(9,  'Краса та здоров''я',          'Техніка й товари для догляду за собою',      NULL),
(10, 'Авто і інструменти',          'Товари для авто та інструменти',             NULL),
(11, 'Спорт і туризм',              'Товари для спорту та активного відпочинку',  NULL),
(12, 'Товари для дому та саду',     'Все для дому, саду та дачі',                  NULL),
(13, 'Товари для дітей',            'Іграшки, техніка та товари для дітей',       NULL);

ALTER TABLE Categories AUTO_INCREMENT = 14;