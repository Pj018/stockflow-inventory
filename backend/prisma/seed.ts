import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo database...');

  // Clean existing demo data if any
  const existingUser = await prisma.user.findUnique({
    where: { email: 'demo@stockflow.com' },
  });

  if (existingUser) {
    console.log('Demo user already exists. Skipping duplicate seeding.');
    return;
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  const org = await prisma.organization.create({
    data: {
      name: 'Acme Supply Co.',
      defaultLowStockThreshold: 8,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'demo@stockflow.com',
      password: hashedPassword,
      organizationId: org.id,
    },
  });

  const demoProducts = [
    {
      name: 'Wireless Ergonomic Mouse',
      sku: 'TECH-MSE-01',
      description: '2.4GHz optical mouse with dual thumb buttons',
      quantity: 45,
      costPrice: 14.5,
      sellingPrice: 29.99,
      lowStockThreshold: 10,
    },
    {
      name: 'Mechanical Gaming Keyboard',
      sku: 'TECH-KBD-02',
      description: 'Hot-swappable RGB mechanical keyboard with brown switches',
      quantity: 4,
      costPrice: 42.0,
      sellingPrice: 79.99,
      lowStockThreshold: 8, // Low stock!
    },
    {
      name: 'USB-C Dual Hub Adapter',
      sku: 'TECH-HUB-03',
      description: '7-in-1 multi-port adapter with HDMI 4K and 100W PD',
      quantity: 2,
      costPrice: 11.2,
      sellingPrice: 24.5,
      lowStockThreshold: 5, // Low stock!
    },
    {
      name: '27-inch 4K IPS Monitor',
      sku: 'TECH-MON-04',
      description: 'Color-accurate IPS display with USB-C video input',
      quantity: 18,
      costPrice: 180.0,
      sellingPrice: 299.99,
      lowStockThreshold: 5,
    },
    {
      name: 'Noise Cancelling Headphones',
      sku: 'AUD-NCH-05',
      description: 'Over-ear Bluetooth headphones with active noise cancellation',
      quantity: 0,
      costPrice: 65.0,
      sellingPrice: 129.99,
      lowStockThreshold: 5, // Out of stock!
    },
    {
      name: 'Braided Nylon USB-C Cable (2m)',
      sku: 'CAB-USBC-06',
      description: 'Fast-charging reinforced cable with aluminum connectors',
      quantity: 120,
      costPrice: 1.5,
      sellingPrice: 8.99,
      lowStockThreshold: 20,
    },
  ];

  for (const prod of demoProducts) {
    const product = await prisma.product.create({
      data: {
        organizationId: org.id,
        name: prod.name,
        sku: prod.sku,
        description: prod.description,
        quantity: prod.quantity,
        costPrice: prod.costPrice,
        sellingPrice: prod.sellingPrice,
        lowStockThreshold: prod.lowStockThreshold,
        lastUpdatedBy: user.email,
      },
    });

    if (product.quantity > 0) {
      await prisma.stockLog.create({
        data: {
          organizationId: org.id,
          productId: product.id,
          changeAmount: product.quantity,
          previousQty: 0,
          newQty: product.quantity,
          note: 'Initial demo inventory load',
          updatedBy: user.email,
        },
      });
    }
  }

  console.log('✅ Demo data seeded successfully:');
  console.log('   Email: demo@stockflow.com');
  console.log('   Password: password123');
  console.log('   Organization: Acme Supply Co.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
