import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Starting caregiver migration...");

  const children = await prisma.child.findMany({
    select: {
      id: true,
      caregiverName: true,
      caregiverPhone: true,
      village: true,
      caregiverId: true,
    },
  });

  const phoneMap = new Map<string, string>(); // phone -> caregiverId
  const nameVillageMap = new Map<string, string>(); // name|village -> caregiverId

  for (const c of children) {
    if (c.caregiverId) continue; // already linked

    const name = c.caregiverName?.trim();
    const phone = c.caregiverPhone?.trim() || null;
    const village = c.village || undefined;

    let caregiverId: string | undefined;

    if (phone) {
      if (phoneMap.has(phone)) {
        caregiverId = phoneMap.get(phone) as string;
      } else {
        // try to find existing by phone
        const existing = await prisma.caregiver.findUnique({ where: { phone } });
        if (existing) {
          caregiverId = existing.id;
        } else {
          const created = await prisma.caregiver.create({
            data: { name: name || "", phone, village },
          });
          caregiverId = created.id;
        }
        phoneMap.set(phone, caregiverId);
      }
    } else if (name) {
      const key = `${name.toLowerCase()}|${(village || "").toLowerCase()}`;
      if (nameVillageMap.has(key)) {
        caregiverId = nameVillageMap.get(key) as string;
      } else {
        const created = await prisma.caregiver.create({ data: { name, phone: null, village } });
        caregiverId = created.id;
        nameVillageMap.set(key, caregiverId);
      }
    } else {
      // No caregiver info; create a placeholder caregiver
      const created = await prisma.caregiver.create({ data: { name: "Unknown", phone: null, village } });
      caregiverId = created.id;
    }

    if (caregiverId) {
      await prisma.child.update({ where: { id: c.id }, data: { caregiverId } });
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
