import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const staff = await prisma.staffProfile.findMany({ include: { user: true, role: true } });
  console.dir(staff, { depth: null });
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
