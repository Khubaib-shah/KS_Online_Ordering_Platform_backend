import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const branch = await prisma.branch.findFirst();
  if (!branch) {
    console.log('No branches found in DB');
    return;
  }
  
  const envPath = 'd:\\Programing work\\Products\\indolj\\printer-service\\.env';
  
  console.log(`Found Tenant ID: ${branch.tenantId}`);
  console.log(`Found Branch ID: ${branch.id}`);
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent += `\nTENANT_ID=${branch.tenantId}\nBRANCH_ID=${branch.id}\n`;
  fs.writeFileSync(envPath, envContent);
  console.log('Appended to printer-service .env!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
