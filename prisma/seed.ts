import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@ems.local";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log("Admin user already exists, skipping seed.");
    return;
  }

  const passwordHash = await bcrypt.hash("Admin@12345", 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      employee: {
        create: {
          employeeCode: "EMP-00001",
          firstName: "System",
          lastName: "Administrator",
          email: adminEmail,
          department: "Administration",
          designation: "Administrator",
          dateOfJoining: new Date(),
          status: "ACTIVE",
        },
      },
    },
  });

  console.log("Seeded admin user:");
  console.log("  email:    admin@ems.local");
  console.log("  password: Admin@12345");
  console.log("Change this password after first login.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
