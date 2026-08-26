# Design Brief
**Project:** BelanjaIn SAZA (KOKSI)

## 1. User Flows
- **Authentication:** Login -> Redirect based on Role (User Dashboard, Admin Dashboard, IT NOC).
- **Core Shopping (User):** Dashboard -> Scan Barcode / Browse Catalog -> Add to Cart -> Checkout -> Order History Tracking.
- **Order Processing (Admin):** Admin Dashboard -> Incoming Orders -> Update Status (Preparing, Done, Cancelled) -> Auto-Notify User.
- **Monitoring (IT):** IT NOC -> View Real-time Metrics / Run API Tests -> Check Audit Logs.

## 2. Screen Inventory
1. **Login Page:** Multi-role login gateway.
2. **User Portal:**
   - Catalog & Search (with Category Pills).
   - Cart Sheet / Modal.
   - Barcode Scanner Overlay.
   - Order History List.
3. **Admin Portal:**
   - Sales Metrics (Charts).
   - Order Management (Kanban or Table).
   - Product Catalog Management (CRUD).
4. **IT NOC:**
   - Telemetry HUD.
   - API Diagnostics Test Runner.

## 3. Layout Strategy (Mobile-First / PWA)
- **Zero-Swipe Mobile Philosophy:** All tables on mobile convert to *Mobile Cards*. No horizontal scrolling.
- **Bottom Navigation (Mobile):** For core User actions (Home, Cart, Scanner, Profile).
- **Sidebar Navigation (Desktop):** For Admin & IT roles.

## 4. Components List
- **Atoms:** Primary Button, Outline Button, Badge (Status), Input Field, Category Pill.
- **Molecules:** Product Card, Cart Item Row, Order Status Banner, Data Metric Card.
- **Organisms:** Navigation Bar, Product Grid, Data Table (Desktop) / Card List (Mobile), Barcode Scanner View.

## 5. Design Tokens (Tailwind)
- **Colors (Primary Brand):** `blue-600` (Trust), `green-500` (Success/Checkout).
- **Typography:** Inter (Sans-serif) for clean UI.
  - Heading 1: `text-2xl font-bold`
  - Body: `text-base text-gray-700`
- **Spacing:** `p-4` (Standard padding), `gap-4` (Grid gap).

## 6. UI States
- **Empty:** "Keranjang Anda kosong", "Belum ada pesanan". (Include friendly illustration).
- **Loading:** Skeleton loaders for product lists and metric charts.
- **Error:** Toast notifications (e.g., "Gagal menghubungi server").
- **Success:** Confetti / checkmark animation for successful order.

## 7. Accessibility (a11y) Notes
- Ensure adequate color contrast (WCAG AA).
- All buttons must have `aria-label` (especially icon-only buttons).
- Support standard keyboard navigation for Admin data tables.
