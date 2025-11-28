import { db } from "../server/db";
import { adminUsers } from "../shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  const username = "admin";
  const password = "golfsim2024";
  
  try {
    const existingAdmin = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    
    if (existingAdmin.length > 0) {
      console.log("Admin user already exists. Skipping seed.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    await db.insert(adminUsers).values({
      username,
      passwordHash,
      role: "admin",
    });

    console.log("Admin user created successfully!");
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log("\nPlease change the password after first login.");
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

seedAdmin();
