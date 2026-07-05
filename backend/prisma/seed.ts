import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

const NEW_MENU: {
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
}[] = [
  { name: 'Phở tô nhỏ', price: 40000, category: 'pho_size' },
  { name: 'Phở tô thường', price: 45000, category: 'pho_size' },
  { name: 'Phở tô lớn (thập cẩm)', price: 50000, category: 'pho_size' },
  { name: 'Tái', price: 20000, category: 'side', imageUrl: '/uploads/menu/tai.jpg' },
  { name: 'Nạm', price: 20000, category: 'side', imageUrl: '/uploads/menu/nam.png' },
  { name: 'Gầu', price: 20000, category: 'side', imageUrl: '/uploads/menu/gau.png' },
  { name: 'Gân', price: 20000, category: 'side', imageUrl: '/uploads/menu/gan.png' },
  { name: 'Bò viên', price: 20000, category: 'side', imageUrl: '/uploads/menu/bo-vien.png' },
  { name: 'Nước tiết', price: 20000, category: 'side', imageUrl: '/uploads/menu/tiet.jpg' },
  { name: 'Trứng chần', price: 7000, category: 'side', imageUrl: '/uploads/menu/trung.jpg' },
  { name: 'Quẩy', price: 8000, category: 'side', imageUrl: '/uploads/menu/quay.png' },
  { name: 'Cà phê sữa', price: 15000, category: 'drink', imageUrl: '/uploads/menu/cf-sua.png' },
  { name: 'Cà phê đá', price: 12000, category: 'drink', imageUrl: '/uploads/menu/cf-da.jpg' },
  { name: 'Sữa tươi cà phê', price: 15000, category: 'drink', imageUrl: '/uploads/menu/sua-tuoi-cf.jpeg' },
  { name: 'Bạc xỉu', price: 15000, category: 'drink', imageUrl: '/uploads/menu/bac-xiu.jpg' },
  { name: 'Nước ngọt', price: 12000, category: 'drink', imageUrl: '/uploads/menu/softdrink.jpg' },
];

const OLD_MENU_NAMES = [
  'Phở chín',
  'Phở tái',
  'Phở tái lăn',
  'Phở bò viên',
  'Trà đá',
];

/** Nguyên liệu mẫu seed cũ — xóa khi chạy seed để trang Kho trống */
const LEGACY_SAMPLE_INGREDIENTS = [
  'Bánh phở',
  'Thịt bò',
  'Xương bò',
  'Gia vị phở',
  'Hành lá',
];

const INVENTORY_CATALOG: {
  category: string;
  name: string;
  unit: string;
}[] = [
  { category: 'Thịt', name: 'Xương', unit: 'kg' },
  { category: 'Thịt', name: 'Tái', unit: 'kg' },
  { category: 'Thịt', name: 'Nạm', unit: 'kg' },
  { category: 'Thịt', name: 'Gầu', unit: 'kg' },
  { category: 'Thịt', name: 'Gân', unit: 'kg' },
  { category: 'Thịt', name: 'Bò viên', unit: 'kg' },
  { category: 'Rau', name: 'Hành lá', unit: 'kg' },
  { category: 'Rau', name: 'Hành tây', unit: 'kg' },
  { category: 'Rau', name: 'Sả', unit: 'kg' },
  { category: 'Rau', name: 'Táo tàu', unit: 'kg' },
  { category: 'Rau', name: 'Gừng', unit: 'kg' },
  { category: 'Rau', name: 'Giá', unit: 'kg' },
  { category: 'Rau', name: 'Quế', unit: 'kg' },
  { category: 'Rau', name: 'Húng cay', unit: 'kg' },
  { category: 'Rau', name: 'Ngò gai', unit: 'kg' },
  { category: 'Rau', name: 'Om', unit: 'kg' },
  { category: 'Rau', name: 'Ớt', unit: 'kg' },
  { category: 'Rau', name: 'Chanh', unit: 'kg' },
  { category: 'Tương', name: 'Tương bắc (chai)', unit: 'chai' },
  { category: 'Tương', name: 'Tương đỏ', unit: 'chai' },
  { category: 'Tương', name: 'Tương đen', unit: 'chai' },
  { category: 'Tương', name: 'Sa tế', unit: 'hũ' },
  { category: 'Gia vị', name: 'Tiêu', unit: 'kg' },
  { category: 'Gia vị', name: 'Bột quế', unit: 'kg' },
  { category: 'Gia vị', name: 'Súp phở', unit: 'gói' },
  { category: 'Gia vị', name: 'Bột ngọt', unit: 'kg' },
  { category: 'Gia vị', name: 'Đường phèn', unit: 'kg' },
  { category: 'Gia vị', name: 'Muối', unit: 'kg' },
  { category: 'Gia vị', name: 'Nước mắm (thùng)', unit: 'thùng' },
  { category: 'Đồ nhựa', name: 'Hộp (cái)', unit: 'cái' },
  { category: 'Đồ nhựa', name: 'Găng tay (bao)', unit: 'bao' },
  { category: 'Đồ nhựa', name: 'Ống hút', unit: 'bịch' },
  { category: 'Đồ nhựa', name: 'Ly (cái)', unit: 'cái' },
  { category: 'Đồ nhựa', name: 'Bao 1kg', unit: 'cuộn' },
  { category: 'Đồ nhựa', name: 'Bao 2kg', unit: 'cuộn' },
  { category: 'Đồ nhựa', name: 'Bao nước lèo', unit: 'bịch' },
  { category: 'Đồ nhựa', name: 'Bao ly', unit: 'bịch' },
  { category: 'Đồ nhựa', name: 'Muỗng (cái)', unit: 'cái' },
  { category: 'Đồ nhựa', name: 'Đũa (cái)', unit: 'cái' },
  { category: 'Nước', name: 'Cà phê', unit: 'kg' },
  { category: 'Nước', name: 'Trà (bịch)', unit: 'bịch' },
  { category: 'Nước', name: 'Sữa đặc (hộp)', unit: 'hộp' },
  { category: 'Nước', name: 'Đường cát', unit: 'kg' },
  { category: 'Nước', name: 'Nước ngọt (chai)', unit: 'chai' },
  { category: 'Nước', name: 'Nước suối (chai)', unit: 'chai' },
];

