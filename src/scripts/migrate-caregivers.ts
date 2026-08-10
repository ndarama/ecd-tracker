import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Starting caregiver migration...");

  const children = await prisma.child.findMany({
    select: {
      id: true,
      village: true,
      caregiverId: true,
      householdId: true,
    },
  });

  const phoneMap = new Map<string, string>(); // phone -> caregiverId
  const nameVillageMap = new Map<string, string>(); // name|village -> caregiverId

  for (const c of children) {
    if (c.caregiverId && c.householdId) continue;

    const name = "Unknown";
    const phone = null;
    const village = c.village;

    let caregiverId: string | undefined;

    if (phone) {
      if (phoneMap.has(phone)) {
        caregiverId = phoneMap.get(phone) as string;
      } else {
        // try to find existing by phone
        const created = await prisma.caregiver.create({ data: { name, phone } });
        caregiverId = created.id;
        phoneMap.set(phone, caregiverId);
      }
    } else if (name) {
      const key = `${name.toLowerCase()}|${village.toLowerCase()}`;
      if (nameVillageMap.has(key)) {
        caregiverId = nameVillageMap.get(key) as string;
      } else {
        const created = await prisma.caregiver.create({ data: { name, phone: null } });
        caregiverId = created.id;
        nameVillageMap.set(key, caregiverId);
      }
    } else {
      // No caregiver info; create a placeholder caregiver
      const created = await prisma.caregiver.create({ data: { name: "Unknown", phone: null } });
      caregiverId = created.id;
    }

    if (caregiverId) {
      const household = await prisma.household.create({
        data: { address: "Not provided", village },
      });
      await prisma.caregiver.update({ where: { id: caregiverId }, data: { householdId: household.id } });
      await prisma.child.update({ where: { id: c.id }, data: { caregiverId, householdId: household.id } });
      console.log(`Linked child ${c.id} -> caregiver ${caregiverId}`);
    }
  }

  console.log("Caregiver migration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
