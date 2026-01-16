# Tailwind CSS 4 & shadcn/ui Setup - Task 1.3

## ✅ Completed Setup

### 1. Tailwind CSS 4 Configuration

**File: `tailwind.config.js`**
- ✅ Mobile-first breakpoints configured:
  - xs: 375px (mobile)
  - sm: 640px (small tablets)
  - md: 768px (tablets)
  - lg: 1024px (laptops)
  - xl: 1280px (desktops)
  - 2xl: 1536px (large screens)

- ✅ Custom color system (Requirements 12.6):
  - `room-empty`: #10b981 (Phòng trống - Màu xanh lá)
  - `room-debt`: #ef4444 (Phòng nợ tiền - Màu đỏ rực)
  - `meter-rollover`: #f59e0b (Đồng hồ xoay vòng - Màu vàng cảnh báo)
  - `bill-paid`: #3b82f6 (Đã thanh toán - Màu xanh dương)
  - `bill-unpaid`: #f97316 (Chưa thanh toán - Màu cam)

- ✅ Font sizes (Requirements 12.4):
  - base: 16px (nội dung)
  - lg: 18px
  - xl: 20px (tiêu đề nhỏ)
  - 2xl: 24px (tiêu đề)
  - 3xl: 30px
  - 4xl: 36px

- ✅ Minimum touch target sizes (Requirements 12.3):
  - min-h-touch: 44px
  - min-w-touch: 44px

### 2. shadcn/ui Components Installed

**Directory: `components/ui/`**
- ✅ Button component (with 44px minimum size)
- ✅ Input component (with 44px minimum height)
- ✅ Card component (with CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- ✅ Dialog component
- ✅ Form component
- ✅ Label component

### 3. Utility Files

**File: `lib/utils.js`**
- ✅ `cn()` function for merging Tailwind classes

**File: `components.json`**
- ✅ shadcn/ui configuration file

### 4. Global Styles

**File: `app/globals.css`**
- ✅ Base font size: 16px
- ✅ Heading styles:
  - h1: 36px, bold
  - h2: 30px, bold
  - h3: 24px, semi-bold
  - h4: 20px, semi-bold

### 5. Demo Page

**File: `app/page.js`**
- ✅ Color system showcase
- ✅ Button components demo (all sizes meet 44px minimum)
- ✅ Form components demo
- ✅ Typography demo
- ✅ Mobile-first responsive grid demo

## 📦 Dependencies Installed

```json
{
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.562.0",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "tailwindcss-animate": "^1.0.7"
  }
}
```

## 🎨 Usage Examples

### Using Custom Colors

```jsx
// Phòng trống
<div className="bg-room-empty text-white">Phòng Trống</div>

// Phòng nợ
<div className="bg-room-debt text-white">Phòng Nợ</div>

// Đồng hồ xoay vòng
<div className="bg-meter-rollover text-white">Cảnh Báo</div>

// Đã thanh toán
<div className="bg-bill-paid text-white">Đã Thanh Toán</div>

// Chưa thanh toán
<div className="bg-bill-unpaid text-white">Chưa Thanh Toán</div>
```

### Using Buttons (44px minimum)

```jsx
import { Button } from "@/components/ui/button"

// Default button (44px minimum)
<Button>Click Me</Button>

// Different variants
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>

// Different sizes (all meet 44px minimum)
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

### Using Input (44px minimum)

```jsx
import { Input } from "@/components/ui/input"

<Input 
  placeholder="Nhập tên phòng..." 
  className="text-base min-h-touch"
/>
```

### Using Card

```jsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Tiêu Đề</CardTitle>
    <CardDescription>Mô tả</CardDescription>
  </CardHeader>
  <CardContent>
    Nội dung card
  </CardContent>
</Card>
```

### Mobile-First Responsive

```jsx
// Grid that adapts to screen size
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {/* Content */}
</div>

// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop only</div>

// Show on mobile, hide on desktop
<div className="block md:hidden">Mobile only</div>
```

## ✅ Requirements Met

- ✅ **Requirement 12.1**: Mobile-first design with responsive breakpoints
- ✅ **Requirement 12.3**: Minimum button size 44x44px
- ✅ **Requirement 12.4**: Font size minimum 16px for content, 20px for headings
- ✅ **Requirement 12.6**: Clear color system for status differentiation

## 🚀 Next Steps

The Tailwind CSS 4 and shadcn/ui setup is complete. You can now:
1. Use the custom color system for room and bill statuses
2. Build forms with accessible input components (44px minimum)
3. Create responsive layouts with mobile-first breakpoints
4. Use shadcn/ui components for consistent UI

## 🧪 Testing

To test the setup:
1. Run `npm run dev`
2. Open http://localhost:3000
3. View the demo page showcasing all features
4. Test responsive design by resizing browser window
5. Verify button and input sizes meet 44px minimum
