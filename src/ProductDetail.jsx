import React, { memo, useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, PackageCheck, Star } from 'lucide-react';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function ProductDetail({ product, loading, onBack }) {
  const [activeImage, setActiveImage] = useState(0);
  const images = useMemo(() => product?.images?.length ? product.images : product?.thumbnail ? [product.thumbnail] : [], [product]);

  if (loading) return <div className="loader">Loading product...</div>;
  if (!product) {
    return (
      <section className="detail-empty">
        <button className="ghost-button" onClick={onBack}><ArrowLeft size={17} /> Back to products</button>
        <h2>Product not found</h2>
      </section>
    );
  }

  const nextImage = () => setActiveImage(current => (current + 1) % images.length);
  const previousImage = () => setActiveImage(current => (current - 1 + images.length) % images.length);

  return (
    <section className="detail-page">
      <button className="ghost-button" onClick={onBack}><ArrowLeft size={17} /> Back to products</button>
      <div className="detail-grid">
        <div className="gallery">
          <div className="gallery-main">
            <img src={images[activeImage]} alt={product.title} />
            {images.length > 1 && (
              <>
                <button className="gallery-control left" onClick={previousImage} aria-label="Previous image"><ChevronLeft size={18} /></button>
                <button className="gallery-control right" onClick={nextImage} aria-label="Next image"><ChevronRight size={18} /></button>
              </>
            )}
          </div>
          <div className="thumb-row">
            {images.map((image, index) => (
              <button key={image} className={activeImage === index ? 'active' : ''} onClick={() => setActiveImage(index)}>
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-info">
          <span className="category-pill">{product.category}</span>
          <h2>{product.title}</h2>
          <p>{product.description}</p>
          <div className="detail-stats">
            <div><span>Price</span><strong>{money.format(product.price)}</strong></div>
            <div><span>Rating</span><strong><Star size={18} fill="currentColor" /> {product.rating}</strong></div>
            <div><span>Stock</span><strong><PackageCheck size={18} /> {product.stock}</strong></div>
          </div>
          <div className="detail-meta">
            <div><span>Brand</span><strong>{product.brand || 'Unbranded'}</strong></div>
            <div><span>SKU</span><strong>{product.sku || `AL-${product.id}`}</strong></div>
            <div><span>Warranty</span><strong>{product.warrantyInformation || 'Standard warranty'}</strong></div>
            <div><span>Shipping</span><strong>{product.shippingInformation || 'Standard shipping'}</strong></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(ProductDetail);
