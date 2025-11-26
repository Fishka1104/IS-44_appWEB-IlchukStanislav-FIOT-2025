// === Role (Roles) ===
class Role {
    constructor({ role_id = null, role_name }) {
        this.roleId = role_id;
        this.name = role_name;
    }
}

// === Address (Addresses) ===
class Address {
    constructor({
        address_id = null,
        user_id,
        city,
        street_address,
        postal_code = null,
        is_default = false
    }) {
        this.addressId = address_id;
        this.userId = user_id;
        this.city = city;
        this.streetAddress = street_address;
        this.postalCode = postal_code;
        this.isDefault = Boolean(is_default);
    }

    toString() {
        return `${this.city}, ${this.streetAddress}${this.postalCode ? ", " + this.postalCode : ""}`;
    }
}

// === User (Users + UserRoles + Addresses) ===
class User {
    constructor({
        user_id = null,
        first_name,
        last_name = null,
        email,
        phone_number = null,
        password_hash,
        created_at = null,
        roles = [],
        addresses = []
    }) {
        this.userId = user_id;
        this.firstName = first_name;
        this.lastName = last_name;
        this.email = email;
        this.phoneNumber = phone_number;
        this.passwordHash = password_hash; // у реальному проєкті хеш робиться на бекенді
        this.createdAt = created_at ? new Date(created_at) : new Date();

        this.roles = roles.map(r => r instanceof Role ? r : new Role(r));
        this.addresses = addresses.map(a => a instanceof Address ? a : new Address(a));
    }

    get fullName() {
        return [this.firstName, this.lastName].filter(Boolean).join(" ");
    }

    isAdmin() {
        return this.roles.some(r => r.name === "Admin");
    }

    addRole(role) {
        const r = role instanceof Role ? role : new Role(role);
        if (!this.roles.some(existing => existing.roleId === r.roleId || existing.name === r.name)) {
            this.roles.push(r);
        }
    }

    addAddress(address) {
        const addr = address instanceof Address ? address : new Address(address);
        if (addr.isDefault) {
            this.addresses.forEach(a => a.isDefault = false);
        }
        this.addresses.push(addr);
    }

    get defaultAddress() {
        return this.addresses.find(a => a.isDefault) || this.addresses[0] || null;
    }
}

// === Category (Categories) ===
class Category {
    constructor({
        category_id = null,
        name,
        description = null,
        parent_category_id = null
    }) {
        this.categoryId = category_id;
        this.name = name;
        this.description = description;
        this.parentCategoryId = parent_category_id;
        this.children = [];
    }

    addChild(category) {
        const cat = category instanceof Category ? category : new Category(category);
        this.children.push(cat);
        cat.parentCategoryId = this.categoryId;
    }
}

// === Review (Reviews) ===
class Review {
    constructor({
        review_id = null,
        user_id = null,
        product_id,
        rating,
        review_text = null,
        review_date = null,
        user = null,
        product = null
    }) {
        this.reviewId = review_id;
        this.userId = user_id;
        this.productId = product_id;
        this.rating = rating;
        this.reviewText = review_text;
        this.reviewDate = review_date ? new Date(review_date) : new Date();

        this.user = user;       // User (опційно, якщо завантажиш)
        this.product = product; // Product (опційно)
    }
}

// === Product (Products) ===
class Product {
    constructor({
        product_id = null,
        category_id = null,
        name,
        description = null,
        price,
        stock_quantity = 0,
        sku = null,
        created_at = null,
        category = null,
        reviews = []
    }) {
        this.productId = product_id;
        this.categoryId = category_id || (category ? category.categoryId : null);
        this.name = name;
        this.description = description;
        this.price = Number(price);
        this.stockQuantity = stock_quantity;
        this.sku = sku;
        this.createdAt = created_at ? new Date(created_at) : new Date();

        this.category = category instanceof Category ? category : category;
        this.reviews = reviews.map(r => r instanceof Review ? r : new Review(r));
    }

    get isInStock() {
        return this.stockQuantity > 0;
    }

