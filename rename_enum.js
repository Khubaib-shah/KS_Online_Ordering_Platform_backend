const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Renaming enum value directly in the database...");
    
    // Execute the rename
    await prisma.$executeRawUnsafe(`ALTER TYPE "OrderChannel" RENAME VALUE 'STOREFRONT' TO 'WEBSITE';`);
    
    console.log("Successfully renamed 'STOREFRONT' to 'WEBSITE' in the database!");
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('not find value')) {
        console.log("It might already be renamed or not found. Details:", error.message);
    } else {
        console.error("Error executing raw query:", error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
