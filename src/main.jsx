import React, { Suspense, lazy, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Gauge,
  Grid3X3,
  LayoutDashboard,
  Menu,
  PackageSearch,
  Search,
  SlidersHorizontal,
  Star,
  Table2,
  UserRound,
  X
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import './styles.css';

const ProductDetail = lazy(() => import('./ProductDetail.jsx'));

const API_URL = 'https://dummyjson.com/products?limit=100';
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const chartColors = ['#2563eb', '#059669', '#dc2626', '#ca8a04', '#7c3aed', '#0891b2', '#db2777'];
const baseColumns = [
  { key: 'product', label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'stock', label: 'Stock' },
  { key: 'rating', label: 'Rating' }
];

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function getUrlState() {
  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get('q') || '',
    categories: params.get('category') ? params.get('category').split(',').filter(Boolean) : [],
    sort: params.get('sort') || 'name',
    page: Number(params.get('page') || 1),
    view: params.get('view') || 'table'
  };
}

function syncUrl(path, state, replace = false) {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.categories?.length) params.set('category', state.categories.join(','));
  if (state.sort && state.sort !== 'name') params.set('sort', state.sort);
  if (state.page && state.page > 1) params.set('page', String(state.page));
  if (state.view && state.view !== 'table') params.set('view', state.view);
  const url = `${path}${params.toString() ? `?${params.toString()}` : ''}`;
  window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
}

function stockLabel(stock) {
  if (stock === 0) return 'Out of stock';
  if (stock < 25) return 'Low stock';
  return 'In stock';
}

function App() {
  const [route, setRoute] = useState(() => window.location.pathname);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Products could not be loaded');
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setProducts(current =>
        current.map(product =>
          product.id % 9 === 0
            ? { ...product, stock: Math.max(0, product.stock + (Math.random() > 0.55 ? 1 : -1)) }
            : product
        )
      );
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback(path => {
    window.history.pushState({}, '', path);
    setRoute(window.location.pathname);
    setMobileMenu(false);
  }, []);

  const activeProductId = route.startsWith('/products/') ? Number(route.split('/').at(-1)) : null;
  const page = route.startsWith('/analytics') ? 'analytics' : activeProductId ? 'detail' : 'products';

  return (
    <div className="app-shell">
      <Sidebar page={page} open={mobileMenu} onClose={() => setMobileMenu(false)} onNavigate={navigate} />
      <div className="workspace">
        <Topbar onMenu={() => setMobileMenu(true)} />
        <main className="content">
          {error && <div className="error-banner">{error}</div>}
          {page === 'analytics' && <Analytics products={products} loading={loading} />}
          {page === 'detail' && (
            <Suspense fallback={<PageLoader />}>
              <ProductDetail product={products.find(item => item.id === activeProductId)} loading={loading} onBack={() => navigate('/products')} />
            </Suspense>
          )}
          {page === 'products' && <Products products={products} loading={loading} onOpen={id => navigate(`/products/${id}`)} />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ page, open, onClose, onNavigate }) {
  const itemClass = name => `nav-item ${page === name ? 'active' : ''}`;

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">H</div>
          <div>
            <strong>HUBX Admin</strong>
            <span>Product Operations</span>
          </div>
        </div>
        <nav>
          <button className={itemClass('products')} onClick={() => onNavigate('/products')}>
            <LayoutDashboard size={18} /> Products
          </button>
          <button className={itemClass('analytics')} onClick={() => onNavigate('/analytics')}>
            <BarChart3 size={18} /> Analytics
          </button>
        </nav>
        <div className="profile-card">
          <div className="avatar"><UserRound size={18} /></div>
          <div>
            <strong>Admin User</strong>
            <span>Inventory Manager</span>
          </div>
        </div>
      </aside>
      {open && <button className="scrim" aria-label="Close menu" onClick={onClose} />}
    </>
  );
}

function Topbar({ onMenu }) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-only" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div>
        <span className="eyebrow">Product management</span>
        <h1>Admin Dashboard</h1>
      </div>
      <div className="topbar-actions">
        <span className="live-dot" /> Live stock polling
      </div>
    </header>
  );
}