    get averageRating() {
        if (!this.reviews.length) return null;
        const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
        return sum / this.reviews.length;
    }

    addReview(review) {
        const r = review instanceof Review ? review : new Review(review);
        this.reviews.push(r);
    }

    decreaseStock(qty) {
        const quantity = Number(qty);
        if (quantity > this.stockQuantity) {
            throw new Error("Недостатня кількість товару на складі");
        }
        this.stockQuantity -= quantity;
    }
}

// === OrderItem (OrderItems) ===
class OrderItem {
    constructor({
        order_item_id = null,
        order_id,
        product_id,
        quantity,
        price_per_unit,
        product = null
    }) {
        this.orderItemId = order_item_id;
        this.orderId = order_id;
        this.productId = product_id || (product ? product.productId : null);
        this.quantity = quantity;
        this.pricePerUnit = Number(price_per_unit);
        this.product = product instanceof Product ? product : product;
    }

    get lineTotal() {
        return this.quantity * this.pricePerUnit;
    }
}

// === Order (Orders + OrderItems) ===
class Order {
    constructor({
        order_id = null,
        user_id,
        shipping_address_id,
        order_date = null,
        status = 'Pending',
        total_amount = 0,
        user = null,
        shippingAddress = null,
        items = []
    }) {
        this.orderId = order_id;
        this.userId = user_id;
        this.shippingAddressId = shipping_address_id;
        this.orderDate = order_date ? new Date(order_date) : new Date();
        this.status = status;
        this.totalAmount = Number(total_amount);

        this.user = user instanceof User ? user : user;
        this.shippingAddress = shippingAddress instanceof Address ? shippingAddress : shippingAddress;
        this.items = items.map(i => i instanceof OrderItem ? i : new OrderItem(i));
    }

    addItem(product, quantity, pricePerUnit = null) {
        const p = product instanceof Product ? product : new Product(product);
        const price = pricePerUnit !== null ? pricePerUnit : p.price;

        const existing = this.items.find(i => i.productId === p.productId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            this.items.push(
                new OrderItem({
                    order_id: this.orderId,
                    product_id: p.productId,
                    quantity,
                    price_per_unit: price,
                    product: p
                })
            );
        }

        this.recalculateTotal();
    }

    removeItem(productId) {
        this.items = this.items.filter(i => i.productId !== productId);
        this.recalculateTotal();
    }

    recalculateTotal() {
        this.totalAmount = this.items.reduce((sum, item) => sum + item.lineTotal, 0);
    }
}

// === Wishlist (Wishlists) ===
class WishlistItem {
    constructor({ user_id, product_id, added_at = null, user = null, product = null }) {
        this.userId = user_id;
        this.productId = product_id;
        this.addedAt = added_at ? new Date(added_at) : new Date();
        this.user = user instanceof User ? user : user;
        this.product = product instanceof Product ? product : product;
    }
}

class Wishlist {
    constructor({ user, items = [] }) {
        this.user = user instanceof User ? user : user;
        this.items = items.map(i => i instanceof WishlistItem ? i : new WishlistItem(i));
    }

    addProduct(product) {
        const p = product instanceof Product ? product : new Product(product);
        if (!this.items.some(i => i.productId === p.productId)) {
            this.items.push(new WishlistItem({ user_id: this.user.userId, product_id: p.productId, product: p }));
        }
    }

    removeProduct(productId) {
        this.items = this.items.filter(i => i.productId !== productId);
    }
}

// === AuditLog (AuditLogs) — опційно ===
class AuditLogEntry {
    constructor({
        log_id = null,
        user_id = null,
        action_type,
        table_name,
        record_id,
        old_values = null,
        new_values = null,
        timestamp = null
    }) {
        this.logId = log_id;
        this.userId = user_id;
        this.actionType = action_type;
        this.tableName = table_name;
        this.recordId = record_id;
        this.oldValues = old_values;
        this.newValues = new_values;
        this.timestamp = timestamp ? new Date(timestamp) : new Date();
    }
}
