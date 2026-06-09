import { execSync } from "child_process";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const TEST_DB_URL = "file:./prisma/test.db";

let dbReady = false;

export function getTestDbUrl() {
  return TEST_DB_URL;
}

export async function ensureTestDatabase() {
  if (dbReady) return;
  process.env.DATABASE_URL = TEST_DB_URL;

  const root = path.resolve(__dirname, "../..");

  try {
    // Fast path: prepare-test-prisma.mjs already ran (npm test)
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    dbReady = true;
    return;
  } catch {
    // Fallback: push + generate using SQLite test schema
    execSync("node scripts/prepare-test-prisma.mjs", {
      cwd: root,
      stdio: "pipe",
    });
    dbReady = true;
  }
}

export async function getPrisma() {
  await ensureTestDatabase();
  process.env.DATABASE_URL = TEST_DB_URL;
  return new PrismaClient();
}

export interface TestSeed {
  student: { id: string; email: string };
  staff: { id: string; email: string };
  menuItems: {
    samosa: { id: string; price: number; stockQuantity: number };
    tea: { id: string; price: number; stockQuantity: number };
    coffee: { id: string; price: number };
  };
}

/** Deterministic minimal seed aligned with prisma/seed.ts credentials. */
export async function seedTestDatabase(): Promise<TestSeed> {
  const prisma = await getPrisma();

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.user.deleteMany();

  const studentPassword = await bcrypt.hash("student123", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);

  const student = await prisma.user.create({
    data: {
      email: "student@college.edu",
      password: studentPassword,
      name: "Rahul Sharma",
      studentId: "CS2024001",
      role: "STUDENT",
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: "staff@canteen.edu",
      password: staffPassword,
      name: "Priya Patel",
      role: "STAFF",
    },
  });

  const samosa = await prisma.menuItem.create({
    data: {
      name: "Samosa",
      description: "Crispy pastry",
      price: 20,
      category: "Snacks",
      stockQuantity: 25,
      lowStockThreshold: 5,
      imageEmoji: "🥟",
    },
  });

  const tea = await prisma.menuItem.create({
    data: {
      name: "Tea",
      description: "Hot masala chai",
      price: 10,
      category: "Beverages",
      stockQuantity: 50,
      lowStockThreshold: 10,
      imageEmoji: "☕",
    },
  });

  const coffee = await prisma.menuItem.create({
    data: {
      name: "Coffee",
      description: "Out of stock item",
      price: 15,
      category: "Beverages",
      stockQuantity: 0,
      lowStockThreshold: 5,
      isAvailable: false,
      imageEmoji: "🥤",
    },
  });

  await prisma.$disconnect();

  return {
    student: { id: student.id, email: student.email },
    staff: { id: staff.id, email: staff.email },
    menuItems: {
      samosa: {
        id: samosa.id,
        price: samosa.price,
        stockQuantity: samosa.stockQuantity,
      },
      tea: { id: tea.id, price: tea.price, stockQuantity: tea.stockQuantity },
      coffee: { id: coffee.id, price: coffee.price },
    },
  };
}

/** Paid orders created today for dashboard assertions. */
export async function seedTodayAnalyticsOrders(
  studentId: string,
  samosaId: string,
  teaId: string
) {
  const prisma = await getPrisma();
  const now = new Date();

  await prisma.order.create({
    data: {
      orderNumber: 2001,
      orderCode: `ORD-${now.getFullYear()}-2001`,
      tokenNumber: "A2001",
      userId: studentId,
      status: "COMPLETED",
      paymentStatus: "PAID",
      paymentRef: "PAY-TEST-1",
      paymentMethod: "UPI",
      totalAmount: 50,
      createdAt: now,
      collectedAt: now,
      items: {
        create: [
          { menuItemId: samosaId, quantity: 2, unitPrice: 20 },
          { menuItemId: teaId, quantity: 1, unitPrice: 10 },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderNumber: 2002,
      orderCode: `ORD-${now.getFullYear()}-2002`,
      tokenNumber: "A2002",
      userId: studentId,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paymentRef: "PAY-TEST-2",
      paymentMethod: "UPI",
      totalAmount: 30,
      createdAt: now,
      items: {
        create: [{ menuItemId: samosaId, quantity: 1, unitPrice: 20 }],
      },
    },
  });

  await prisma.$disconnect();
}
