#  Product Admin Dashboard
# Alpha Product Admin Dashboard

A responsive product management dashboard built with React and Vite. The app uses the DummyJSON Products API to provide a clean SaaS-style admin interface with product listing, filtering, analytics, and product detail views.

## Features

- Responsive admin layout with sidebar, top navigation, main content area, and profile section
- Initial login screen with Admin View and User View profiles
- Role-based access control for analytics, product visibility, and publishing controls
- Product table and grid views with image, name, category, price, stock status, and rating
- Debounced product search
- Multi-category filtering
- Rating filtering reflected in the URL
- Sorting by name, price, and rating
- Pagination
- URL state synchronization for search, filters, sorting, pagination, and view mode
- Product detail page with image carousel, description, category, pricing, rating, stock, and metadata
- Analytics dashboard with total products, average rating, inventory value, category distribution, and inventory value chart
- Admin-only published/hidden product toggles
- Simulated live stock updates through polling
- Column customization with show, hide, and reorder controls
- Performance optimizations using `React.memo`, `useMemo`, `useCallback`, debounced search, and lazy loading

## Tech Stack

- React
- Vite
- Recharts
- Lucide React
- DummyJSON Products API

## API

The product data is loaded from:

```text
https://dummyjson.com/products
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Routes

- `/` - Login profile selection
- `/products` - Product listing and management screen
- `/products/:id` - Product detail page
- `/analytics` - Analytics dashboard

## URL State Examples

```text
/products?q=apple
/products?category=laptops,mobile-accessories&sort=price
/products?q=phone&category=smartphones&rating=4&sort=rating&page=2&view=grid
```

## Submission Links

- GitHub: https://github.com/ojasvirastogi/alpha
- Deployment: https://alpha-sigma-nine.vercel.app

## Project Structure

```text
src/
  main.jsx
  ProductDetail.jsx
  styles.css
index.html
package.json
```



This project covers the required admin dashboard layout, product listing module, product detail page, analytics dashboard, performance optimization requirements, URL state synchronization, authentication profiles, and role-based access control. It also includes bonus functionality for live product updates and column customization.
