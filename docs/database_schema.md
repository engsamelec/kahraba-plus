# Kahraba Plus E-commerce Project: Database Schema

## Database Overview

The Kahraba Plus e-commerce platform requires a robust relational database design to support all the required functionality. This document outlines the detailed database schema with tables, relationships, and key fields to support the e-commerce operations.

## Entity Relationship Diagram (ERD)

```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│    Users      │       │  Categories   │       │   Products    │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ id (PK)       │       │ id (PK)       │       │ id (PK)       │
│ email         │◄──┐   │ name          │       │ name          │
│ password_hash │   │   │ description   │   ┌──►│ description   │
│ first_name    │   │   │ parent_id (FK)│   │   │ price         │
│ last_name     │   │   │ image_url     │   │   │ stock_quantity│
│ phone         │   │   │ created_at    │   │   │ category_id(FK)
│ role          │   │   │ updated_at    │   │   │ image_urls    │
│ created_at    │   │   └───────────────┘   │   │ technical_specs
│ updated_at    │   │                       │   │ created_at    │
└───────────────┘   │                       │   │ updated_at    │
        ▲           │                       │   └───────────────┘
        │           │                       │           ▲
        │           │                       │           │
┌───────────────┐   │   ┌───────────────┐   │   ┌───────────────┐
│   Addresses   │   │   │    Orders     │   │   │  ProductFiles │
├───────────────┤   │   ├───────────────┤   │   ├───────────────┤
│ id (PK)       │   │   │ id (PK)       │   │   │ id (PK)       │
│ user_id (FK)  │───┘   │ user_id (FK)  │───┘   │ product_id(FK)│
│ address_line1 │       │ status        │       │ file_type     │
│ address_line2 │       │ total_amount  │       │ file_url      │
│ city          │       │ payment_method│       │ description   │
│ state         │       │ shipping_addr │       │ created_at    │
│ postal_code   │       │ billing_addr  │       └───────────────┘
│ country       │       │ created_at    │               ▲
│ is_default    │       │ updated_at    │               │
│ created_at    │       └───────┬───────┘               │
│ updated_at    │               │                       │
└───────────────┘               │                       │
        ▲                       │                       │
        │                       ▼                       │
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   Payments    │       │  OrderItems   │       │    Reviews    │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ id (PK)       │       │ id (PK)       │       │ id (PK)       │
│ order_id (FK) │◄──────│ order_id (FK) │       │ product_id(FK)│───┘
│ amount        │       │ product_id(FK)│───────┤ user_id (FK)  │
│ status        │       │ quantity      │       │ rating        │
│ provider      │       │ unit_price    │       │ comment       │
│ reference     │       │ subtotal      │       │ created_at    │
│ created_at    │       │ created_at    │       │ updated_at    │
└───────────────┘       └───────────────┘       └───────────────┘
```

## Detailed Table Schemas

### Users Table

Stores user account information and authentication details.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| first_name | VARCHAR(100) | NOT NULL | User's first name |
| last_name | VARCHAR(100) | NOT NULL | User's last name |
| phone | VARCHAR(20) | | User's contact number |
| role | ENUM | NOT NULL, DEFAULT 'customer' | User role (customer, admin) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Record update time |

### Addresses Table

Stores shipping and billing addresses for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| user_id | INT | FOREIGN KEY, NOT NULL | Reference to Users table |
| address_line1 | VARCHAR(255) | NOT NULL | Primary address line |
| address_line2 | VARCHAR(255) | | Secondary address line |
| city | VARCHAR(100) | NOT NULL | City name |
| state | VARCHAR(100) | NOT NULL | State/province name |
| postal_code | VARCHAR(20) | NOT NULL | ZIP/postal code |
| country | VARCHAR(100) | NOT NULL | Country name |
| is_default | BOOLEAN | DEFAULT FALSE | Whether this is the default address |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Record update time |

### Categories Table

Stores product category information with hierarchical structure.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Category name |
| description | TEXT | | Category description |
| parent_id | INT | FOREIGN KEY | Reference to parent category (self-referential) |
| image_url | VARCHAR(255) | | Category image URL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Record update time |

### Products Table

Stores product information and inventory details.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Product name |
| description | TEXT | NOT NULL | Product description |
| price | DECIMAL(10,2) | NOT NULL | Product price |
| stock_quantity | INT | NOT NULL, DEFAULT 0 | Available inventory |
| category_id | INT | FOREIGN KEY, NOT NULL | Reference to Categories table |
| image_urls | JSON | | JSON array of product image URLs |
| technical_specs | JSON | | JSON object with technical specifications |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Record update time |

### ProductFiles Table

