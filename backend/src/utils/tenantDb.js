const prisma = require("../db");

// Create a new tenant schema with all required tables
const createTenantSchema = async (schemaName) => {
  try {
    // Create schema
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

    // Create users table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE ${schemaName}.users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'cashier')),
        branch_id INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create branches table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE ${schemaName}.branches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create categories table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE ${schemaName}.categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE ${schemaName}.products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category_id INTEGER REFERENCES ${schemaName}.categories(id),
        type VARCHAR(50) NOT NULL CHECK (type IN ('piece', 'kg_price')),
        purchase_price NUMERIC(12, 2) NOT NULL,
        sale_price NUMERIC(12, 2) NOT NULL,
        quantity NUMERIC(12, 3) DEFAULT 0,
        min_quantity NUMERIC(12, 3) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sales table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE ${schemaName}.sales (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES ${schemaName}.users(id),
        branch_id INTEGER REFERENCES ${schemaName}.branches(id),
        total_amount NUMERIC(12, 2) NOT NULL,
        payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('cash', 'card')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sale_items table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE ${schemaName}.sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES ${schemaName}.sales(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES ${schemaName}.products(id),
        quantity NUMERIC(12, 3) NOT NULL,
        total_price NUMERIC(12, 2) NOT NULL,
        profit NUMERIC(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await prisma.$executeRawUnsafe(
      `CREATE INDEX idx_sales_created_at ON ${schemaName}.sales(created_at)`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX idx_sale_items_sale_id ON ${schemaName}.sale_items(sale_id)`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX idx_products_category_id ON ${schemaName}.products(category_id)`,
    );

    console.log(`✅ Created tenant schema: ${schemaName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating tenant schema ${schemaName}:`, error);
    throw error;
  }
};

// Execute raw query in tenant schema
const executeInTenantSchema = async (schemaName, query, params = []) => {
  await prisma.$executeRawUnsafe(`SET search_path TO ${schemaName}, public`);
  return await prisma.$queryRawUnsafe(query, ...params);
};

// Query in tenant schema
const queryInTenantSchema = async (schemaName, query, params = []) => {
  await prisma.$executeRawUnsafe(`SET search_path TO ${schemaName}, public`);
  return await prisma.$queryRawUnsafe(query, ...params);
};

module.exports = {
  createTenantSchema,
  executeInTenantSchema,
  queryInTenantSchema,
};
