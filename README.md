# 🍜 Pho Restaurant - Ứng dụng Quản lý Bán hàng Quán Phở

Hệ thống quản lý toàn diện cho quán phở: POS bán hàng, kho nguyên liệu, chấm công nhân viên và báo cáo doanh thu/thuế.

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React Native, Expo, TypeScript, Zustand, Expo Router |
| Backend | Node.js, Express, TypeScript, Layered Architecture |
| Database | PostgreSQL, Prisma ORM |
| Realtime | WebSocket (ws) |

## Cấu trúc thư mục

```
pho-restaurant-app/
├── backend/                          # API Server
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema
│   │   └── seed.ts                   # Dữ liệu mẫu
│   ├── src/
│   │   ├── config/                   # Cấu hình DB, env
│   │   ├── controllers/              # Controller layer
│   │   │   ├── order.controller.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── employee.controller.ts
│   │   │   └── report.controller.ts
│   │   ├── services/                 # Service layer (nghiệp vụ)
│   │   │   ├── order.service.ts
│   │   │   ├── inventory.service.ts
│   │   │   ├── employee.service.ts
│   │   │   └── report.service.ts
│   │   ├── repositories/             # Repository layer (truy vấn DB)
│   │   │   ├── order.repository.ts
│   │   │   ├── inventory.repository.ts
│   │   │   ├── employee.repository.ts
│   │   │   └── tax.repository.ts
│   │   ├── routes/                   # API routes
│   │   ├── middleware/               # Validation, error handler
│   │   ├── websocket/                # WebSocket realtime
│   │   ├── types/                    # TypeScript types
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── .env.example
│
└── frontend/                         # Mobile App (iOS/Android)
    ├── app/                          # Expo Router pages
    │   ├── _layout.tsx               # Tab navigation
    │   ├── index.tsx                 # POS screen
    │   ├── inventory.tsx
    │   ├── employees.tsx
    │   └── reports.tsx
    ├── src/
    │   ├── screens/                  # Màn hình chính
    │   │   ├── PosScreen.tsx
    │   │   ├── InventoryScreen.tsx
    │   │   ├── EmployeeScreen.tsx
    │   │   └── ReportScreen.tsx
    │   ├── components/               # UI components
    │   │   ├── BigButton.tsx
    │   │   └── MenuItemButton.tsx
    │   ├── store/                    # Zustand state management
    │   │   ├── posStore.ts
    │   │   ├── inventoryStore.ts
    │   │   ├── employeeStore.ts
    │   │   └── reportStore.ts
    │   ├── services/                 # API client
    │   ├── types/
    │   ├── constants/
    │   └── utils/
    ├── package.json
    └── app.json
```

## Cài đặt & Chạy

### 1. Database (PostgreSQL)

```bash
# Tạo database
createdb pho_restaurant
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Sửa DATABASE_URL trong .env

npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

API chạy tại `http://localhost:3000`

### 3. Frontend

```bash
cd frontend
npm install
npx expo start
```

Nhấn `i` cho iOS Simulator hoặc quét QR bằng Expo Go.

## API Endpoints

### Đơn hàng (POS)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/orders/menu` | Lấy thực đơn |
| POST | `/api/orders/orders` | Tạo đơn hàng |
| GET | `/api/orders/orders` | Danh sách đơn |
| PATCH | `/api/orders/orders/:id/status` | Cập nhật trạng thái |

### Kho
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/inventory/ingredients` | Danh mục nguyên liệu |
| POST | `/api/inventory/ingredients` | Thêm nguyên liệu |
| POST | `/api/inventory/receipts` | Tạo phiếu nhập kho |
| GET | `/api/inventory/receipts` | Lịch sử nhập hàng |

### Nhân viên
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/employees/employees` | Danh sách NV |
| POST | `/api/employees/timesheets/check-in` | Check-in |
| POST | `/api/employees/timesheets/check-out` | Check-out |
| GET | `/api/employees/payroll?year=&month=` | Bảng lương |

### Báo cáo
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/reports/revenue?period=day\|month\|year` | Doanh thu |
| GET | `/api/reports/tax?period=month` | Báo cáo thuế |
| GET | `/api/reports/tax/export` | Xuất báo cáo |

### WebSocket
- `ws://localhost:3000/ws` - Cập nhật trạng thái đơn hàng realtime

## Database Schema

Các bảng chính: `menu_items`, `orders`, `order_items`, `ingredients`, `inventory_receipts`, `employees`, `timesheets`, `tax_configs`

Xem chi tiết tại `backend/prisma/schema.prisma`.

## Kiến trúc Backend

```
Request → Route → Controller → Service → Repository → Prisma → PostgreSQL
                                    ↓
                              WebSocket Hub (broadcast)
```

Mỗi module tuân theo **Layered Architecture**:
- **Controller**: Nhận HTTP request, trả response
- **Service**: Logic nghiệp vụ (tính tiền, tính lương, tính thuế)
- **Repository**: Truy vấn database (Prisma + raw SQL cho báo cáo)
