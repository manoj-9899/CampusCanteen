import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
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

  await prisma.user.create({
    data: {
      email: "staff@canteen.edu",
      password: staffPassword,
      name: "Priya Patel",
      role: "STAFF",
    },
  });

  const menuItems = await Promise.all([
    prisma.menuItem.create({
      data: {
        name: "Samosa",
        description: "Crispy pastry with spiced potato filling (2 pcs)",
        price: 20,
        category: "Snacks",
        stockQuantity: 25,
        lowStockThreshold: 5,
        imageEmoji: "🥟",
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Vada Pav",
        description: "Mumbai-style vada in a soft pav with chutney",
        price: 25,
        category: "Snacks",
        stockQuantity: 30,
        lowStockThreshold: 5,
        imageEmoji: "🍔",
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Poha",
        description: "Light flattened rice with peanuts and lemon",
        price: 30,
        category: "Breakfast",
        stockQuantity: 20,
        lowStockThreshold: 5,
        imageEmoji: "🍚",
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Tea",
        description: "Hot masala chai",
        price: 10,
        category: "Beverages",
        stockQuantity: 50,
        lowStockThreshold: 10,
        imageEmoji: "☕",
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Coffee",
        description: "Hot filter coffee",
        price: 15,
        category: "Beverages",
        stockQuantity: 0,
        lowStockThreshold: 5,
        isAvailable: false,
        imageEmoji: "🥤",
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Misal Pav",
        description: "Today's Special — spicy misal with pav",
        price: 60,
        category: "Special",
        stockQuantity: 5,
        lowStockThreshold: 5,
        isDailySpecial: true,
        imageEmoji: "🌶️",
      },
    }),
  ]);

  const now = new Date();
  let orderNumber = 1001;

  for (let dayOffset = 14; dayOffset >= 1; dayOffset--) {
    const orderDate = subDays(now, dayOffset);
    orderDate.setHours(10 + (dayOffset % 6), 30, 0, 0);

    const ordersPerDay = 2 + (dayOffset % 4);
    for (let i = 0; i < ordersPerDay; i++) {
      const item1 = menuItems[dayOffset % menuItems.length];
      const item2 = menuItems[(dayOffset + 2) % menuItems.length];
      const qty1 = 1 + (i % 2);
      const qty2 = 1;
      const total = item1.price * qty1 + item2.price * qty2;
      const seq = orderNumber - 1000;

      await prisma.order.create({
        data: {
          orderNumber: orderNumber++,
          orderCode: `ORD-${now.getFullYear()}-${seq}`,
          tokenNumber: `A${orderNumber - 1}`,
          userId: student.id,
          status: "COMPLETED",
          paymentStatus: "PAID",
          paymentRef: `PAY-HIST-${orderNumber}`,
          paymentMethod: "UPI",
          totalAmount: total,
          createdAt: orderDate,
          collectedAt: orderDate,
          items: {
            create: [
              { menuItemId: item1.id, quantity: qty1, unitPrice: item1.price },
              { menuItemId: item2.id, quantity: qty2, unitPrice: item2.price },
            ],
          },
        },
      });
    }
  }

  console.log("Seed completed.");
  console.log("Student: student@college.edu / student123");
  console.log("Staff:   staff@canteen.edu / staff123");
  console.log("Note: Coffee is out of stock; Misal Pav has only 5 left.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
