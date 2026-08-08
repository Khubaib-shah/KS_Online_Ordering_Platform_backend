import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const roles = await prisma.role.findMany();
  console.dir(roles, { depth: null });
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
