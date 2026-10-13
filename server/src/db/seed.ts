import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

import bcrypt from 'bcrypt';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index';

const BCRYPT_ROUNDS = 12;

async function seed() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('Seeding database...');

  // 1. Categories
  const categoryData = [
    { name: 'Books', description: 'Textbooks, notebooks, reference books', skuPrefix: 'BK' },
    { name: 'Copies', description: 'Ruled, unruled, drawing copies', skuPrefix: 'CP' },
    { name: 'Stationery', description: 'Pens, pencils, erasers, rulers', skuPrefix: 'ST' },
    { name: 'Art Supplies', description: 'Colors, brushes, canvas, sketch pads', skuPrefix: 'ART' },
    { name: 'Office', description: 'Staplers, files, folders, tape', skuPrefix: 'OF' },
  ];

  const categories = await db.insert(schema.categories).values(categoryData).returning();
  console.log(`Created ${categories.length} categories`);

  const catMap: Record<string, string> = {};
  for (const cat of categories) {
    catMap[cat.name] = cat.id;
  }

  // 2. Admin user
  const passwordHash = await bcrypt.hash('changeme123', BCRYPT_ROUNDS);
  const [admin] = await db.insert(schema.users).values({
    email: 'admin@shoppos.local',
    passwordHash,
    name: 'John Doe',
    role: 'admin',
    phone: '+91 9876543200',
  }).returning();
  console.log(`Created admin user: ${admin.email}`);

  // 3. Products (prices in paise = rupees * 100)
  const productData = [
    { name: 'Notebook - 200 Pages', categoryId: catMap['Copies'], price: 4500, stock: 150, sku: 'CP-001', barcode: '8901234560010', unit: 'piece' },
    { name: 'Notebook - 100 Pages', categoryId: catMap['Copies'], price: 3000, stock: 200, sku: 'CP-002', barcode: '8901234560027', unit: 'piece' },
    { name: 'Register - 400 Pages', categoryId: catMap['Copies'], price: 8500, stock: 80, sku: 'CP-003', barcode: '8901234560034', unit: 'piece' },
    { name: 'Drawing Book A4', categoryId: catMap['Copies'], price: 5500, stock: 60, sku: 'CP-004', barcode: '8901234560041', unit: 'piece' },
    { name: 'Graph Paper Pad', categoryId: catMap['Copies'], price: 4000, stock: 45, sku: 'CP-005', barcode: '8901234560058', unit: 'piece' },
    { name: 'Ball Pen (Blue) - Pack of 10', categoryId: catMap['Stationery'], price: 6000, stock: 300, sku: 'ST-001', barcode: '8901765117001', unit: 'pack' },
    { name: 'Ball Pen (Black) - Pack of 10', categoryId: catMap['Stationery'], price: 6000, stock: 250, sku: 'ST-002', barcode: '8901765117018', unit: 'pack' },
    { name: 'Gel Pen (Blue)', categoryId: catMap['Stationery'], price: 1500, stock: 500, sku: 'ST-003', barcode: '8901765117025', unit: 'piece' },
    { name: 'Pencil HB - Pack of 12', categoryId: catMap['Stationery'], price: 4800, stock: 180, sku: 'ST-004', barcode: '8901765117032', unit: 'pack' },
    { name: 'Eraser (White) - Pack of 5', categoryId: catMap['Stationery'], price: 2500, stock: 400, sku: 'ST-005', barcode: '8901765117049', unit: 'pack' },
    { name: 'Sharpener (Metal)', categoryId: catMap['Stationery'], price: 1000, stock: 350, sku: 'ST-006', barcode: '8901765117056', unit: 'piece' },
    { name: 'Geometry Box', categoryId: catMap['Stationery'], price: 12000, stock: 75, sku: 'ST-007', barcode: '8901765117063', unit: 'piece' },
    { name: 'Ruler 30cm', categoryId: catMap['Stationery'], price: 1500, stock: 200, sku: 'ST-008', barcode: '8901765117070', unit: 'piece' },
    { name: 'Scissors', categoryId: catMap['Stationery'], price: 3500, stock: 90, sku: 'ST-009', barcode: '8901765117087', unit: 'piece' },
    { name: 'Glue Stick', categoryId: catMap['Stationery'], price: 2000, stock: 250, sku: 'ST-010', barcode: '8901765117094', unit: 'piece' },
    { name: 'NCERT Maths Class 10', categoryId: catMap['Books'], price: 18000, stock: 25, sku: 'BK-001', barcode: '9789350000011', unit: 'piece' },
    { name: 'NCERT Science Class 10', categoryId: catMap['Books'], price: 17500, stock: 30, sku: 'BK-002', barcode: '9789350000028', unit: 'piece' },
    { name: 'English Grammar Book', categoryId: catMap['Books'], price: 22000, stock: 20, sku: 'BK-003', barcode: '9789350000035', unit: 'piece' },
    { name: 'Hindi Textbook Class 8', categoryId: catMap['Books'], price: 15000, stock: 18, sku: 'BK-004', barcode: '9789350000042', unit: 'piece' },
    { name: 'Computer Science Class 12', categoryId: catMap['Books'], price: 25000, stock: 15, sku: 'BK-005', barcode: '9789350000059', unit: 'piece' },
    { name: 'Watercolor Set (12 shades)', categoryId: catMap['Art Supplies'], price: 9500, stock: 40, sku: 'ART-001', barcode: '8904100550010', unit: 'set' },
    { name: 'Crayon Box (24 colors)', categoryId: catMap['Art Supplies'], price: 7500, stock: 55, sku: 'ART-002', barcode: '8904100550027', unit: 'box' },
    { name: 'Sketch Pen Set (12)', categoryId: catMap['Art Supplies'], price: 6500, stock: 70, sku: 'ART-003', barcode: '8904100550034', unit: 'set' },
    { name: 'A4 Printing Paper (500 sheets)', categoryId: catMap['Office'], price: 35000, stock: 100, sku: 'OF-001', barcode: '8901234590017', unit: 'piece' },
    { name: 'Stapler with Pins', categoryId: catMap['Office'], price: 8500, stock: 60, sku: 'OF-002', barcode: '8901234590024', unit: 'piece' },
    { name: 'File Folder (Pack of 10)', categoryId: catMap['Office'], price: 12000, stock: 80, sku: 'OF-003', barcode: '8901234590031', unit: 'pack' },
    { name: 'Tape Roll (Transparent)', categoryId: catMap['Office'], price: 2500, stock: 150, sku: 'OF-004', barcode: '8901234590048', unit: 'piece' },
    { name: 'Marker Pen (Black)', categoryId: catMap['Stationery'], price: 3000, stock: 120, sku: 'ST-011', barcode: '8901765117100', unit: 'piece' },
  ];

  const products = await db.insert(schema.products).values(productData).returning();
  console.log(`Created ${products.length} products`);

  const prodMap: Record<string, typeof products[0]> = {};
  for (const p of products) {
    prodMap[p.name] = p;
  }

  // 4. Customers
  const customerData = [
    { name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@email.com' },
    { name: 'Priya Sharma', phone: '9876543211', email: 'priya@email.com' },
    { name: 'Amit Verma', phone: '9988776655' },
    { name: 'Sneha Patel', phone: '9876543213', email: 'sneha@email.com' },
    { name: 'Office Mart', phone: '9876543214', email: 'officemart@email.com' },
    { name: 'Deepak Singh', phone: '9876543215' },
    { name: 'Meena Devi', phone: '9876543216', isActive: false },
    { name: 'Suresh Yadav', phone: '9876543217', isActive: false },
  ];

  const customers = await db.insert(schema.customers).values(customerData).returning();
  console.log(`Created ${customers.length} customers`);

  const custMap: Record<string, string> = {};
  for (const c of customers) {
    custMap[c.name] = c.id;
  }

  // 5. Sales with items
  const salesData = [
    {
      transactionId: 'TXN-20260322-0001',
      customerId: custMap['Rajesh Kumar'],
      paymentMethod: 'Cash',
      discount: 0,
      items: [
        { name: 'Notebook - 200 Pages', qty: 5 },
        { name: 'Ball Pen (Blue) - Pack of 10', qty: 2 },
        { name: 'Pencil HB - Pack of 12', qty: 1 },
      ],
    },
    {
      transactionId: 'TXN-20260322-0002',
      customerId: custMap['Priya Sharma'],
      paymentMethod: 'UPI',
      discount: 500,
      items: [
        { name: 'NCERT Maths Class 10', qty: 1 },
        { name: 'NCERT Science Class 10', qty: 1 },
        { name: 'Notebook - 200 Pages', qty: 10 },
      ],
    },
    {
      transactionId: 'TXN-20260322-0003',
      paymentMethod: 'JazzCash',
      discount: 0,
      items: [
        { name: 'A4 Printing Paper (500 sheets)', qty: 2 },
        { name: 'Stapler with Pins', qty: 1 },
      ],
    },
    {
      transactionId: 'TXN-20260322-0004',
      customerId: custMap['Amit Verma'],
      paymentMethod: 'Cash',
      discount: 1000,
      items: [
        { name: 'Geometry Box', qty: 3 },
        { name: 'Drawing Book A4', qty: 3 },
        { name: 'Watercolor Set (12 shades)', qty: 3 },
      ],
    },
    {
      transactionId: 'TXN-20260321-0005',
      customerId: custMap['Sneha Patel'],
      paymentMethod: 'UPI',
      discount: 0,
      items: [
        { name: 'English Grammar Book', qty: 1 },
        { name: 'Gel Pen (Blue)', qty: 5 },
      ],
    },
    {
      transactionId: 'TXN-20260321-0006',
      paymentMethod: 'Cash',
      discount: 0,
      items: [
        { name: 'Crayon Box (24 colors)', qty: 2 },
        { name: 'Sketch Pen Set (12)', qty: 2 },
      ],
    },
    {
      transactionId: 'TXN-20260321-0007',
      customerId: custMap['Office Mart'],
      paymentMethod: 'JazzCash',
      discount: 5000,
      items: [
        { name: 'File Folder (Pack of 10)', qty: 5 },
        { name: 'Tape Roll (Transparent)', qty: 10 },
      ],
    },
    {
      transactionId: 'TXN-20260320-0008',
      customerId: custMap['Deepak Singh'],
      paymentMethod: 'UPI',
      discount: 0,
      items: [
        { name: 'Computer Science Class 12', qty: 1 },
        { name: 'Notebook - 100 Pages', qty: 5 },
      ],
    },
  ];

  for (const sale of salesData) {
    const items = sale.items.map(i => {
      const prod = prodMap[i.name];
      return {
        productId: prod.id,
        quantity: i.qty,
        unitPrice: prod.price,
        total: prod.price * i.qty,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const total = subtotal - sale.discount;

    const [saleRecord] = await db.insert(schema.sales).values({
      transactionId: sale.transactionId,
      customerId: sale.customerId,
      userId: admin.id,
      subtotal,
      discount: sale.discount,
      total,
      paymentMethod: sale.paymentMethod,
    }).returning();

    await db.insert(schema.saleItems).values(
      items.map(i => ({ ...i, saleId: saleRecord.id }))
    );
  }
  console.log(`Created ${salesData.length} sales with items`);

  console.log('\nSeed complete!');
  console.log('Login: admin@shoppos.local / changeme123');

  await pool.end();
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