function Products({ products, loading, onOpen }) {
  const urlState = useMemo(getUrlState, []);
  const [query, setQuery] = useState(urlState.query);
  const [categories, setCategories] = useState(urlState.categories);
  const [sort, setSort] = useState(urlState.sort);
  const [page, setPage] = useState(urlState.page);
  const [view, setView] = useState(urlState.view);
  const [visibleColumns, setVisibleColumns] = useState(baseColumns.map(column => column.key));
  const debouncedQuery = useDebouncedValue(query);
  const perPage = view === 'grid' ? 8 : 10;

  const allCategories = useMemo(() => {
    return [...new Set(products.map(product => product.category))].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const search = debouncedQuery.trim().toLowerCase();
    const filtered = products.filter(product => {
      const matchesSearch = !search || `${product.title} ${product.brand} ${product.category}`.toLowerCase().includes(search);
      const matchesCategory = categories.length === 0 || categories.includes(product.category);
      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'price') return a.price - b.price;
      if (sort === 'rating') return b.rating - a.rating;
      return a.title.localeCompare(b.title);
    });
  }, [products, debouncedQuery, categories, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredProducts.slice(start, start + perPage);
  }, [filteredProducts, currentPage, perPage]);

  useEffect(() => {
    syncUrl('/products', { query: debouncedQuery, categories, sort, page: currentPage, view }, true);
  }, [debouncedQuery, categories, sort, currentPage, view]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, categories, sort, view]);

  const toggleCategory = useCallback(category => {
    setCategories(current => (current.includes(category) ? current.filter(item => item !== category) : [...current, category]));
  }, []);

  const toggleColumn = useCallback(key => {
    setVisibleColumns(current => (current.includes(key) ? current.filter(item => item !== key) : [...current, key]));
  }, []);

  const moveColumn = useCallback((key, direction) => {
    setVisibleColumns(current => {
      const index = current.indexOf(key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const summary = useMemo(() => ({
    total: filteredProducts.length,
    lowStock: filteredProducts.filter(product => product.stock < 25).length,
    avgRating: filteredProducts.length ? filteredProducts.reduce((sum, product) => sum + product.rating, 0) / filteredProducts.length : 0
  }), [filteredProducts]);

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">Catalog</span>
          <h2>Products</h2>
          <p>Search, filter, sort, and review live inventory from DummyJSON.</p>
        </div>
        <div className="view-switch">
          <button className={view === 'table' ? 'selected' : ''} onClick={() => setView('table')} aria-label="Table view"><Table2 size={18} /></button>
          <button className={view === 'grid' ? 'selected' : ''} onClick={() => setView('grid')} aria-label="Grid view"><Grid3X3 size={18} /></button>
        </div>
      </div>

      <div className="metric-grid compact">
        <Metric icon={<Boxes />} label="Visible products" value={summary.total} />
        <Metric icon={<Star />} label="Average rating" value={summary.avgRating.toFixed(2)} />
        <Metric icon={<Gauge />} label="Low stock" value={summary.lowStock} tone="warn" />
      </div>

      <div className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products, brands, categories" />
        </label>
        <select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort products">
          <option value="name">Sort by name</option>
          <option value="price">Sort by price</option>
          <option value="rating">Sort by rating</option>
        </select>
      </div>

      <div className="filter-panel">
        <div className="filter-title"><SlidersHorizontal size={17} /> Categories</div>
        <div className="chips">
          {allCategories.map(category => (
            <button key={category} className={categories.includes(category) ? 'chip active' : 'chip'} onClick={() => toggleCategory(category)}>
              {category}
            </button>
          ))}
        </div>
      </div>

      <ColumnManager columns={baseColumns} visibleColumns={visibleColumns} onToggle={toggleColumn} onMove={moveColumn} />

      {loading ? <PageLoader /> : view === 'table' ? (
        <ProductTable products={pageProducts} visibleColumns={visibleColumns} onOpen={onOpen} />
      ) : (
        <ProductGrid products={pageProducts} onOpen={onOpen} />
      )}

      <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
    </section>
  );
}

function ColumnManager({ columns, visibleColumns, onToggle, onMove }) {
  return (
    <details className="column-manager">
      <summary><Columns3 size={17} /> Customize columns</summary>
      <div className="column-list">
        {columns.map(column => (
          <div className="column-row" key={column.key}>
            <label>
              <input type="checkbox" checked={visibleColumns.includes(column.key)} onChange={() => onToggle(column.key)} />
              {column.label}
            </label>
            <div>
              <button onClick={() => onMove(column.key, -1)} aria-label={`Move ${column.label} left`}><ChevronLeft size={15} /></button>
              <button onClick={() => onMove(column.key, 1)} aria-label={`Move ${column.label} right`}><ChevronRight size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

const ProductTable = memo(function ProductTable({ products, visibleColumns, onOpen }) {
  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            {visibleColumns.map(key => <th key={key}>{baseColumns.find(column => column.key === key)?.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id} onClick={() => onOpen(product.id)}>
              {visibleColumns.map(key => <ProductCell key={key} column={key} product={product} />)}
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && <EmptyState />}
    </div>
  );
});

function ProductCell({ column, product }) {
  if (column === 'product') {
    return (
      <td>
        <div className="product-cell">
          <img src={product.thumbnail} alt="" loading="lazy" />
          <div>
            <strong>{product.title}</strong>
            <span>{product.brand || 'Unbranded'}</span>
          </div>
        </div>
      </td>
    );
  }
  if (column === 'category') return <td><span className="category-pill">{product.category}</span></td>;
  if (column === 'price') return <td>{money.format(product.price)}</td>;
  if (column === 'stock') return <td><span className={`status ${stockLabel(product.stock).toLowerCase().replaceAll(' ', '-')}`}>{stockLabel(product.stock)}</span></td>;
  return <td><span className="rating"><Star size={15} fill="currentColor" /> {product.rating}</span></td>;
}

const ProductGrid = memo(function ProductGrid({ products, onOpen }) {
  if (products.length === 0) return <EmptyState />;

  return (
    <div className="product-grid">
      {products.map(product => (
        <button className="product-card" key={product.id} onClick={() => onOpen(product.id)}>
          <img src={product.thumbnail} alt="" loading="lazy" />
          <div>
            <span className="category-pill">{product.category}</span>
            <h3>{product.title}</h3>
            <p>{product.description}</p>
          </div>
          <div className="card-footer">
            <strong>{money.format(product.price)}</strong>
            <span className="rating"><Star size={15} fill="currentColor" /> {product.rating}</span>
          </div>
        </button>
      ))}
    </div>
  );
});

function Analytics({ products, loading }) {
  const analytics = useMemo(() => {
    const totalProducts = products.length;
    const averageRating = totalProducts ? products.reduce((sum, product) => sum + product.rating, 0) / totalProducts : 0;
    const inventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
    const categories = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {});
    const categoryData = Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const valueData = categoryData.slice(0, 8).map(item => ({
      name: item.name,
      value: products.filter(product => product.category === item.name).reduce((sum, product) => sum + product.price * product.stock, 0)
    }));

    return { totalProducts, averageRating, inventoryValue, categoryData, valueData };
  }, [products]);

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">Analytics</span>
          <h2>Inventory Overview</h2>
          <p>Category mix, product health, and the total value currently held in stock.</p>
        </div>
      </div>
      <div className="metric-grid">
        <Metric icon={<Boxes />} label="Total products" value={analytics.totalProducts} />
        <Metric icon={<Star />} label="Average rating" value={analytics.averageRating.toFixed(2)} />
        <Metric icon={<Gauge />} label="Inventory value" value={money.format(analytics.inventoryValue)} />
        <Metric icon={<PackageSearch />} label="Categories" value={analytics.categoryData.length} />
      </div>
      {loading ? <PageLoader /> : (
        <div className="chart-layout">
          <div className="chart-panel">
            <h3>Category Distribution</h3>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={analytics.categoryData} dataKey="value" nameKey="name" innerRadius={72} outerRadius={115} paddingAngle={2}>
                  {analytics.categoryData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-panel">
            <h3>Inventory Value by Category</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={analytics.valueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={80} />
                <YAxis tickFormatter={value => `$${Math.round(value / 1000)}k`} />
                <Tooltip formatter={value => money.format(value)} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ icon, label, value, tone = '' }) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16} /> Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next <ChevronRight size={16} /></button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <X size={20} />
      No products match the current filters.
    </div>
  );
}

function PageLoader() {
  return <div className="loader">Loading products...</div>;
}

createRoot(document.getElementById('root')).render(<App />);
