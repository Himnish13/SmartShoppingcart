# Admin Frontend - Smart Shopping Cart

A separate, dedicated admin interface for managing the Smart Shopping Cart system.

## Features

- **🔐 Authentication**: Secure login for admin users
- **📦 Product Management**: Add, edit, delete, and manage products with stock tracking
- **🎁 Offers Management**: Create and manage promotional offers with discounts
- **🛒 Cart Tracking**: Real-time monitoring of active shopping carts with location data
- **💰 Bill Generation**: Generate and print customer bills/invoices

## Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Backend server running on `http://localhost:3200`

### Installation

```bash
# Navigate to admin_frontend directory
cd admin_frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The admin panel will be available at `http://localhost:5174`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
admin_frontend/
├── src/
│   ├── pages/              # Page components
│   │   ├── LoginPage.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── ProductManagement.jsx
│   │   ├── OffersManagement.jsx
│   │   ├── CartTracking.jsx
│   │   └── BillGeneration.jsx
│   ├── components/         # Reusable components
│   │   └── PrivateRoute.jsx
│   ├── services/          # API communication
│   │   └── api.js
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

## API Integration

The admin frontend communicates with the main server backend at `http://localhost:3200`.

### Key Endpoints Used:
- `POST /users/login` - Admin authentication
- `GET /products` - Fetch all products
- `POST /admin/products` - Add new product
- `PUT /admin/products/:id` - Update product
- `DELETE /admin/products/:id` - Delete product
- `POST /admin/offers` - Add offer
- `PUT /admin/offers/:id` - Update offer
- `DELETE /admin/offers/:id` - Delete offer
- `GET /carts` - Fetch active carts
- `GET /admin/crowd` - Fetch crowd data

## Usage

### Login
1. Navigate to the login page
2. Enter admin email and password
3. Access the admin dashboard

### Managing Products
1. Go to "Manage Products"
2. Click "+ Add Product" or edit/delete existing products
3. Fill in product details and save

### Managing Offers
1. Go to "Manage Offers"
2. Select products without offers and create new offers
3. Set discount percentage and validity dates
4. Edit or remove existing offers

### Tracking Carts
1. Go to "Track Carts"
2. View real-time location and status of active carts
3. Monitor battery levels and customer information
4. Enable auto-refresh for live updates

### Generating Bills
1. Go to "Generate Bills"
2. Select a cart from the list
3. Review cart items in the bill preview
4. Print or finalize the bill

## Styling

The admin frontend uses the same color scheme as the main application:
- **Primary Color**: #6b63c6 (Purple)
- **Secondary Color**: #5a54b5 (Dark Purple)
- **Accent Color**: #fbd796 (Yellow)
- **Background**: #f5f5f5 (Light Gray)
- **Card Background**: #f2e6d0 (Tan)

## Technology Stack

- **React 19.2.4** - UI framework
- **Vite 8.0.4** - Build tool & dev server
- **React Router 7.14.0** - Client-side routing
- **CSS3** - Styling (no external CSS framework)

## Responsive Design

The admin frontend is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- The admin frontend runs on a **separate port (5174)** from the main server
- All API calls include authentication tokens stored in localStorage
- The dashboard provides a quick access menu to all admin features
- Auto-refresh functionality is available for cart tracking to monitor real-time updates

## Troubleshooting

### "Failed to login"
- Check if the backend server is running on port 3200
- Verify admin credentials

### "Failed to fetch products"
- Ensure the backend is running
- Check network connectivity
- Verify authorization token is valid

### Port already in use
- Change the port in `vite.config.js`
- Or kill the process using port 5174

## License

ISC
