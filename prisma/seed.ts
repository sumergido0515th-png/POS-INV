import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding JP Laagan MotoPOS database...");

  const [adminHash, cashierHash] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("cashier123", 10),
  ]);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Juan Paulo Laagan",
      username: "admin",
      email: "admin@jplaagan.local",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { username: "cashier" },
    update: {},
    create: {
      name: "Maria Santos",
      username: "cashier",
      email: "cashier@jplaagan.local",
      passwordHash: cashierHash,
      role: "CASHIER",
    },
  });

  await prisma.settings.deleteMany();
  await prisma.settings.create({
    data: {
      businessName: "JP Laagan MotoPOS",
      address: "Poblacion, Laguna, Philippines",
      phone: "0917-000-0000",
      email: "contact@jplaagan.local",
      taxRate: 12,
      currency: "PHP",
      receiptFooter: "Thank you for riding with us! No return, no exchange without receipt.",
      lowStockThreshold: 5,
    },
  });

  const categoryNames = [
    ["Engine Parts", "Pistons, gaskets, valves, engine internals"],
    ["Brake System", "Brake pads, discs, calipers, brake fluid"],
    ["Electrical", "Batteries, spark plugs, bulbs, wiring, CDI"],
    ["Tires & Wheels", "Tires, tubes, rims, sprockets"],
    ["Body & Frame", "Fairings, mirrors, seats, handlebars"],
    ["Oil & Fluids", "Engine oil, coolant, chain lube"],
    ["Transmission", "Chains, sprockets, clutch parts"],
    ["Suspension", "Shock absorbers, forks, bushings"],
    ["Filters", "Air filters, oil filters, fuel filters"],
    ["Accessories", "Helmets, gloves, phone mounts, alarms"],
  ] as const;

  const categories: Record<string, string> = {};
  for (const [name, description] of categoryNames) {
    const c = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, description },
    });
    categories[name] = c.id;
  }

  const brandNames = ["Honda", "Yamaha", "Suzuki", "Kawasaki", "NGK", "Motul", "Yuasa", "Universal"];
  const brands: Record<string, string> = {};
  for (const name of brandNames) {
    const b = await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    brands[name] = b.id;
  }

  const supplierData = [
    { name: "MotoParts Trading Corp.", contactPerson: "Ramon Cruz", phone: "0918-111-2222", email: "sales@motopartstrading.ph", address: "Cavite, Philippines" },
    { name: "Laguna Cycle Supply", contactPerson: "Ellen Reyes", phone: "0919-333-4444", email: "orders@lagunacycle.ph", address: "Sta. Rosa, Laguna" },
  ];
  const suppliers: Record<string, string> = {};
  for (const s of supplierData) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    const sup = existing ?? (await prisma.supplier.create({ data: s }));
    suppliers[s.name] = sup.id;
  }

  const products = [
    { sku: "ENG-PST-001", name: "Piston Kit STD 125cc", category: "Engine Parts", brand: "Honda", cost: 320, price: 480, qty: 18, reorder: 5, unit: "set" },
    { sku: "ENG-GSK-002", name: "Cylinder Head Gasket Set", category: "Engine Parts", brand: "Honda", cost: 85, price: 150, qty: 25, reorder: 8, unit: "set" },
    { sku: "ENG-VLV-003", name: "Intake Valve Assembly", category: "Engine Parts", brand: "Yamaha", cost: 210, price: 350, qty: 12, reorder: 4, unit: "pc" },
    { sku: "BRK-PAD-004", name: "Front Brake Pad Set", category: "Brake System", brand: "Yamaha", cost: 95, price: 175, qty: 40, reorder: 10, unit: "set" },
    { sku: "BRK-DSC-005", name: "Brake Disc Rotor 220mm", category: "Brake System", brand: "Universal", cost: 380, price: 620, qty: 10, reorder: 3, unit: "pc" },
    { sku: "BRK-FLD-006", name: "DOT 4 Brake Fluid 500ml", category: "Brake System", brand: "Motul", cost: 120, price: 220, qty: 30, reorder: 8, unit: "bottle" },
    { sku: "BRK-CLP-007", name: "Rear Brake Caliper", category: "Brake System", brand: "Suzuki", cost: 650, price: 980, qty: 6, reorder: 2, unit: "pc" },
    { sku: "ELE-BAT-008", name: "YTZ7S Maintenance-Free Battery", category: "Electrical", brand: "Yuasa", cost: 1450, price: 2100, qty: 14, reorder: 4, unit: "pc" },
    { sku: "ELE-SPK-009", name: "NGK Spark Plug CPR8EA-9", category: "Electrical", brand: "NGK", cost: 90, price: 160, qty: 60, reorder: 15, unit: "pc" },
    { sku: "ELE-CDI-010", name: "CDI Unit Racing", category: "Electrical", brand: "Universal", cost: 480, price: 780, qty: 9, reorder: 3, unit: "pc" },
    { sku: "ELE-BLB-011", name: "LED Headlight Bulb H4", category: "Electrical", brand: "Universal", cost: 150, price: 280, qty: 35, reorder: 10, unit: "pc" },
    { sku: "TIR-TIR-012", name: "Tubeless Tire 80/90-17", category: "Tires & Wheels", brand: "Honda", cost: 950, price: 1450, qty: 20, reorder: 6, unit: "pc" },
    { sku: "TIR-TIR-013", name: "Tubeless Tire 100/90-17", category: "Tires & Wheels", brand: "Yamaha", cost: 1050, price: 1600, qty: 16, reorder: 6, unit: "pc" },
    { sku: "TIR-TUB-014", name: "Inner Tube 17-inch", category: "Tires & Wheels", brand: "Universal", cost: 65, price: 130, qty: 45, reorder: 12, unit: "pc" },
    { sku: "TIR-SPR-015", name: "Rear Sprocket 428-42T", category: "Tires & Wheels", brand: "Suzuki", cost: 280, price: 450, qty: 22, reorder: 6, unit: "pc" },
    { sku: "BDY-MIR-016", name: "Side Mirror Set (L/R)", category: "Body & Frame", brand: "Universal", cost: 140, price: 260, qty: 28, reorder: 8, unit: "set" },
    { sku: "BDY-SET-017", name: "Motorcycle Seat Cover", category: "Body & Frame", brand: "Universal", cost: 220, price: 380, qty: 15, reorder: 5, unit: "pc" },
    { sku: "BDY-HDL-018", name: "Handlebar Grip Set", category: "Body & Frame", brand: "Kawasaki", cost: 75, price: 140, qty: 33, reorder: 10, unit: "set" },
    { sku: "OIL-ENG-019", name: "Motul 3000 4T 20W-50 1L", category: "Oil & Fluids", brand: "Motul", cost: 210, price: 340, qty: 55, reorder: 15, unit: "bottle" },
    { sku: "OIL-CHN-020", name: "Chain Lube Spray 400ml", category: "Oil & Fluids", brand: "Motul", cost: 180, price: 300, qty: 26, reorder: 8, unit: "can" },
    { sku: "OIL-CLT-021", name: "Radiator Coolant 1L", category: "Oil & Fluids", brand: "Universal", cost: 110, price: 190, qty: 20, reorder: 6, unit: "bottle" },
    { sku: "TRN-CHN-022", name: "Drive Chain 428H-124L", category: "Transmission", brand: "Honda", cost: 480, price: 750, qty: 17, reorder: 5, unit: "pc" },
    { sku: "TRN-CLT-023", name: "Clutch Plate Set", category: "Transmission", brand: "Yamaha", cost: 320, price: 520, qty: 13, reorder: 4, unit: "set" },
    { sku: "TRN-CBL-024", name: "Clutch Cable", category: "Transmission", brand: "Suzuki", cost: 65, price: 120, qty: 38, reorder: 10, unit: "pc" },
    { sku: "SUS-SHK-025", name: "Rear Shock Absorber (Pair)", category: "Suspension", brand: "Kawasaki", cost: 890, price: 1350, qty: 8, reorder: 3, unit: "pair" },
    { sku: "SUS-FRK-026", name: "Front Fork Oil Seal Set", category: "Suspension", brand: "Universal", cost: 95, price: 175, qty: 24, reorder: 8, unit: "set" },
    { sku: "FIL-AIR-027", name: "Air Filter Element", category: "Filters", brand: "Honda", cost: 85, price: 150, qty: 42, reorder: 12, unit: "pc" },
    { sku: "FIL-OIL-028", name: "Oil Filter Cartridge", category: "Filters", brand: "Yamaha", cost: 70, price: 130, qty: 3, reorder: 12, unit: "pc" },
    { sku: "FIL-FUL-029", name: "Fuel Filter Inline", category: "Filters", brand: "Universal", cost: 45, price: 90, qty: 2, reorder: 10, unit: "pc" },
    { sku: "ACC-HLM-030", name: "Full-Face Helmet (ICC Approved)", category: "Accessories", brand: "Universal", cost: 950, price: 1650, qty: 12, reorder: 4, unit: "pc" },
    { sku: "ACC-GLV-031", name: "Riding Gloves", category: "Accessories", brand: "Universal", cost: 180, price: 320, qty: 4, reorder: 8, unit: "pair" },
    { sku: "ACC-ALM-032", name: "Motorcycle Disc Alarm Lock", category: "Accessories", brand: "Universal", cost: 260, price: 450, qty: 19, reorder: 6, unit: "pc" },
  ];

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (existing) continue;

    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        costPrice: p.cost,
        sellingPrice: p.price,
        quantity: p.qty,
        reorderLevel: p.reorder,
        categoryId: categories[p.category],
        brandId: brands[p.brand],
        supplierId: suppliers["MotoParts Trading Corp."],
        isActive: true,
      },
    });

    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: "RECEIVE",
        quantity: p.qty,
        reason: "Initial stock (seed)",
        userId: admin.id,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Login — Owner/Admin: admin / admin123");
  console.log("Login — Cashier:     cashier / cashier123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
