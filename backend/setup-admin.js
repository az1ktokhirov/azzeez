const prisma = require("./src/db");
const bcrypt = require("bcryptjs");

(async () => {
  try {
    // Check existing super admin
    const existing = await prisma.superAdmin.findUnique({
      where: { email: "admin@groceryos.com" },
    });

    if (existing) {
      console.log("Super Admin already exists, updating password...");
      // Update with new bcryptjs hash
      const newPassword = await bcrypt.hash("admin123", 12);
      await prisma.superAdmin.update({
        where: { email: "admin@groceryos.com" },
        data: { password: newPassword, isActive: true },
      });
      console.log("✅ Super Admin password updated successfully!");
    } else {
      console.log("Creating new Super Admin...");
      const password = await bcrypt.hash("admin123", 12);
      await prisma.superAdmin.create({
        data: {
          fullName: "Super Admin",
          email: "admin@groceryos.com",
          password: password,
          isActive: true,
        },
      });
      console.log("✅ Super Admin created successfully!");
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
})();