async function clearLegacyInventorySamples() {
  for (const name of LEGACY_SAMPLE_INGREDIENTS) {
    const ingredient = await prisma.ingredient.findFirst({ where: { name } });
    if (!ingredient) continue;
    await prisma.inventoryReceipt.deleteMany({ where: { ingredientId: ingredient.id } });
    await prisma.ingredient.delete({ where: { id: ingredient.id } });
  }
}

async function upsertInventoryCatalog() {
  for (const item of INVENTORY_CATALOG) {
    const existing = await prisma.ingredient.findFirst({ where: { name: item.name } });
    if (existing) {
      await prisma.ingredient.update({
        where: { id: existing.id },
        data: {
          category: item.category,
          unit: item.unit,
        },
      });
    } else {
      await prisma.ingredient.create({
        data: {
          category: item.category,
          name: item.name,
          unit: item.unit,
          minStock: 0,
        },
      });
    }
  }
}

async function main() {
  console.log('🌱 Đang seed dữ liệu mẫu...');

  await prisma.taxConfig.upsert({
    where: { id: 'default-tax' },
    update: {},
    create: {
      id: 'default-tax',
      name: 'VAT',
      rate: 8,
      isFlat: false,
      isActive: true,
    },
  });

  await prisma.paymentConfig.upsert({
    where: { id: 'default-payment' },
    update: {
      shopName: 'RUỘNG',
      shopAddress: '116/2 Thành Thái, P.12, Q.10, TP. Hồ Chí Minh',
      shopPhone: null,
      logoUrl: '/uploads/logo/logo.jpg',
      transferQrUrl: '/uploads/payment/qr-transfer.png',
    },
    create: {
      id: 'default-payment',
      shopName: 'RUỘNG',
      shopAddress: '116/2 Thành Thái, P.12, Q.10, TP. Hồ Chí Minh',
      shopPhone: null,
      logoUrl: '/uploads/logo/logo.jpg',
      transferQrUrl: '/uploads/payment/qr-transfer.png',
    },
  });

  for (const oldName of OLD_MENU_NAMES) {
    await prisma.menuItem.updateMany({
      where: { name: oldName },
      data: { isActive: false },
    });
  }

  for (const item of NEW_MENU) {
    const existing = await prisma.menuItem.findFirst({ where: { name: item.name } });
    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: { ...item, isActive: true },
      });
    } else {
      await prisma.menuItem.create({ data: { ...item, isActive: true } });
    }
  }

  await clearLegacyInventorySamples();
  await upsertInventoryCatalog();

  const adminPhone = process.env.SEED_ADMIN_PHONE || '0900000000';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const passwordHash = await hashPassword(adminPassword);
  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      passwordHash,
      displayName: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      phone: adminPhone,
      passwordHash,
      displayName: 'Admin',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin seed: ${adminPhone} / ${adminPassword}`);

  console.log('✅ Seed hoàn tất!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
