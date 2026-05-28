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
  LogOut,
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
const USERS = [
  { role: 'admin', name: 'Admin User', title: 'Inventory Manager', description: 'Full access to analytics, all products, and publishing controls.' },
  { role: 'user', name: 'User View', title: 'Catalog Reviewer', description: 'Limited access to published products and detail pages.' }
];
const baseColumns = [
  { key: 'product', label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'stock', label: 'Stock' },
  { key: 'rating', label: 'Rating' },
  { key: 'visibility', label: 'Visibility', adminOnly: true }
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
    rating: params.get('rating') || '',
    sort: params.get('sort') || 'name',
    page: Number(params.get('page') || 1),
    view: params.get('view') || 'table'
  };
}

function syncUrl(path, state, replace = false) {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.categories?.length) params.set('category', state.categories.join(','));
  if (state.rating) params.set('rating', state.rating);
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
  const [currentUser, setCurrentUser] = useState(() => {
    const savedRole = localStorage.getItem('alpha-role');
    return USERS.find(user => user.role === savedRole) || null;
  });
  const [products, setProducts] = useState([]);
  const [publishedIds, setPublishedIds] = useState(() => {
    const saved = localStorage.getItem('alpha-published-products');
    return saved ? JSON.parse(saved) : [];
  });
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
        const nextProducts = data.products || [];
        setProducts(nextProducts);
        setPublishedIds(current => current.length ? current : nextProducts.filter(product => product.id % 7 !== 0).map(product => product.id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    if (publishedIds.length) {
      localStorage.setItem('alpha-published-products', JSON.stringify(publishedIds));
    }
  }, [publishedIds]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem('alpha-role', currentUser.role);
  }, [currentUser]);

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

  const login = useCallback(role => {
    const nextUser = USERS.find(user => user.role === role);
    setCurrentUser(nextUser);
    navigate('/products');
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('alpha-role');
    setCurrentUser(null);
    window.history.pushState({}, '', '/');
    setRoute('/');
    setMobileMenu(false);
  }, []);

  const togglePublished = useCallback(productId => {
    setPublishedIds(current => (
      current.includes(productId)
        ? current.filter(id => id !== productId)
        : [...current, productId]
    ));
  }, []);

  const visibleProducts = useMemo(() => {
    if (currentUser?.role === 'admin') return products;
    return products.filter(product => publishedIds.includes(product.id));
  }, [currentUser, products, publishedIds]);

  useEffect(() => {
    if (currentUser && route === '/') {
      navigate('/products');
    }
  }, [currentUser, navigate, route]);

  useEffect(() => {
    if (currentUser?.role === 'user' && route.startsWith('/analytics')) {
      navigate('/products');
    }
  }, [currentUser, navigate, route]);

  if (!currentUser) {
    return <LoginPage onLogin={login} />;
  }

  const activeProductId = route.startsWith('/products/') ? Number(route.split('/').at(-1)) : null;
  const page = currentUser.role === 'admin' && route.startsWith('/analytics') ? 'analytics' : activeProductId ? 'detail' : 'products';
  const detailSource = currentUser.role === 'admin' ? products : visibleProducts;

  return (
    <div className="app-shell">
      <Sidebar page={page} user={currentUser} open={mobileMenu} onClose={() => setMobileMenu(false)} onNavigate={navigate} onLogout={logout} />
      <div className="workspace">
        <Topbar user={currentUser} onMenu={() => setMobileMenu(true)} />
        <main className="content">
          {error && <div className="error-banner">{error}</div>}
          {page === 'analytics' && <Analytics products={products} loading={loading} />}
          {page === 'detail' && (
            <Suspense fallback={<PageLoader />}>
              <ProductDetail product={detailSource.find(item => item.id === activeProductId)} loading={loading} onBack={() => navigate('/products')} />
            </Suspense>
          )}
          {page === 'products' && (
            <Products
              products={visibleProducts}
              loading={loading}
              user={currentUser}
              publishedIds={publishedIds}
              onOpen={id => navigate(`/products/${id}`)}
              onTogglePublished={togglePublished}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  return (
    <main className="login-screen">
      <section className="login-panel">
        <div>
          <span className="eyebrow">Alpha Dashboard</span>
          <h1>Choose a profile</h1>
          <p>Use either role to review how access changes across the product dashboard.</p>
        </div>
        <div className="login-options">
          {USERS.map(user => (
            <button className="login-card" key={user.role} onClick={() => onLogin(user.role)}>
              <div className="avatar"><UserRound size={20} /></div>
              <div>
                <strong>{user.name}</strong>
                <span>{user.title}</span>
                <p>{user.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function Sidebar({ page, user, open, onClose, onNavigate, onLogout }) {
  const itemClass = name => `nav-item ${page === name ? 'active' : ''}`;

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>Alpha Admin</strong>
            <span>Product Operations</span>
          </div>
        </div>
        <nav>
          <button className={itemClass('products')} onClick={() => onNavigate('/products')}>
            <LayoutDashboard size={18} /> Products
          </button>
          {user.role === 'admin' && (
            <button className={itemClass('analytics')} onClick={() => onNavigate('/analytics')}>
              <BarChart3 size={18} /> Analytics
            </button>
          )}
        </nav>
        <div className="profile-card">
          <div className="avatar"><UserRound size={18} /></div>
          <div>
            <strong>{user.name}</strong>
            <span>{user.title}</span>
          </div>
          <button className="logout-button" aria-label="Log out" onClick={onLogout}><LogOut size={16} /></button>
        </div>
      </aside>
      {open && <button className="scrim" aria-label="Close menu" onClick={onClose} />}
    </>
  );
}

function Topbar({ user, onMenu }) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-only" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div>
        <span className="eyebrow">Product management</span>
        <h1>{user.role === 'admin' ? 'Admin Dashboard' : 'Product Catalog'}</h1>
      </div>
      <div className="topbar-actions">
        <span className="live-dot" /> {user.role === 'admin' ? 'Live stock polling' : 'Published products only'}
      </div>
    </header>
  );
}

function Products({ products, loading, user, publishedIds, onOpen, onTogglePublished }) {
  const urlState = useMemo(getUrlState, []);
  const [query, setQuery] = useState(urlState.query);
  const [categories, setCategories] = useState(urlState.categories);
  const [rating, setRating] = useState(urlState.rating);
  const [sort, setSort] = useState(urlState.sort);
  const [page, setPage] = useState(urlState.page);
  const [view, setView] = useState(urlState.view);
  const columns = useMemo(() => baseColumns.filter(column => user.role === 'admin' || !column.adminOnly), [user.role]);
  const [visibleColumns, setVisibleColumns] = useState(columns.map(column => column.key));
  const debouncedQuery = useDebouncedValue(query);
  const perPage = view === 'grid' ? 8 : 10;
  const isAdmin = user.role === 'admin';

  const allCategories = useMemo(() => {
    return [...new Set(products.map(product => product.category))].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const search = debouncedQuery.trim().toLowerCase();
    const filtered = products.filter(product => {
      const matchesSearch = !search || `${product.title} ${product.brand} ${product.category}`.toLowerCase().includes(search);
      const matchesCategory = categories.length === 0 || categories.includes(product.category);
      const matchesRating = !rating || product.rating >= Number(rating);
      return matchesSearch && matchesCategory && matchesRating;
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'price') return a.price - b.price;
      if (sort === 'rating') return b.rating - a.rating;
      return a.title.localeCompare(b.title);
    });
  }, [products, debouncedQuery, categories, rating, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredProducts.slice(start, start + perPage);
  }, [filteredProducts, currentPage, perPage]);

  useEffect(() => {
    syncUrl('/products', { query: debouncedQuery, categories, rating, sort, page: currentPage, view }, true);
  }, [debouncedQuery, categories, rating, sort, currentPage, view]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, categories, rating, sort, view]);

  useEffect(() => {
    setVisibleColumns(current => {
      const allowedKeys = columns.map(column => column.key);
      const next = current.filter(key => allowedKeys.includes(key));
      const missing = allowedKeys.filter(key => !next.includes(key));
      return [...next, ...missing];
    });
  }, [columns]);

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
          <h2>{isAdmin ? 'Products' : 'Published Products'}</h2>
          <p>{isAdmin ? 'Search, filter, sort, publish, and review live inventory from DummyJSON.' : 'Browse only the products approved for standard users.'}</p>
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
        <select value={rating} onChange={event => setRating(event.target.value)} aria-label="Filter by rating">
          <option value="">Any rating</option>
          <option value="4">4+ stars</option>
          <option value="3">3+ stars</option>
          <option value="2">2+ stars</option>
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

      <ColumnManager columns={columns} visibleColumns={visibleColumns} onToggle={toggleColumn} onMove={moveColumn} />

      {loading ? <PageLoader /> : view === 'table' ? (
        <ProductTable products={pageProducts} visibleColumns={visibleColumns} publishedIds={publishedIds} isAdmin={isAdmin} onOpen={onOpen} onTogglePublished={onTogglePublished} />
      ) : (
        <ProductGrid products={pageProducts} publishedIds={publishedIds} isAdmin={isAdmin} onOpen={onOpen} onTogglePublished={onTogglePublished} />
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

const ProductTable = memo(function ProductTable({ products, visibleColumns, publishedIds, isAdmin, onOpen, onTogglePublished }) {
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
              {visibleColumns.map(key => (
                <ProductCell
                  key={key}
                  column={key}
                  product={product}
                  isAdmin={isAdmin}
                  isPublished={publishedIds.includes(product.id)}
                  onTogglePublished={onTogglePublished}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && <EmptyState />}
    </div>
  );
});

function ProductCell({ column, product, isAdmin, isPublished, onTogglePublished }) {
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
  if (column === 'visibility') {
    return (
      <td>
        <button
          className={isPublished ? 'publish-toggle active' : 'publish-toggle'}
          disabled={!isAdmin}
          onClick={event => {
            event.stopPropagation();
            onTogglePublished(product.id);
          }}
        >
          {isPublished ? 'Published' : 'Hidden'}
        </button>
      </td>
    );
  }
  return <td><span className="rating"><Star size={15} fill="currentColor" /> {product.rating}</span></td>;
}

const ProductGrid = memo(function ProductGrid({ products, publishedIds, isAdmin, onOpen, onTogglePublished }) {
  if (products.length === 0) return <EmptyState />;

  return (
    <div className="product-grid">
      {products.map(product => (
        <article className="product-card" key={product.id}>
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
          <div className="card-actions">
            <button className="ghost-button" onClick={() => onOpen(product.id)}>View details</button>
            {isAdmin && (
              <button className={publishedIds.includes(product.id) ? 'publish-toggle active' : 'publish-toggle'} onClick={() => onTogglePublished(product.id)}>
                {publishedIds.includes(product.id) ? 'Published' : 'Hidden'}
              </button>
            )}
          </div>
        </article>
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
