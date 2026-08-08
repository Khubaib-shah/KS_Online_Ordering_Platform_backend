import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const u = await prisma.user.findUnique({
    where: { email: "aliazharirfan18@gmail.com" },
    include: { staffProfile: { include: { role: true } } }
  });
  console.dir(u, { depth: null });
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
