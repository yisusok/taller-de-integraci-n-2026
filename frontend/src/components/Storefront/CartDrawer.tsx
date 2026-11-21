import { useEffect } from 'react';
import { formatArs } from '../Catalog/api';
import type { CartItem } from './storefront.types';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (key: string, nextQty: number) => void;
  onRemoveItem: (key: string) => void;
  onContinueShopping: () => void;
}

export function CartDrawer({
  open,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onContinueShopping,
}: CartDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.precio * item.quantity,
    0,
  );
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="sf-drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="sf-drawer sf-drawer--right"
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sf-drawer__header">
          <div>
            <p className="sf-eyebrow">MI COMPRA</p>
            <h2 className="sf-drawer__title">CARRITO ({totalUnits})</h2>
          </div>
          <button
            type="button"
            className="sf-drawer__close"
            onClick={onClose}
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        <div className="sf-cart-body">
          {items.length === 0 ? (
            <div className="sf-cart-empty">
              <p>Tu carrito todavía está vacío.</p>
              <button
                type="button"
                className="sf-btn sf-btn--primary"
                onClick={() => {
                  onClose();
                  onContinueShopping();
                }}
              >
                EXPLORAR CATÁLOGO
              </button>
            </div>
          ) : (
            <ul className="sf-cart-list">
              {items.map((item) => (
                <li key={item.key} className="sf-cart-item">
                  <img
                    src={item.imagenUrl}
                    alt={item.nombre}
                    className="sf-cart-item__img"
                  />
                  <div className="sf-cart-item__info">
                    <span className="sf-cart-item__brand">{item.marca}</span>
                    <strong className="sf-cart-item__name">{item.nombre}</strong>
                    <span className="sf-cart-item__variant">
                      Talle AR {item.talle} · {item.color}
                    </span>
                    <span className="sf-cart-item__price">
                      {formatArs(item.precio)}
                    </span>

                    <div className="sf-cart-item__controls">
                      <div className="sf-stepper sf-stepper--sm">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.key, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          aria-label="Disminuir cantidad"
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.key, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.maxStock}
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="sf-text-link sf-text-link--danger"
                        onClick={() => onRemoveItem(item.key)}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="sf-cart-footer">
            <div className="sf-cart-subtotal">
              <span>Subtotal</span>
              <strong>{formatArs(subtotal)}</strong>
            </div>
            <p className="sf-cart-note">
              Checkout integrado con Mercado Pago y selección de domicilio disponible en el próximo módulo.
            </p>
            <button
              type="button"
              className="sf-btn sf-btn--outline sf-btn--block"
              onClick={() => {
                onClose();
                onContinueShopping();
              }}
            >
              SEGUIR COMPRANDO
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