Stores files associated with products (technical documents, videos).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| product_id | INT | FOREIGN KEY, NOT NULL | Reference to Products table |
| file_type | ENUM | NOT NULL | Type (document, video, manual) |
| file_url | VARCHAR(255) | NOT NULL | File storage URL |
| description | VARCHAR(255) | | File description |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

### Orders Table

Stores order information and status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| user_id | INT | FOREIGN KEY, NOT NULL | Reference to Users table |
| status | ENUM | NOT NULL | Status (processing, shipped, delivered, cancelled) |
| total_amount | DECIMAL(10,2) | NOT NULL | Order total amount |
| payment_method | VARCHAR(50) | NOT NULL | Payment method used |
| shipping_address_id | INT | FOREIGN KEY, NOT NULL | Reference to Addresses table |
| billing_address_id | INT | FOREIGN KEY, NOT NULL | Reference to Addresses table |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Record update time |

### OrderItems Table

Stores individual items within an order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| order_id | INT | FOREIGN KEY, NOT NULL | Reference to Orders table |
| product_id | INT | FOREIGN KEY, NOT NULL | Reference to Products table |
| quantity | INT | NOT NULL | Quantity ordered |
| unit_price | DECIMAL(10,2) | NOT NULL | Price at time of purchase |
| subtotal | DECIMAL(10,2) | NOT NULL | Line item total (quantity * unit_price) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

### Payments Table

Stores payment transaction information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| order_id | INT | FOREIGN KEY, NOT NULL | Reference to Orders table |
| amount | DECIMAL(10,2) | NOT NULL | Payment amount |
| status | ENUM | NOT NULL | Status (pending, completed, failed, refunded) |
| provider | VARCHAR(50) | NOT NULL | Payment provider (PayPal, Stripe, etc.) |
| reference | VARCHAR(255) | | Payment reference/transaction ID |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

### Reviews Table

Stores product reviews and ratings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| product_id | INT | FOREIGN KEY, NOT NULL | Reference to Products table |
| user_id | INT | FOREIGN KEY, NOT NULL | Reference to Users table |
| rating | TINYINT | NOT NULL | Rating (1-5) |
| comment | TEXT | | Review comment |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Record update time |

## Key Database Relationships

1. **One-to-Many Relationships**:
   - User → Addresses (one user can have multiple addresses)
   - User → Orders (one user can place multiple orders)
   - Category → Products (one category can contain multiple products)
   - Order → OrderItems (one order can contain multiple items)
   - Order → Payments (one order can have multiple payment attempts)
   - Product → ProductFiles (one product can have multiple associated files)
   - Product → Reviews (one product can have multiple reviews)

2. **Self-Referential Relationships**:
   - Category → Category (categories can have parent-child relationships)

3. **Many-to-One Relationships**:
   - OrderItems → Product (many order items can reference the same product)
   - Reviews → User (many reviews can be written by the same user)

## Indexing Strategy

The following indexes will be created to optimize query performance:

1. **Users Table**:
   - Index on `email` (for login queries)
   - Index on `role` (for filtering by user type)

2. **Products Table**:
   - Index on `category_id` (for filtering products by category)
   - Index on `name` (for product search)
   - Index on `price` (for price range filtering)

3. **Orders Table**:
   - Index on `user_id` (for retrieving user orders)
   - Index on `status` (for filtering orders by status)
   - Index on `created_at` (for date range queries)

4. **OrderItems Table**:
   - Composite index on `order_id, product_id` (for efficient joins)

5. **Reviews Table**:
   - Composite index on `product_id, rating` (for product rating queries)

## Data Integrity Constraints

1. **Foreign Key Constraints**:
   - All foreign keys will have appropriate constraints with cascading updates
   - Delete operations will be restricted to prevent orphaned records

2. **Check Constraints**:
   - Product prices must be greater than zero
   - Review ratings must be between 1 and 5
   - Order quantities must be greater than zero

3. **Unique Constraints**:
   - User email addresses must be unique
   - Product names within the same category should be unique

## Database Migration Strategy

1. **Initial Schema Creation**:
   - Create base tables with core fields
   - Establish relationships and constraints

2. **Incremental Updates**:
   - Use migration scripts for schema changes
   - Version control all database changes

3. **Data Seeding**:
   - Populate initial categories
   - Add sample products for testing

## Performance Considerations

1. **Query Optimization**:
   - Use appropriate indexes for common queries
   - Implement database connection pooling
   - Use prepared statements for all queries

2. **Scaling Strategy**:
   - Implement read replicas for scaling read operations
   - Consider sharding for very large product catalogs
   - Implement caching for frequently accessed data
