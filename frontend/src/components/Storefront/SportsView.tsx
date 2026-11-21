import type { Producto } from '../Catalog/api';
import {
  SPORT_DISCIPLINES,
  productMatchesDiscipline,
} from './storefront.types';

interface SportsViewProps {
  products: Producto[];
  onSelectDiscipline: (tag: string, label: string) => void;
  onOpenCatalog: () => void;
}

export function SportsView({
  products,
  onSelectDiscipline,
  onOpenCatalog,
}: SportsViewProps) {
  return (
    <div className="sf-sports-view">
      <section className="sf-page-hero sf-page-hero--dark">
        <div className="sf-container sf-page-hero__inner">
          <p className="sf-page-hero__eyebrow sf-page-hero__eyebrow--red">
            CATÁLOGO ESPECIALIZADO
          </p>
          <h1 className="sf-page-hero__title">NUESTRAS DISCIPLINAS DEPORTIVAS</h1>
          <p className="sf-page-hero__subtitle">
            Encuentra el calzado adecuado según tu deporte, superficie de entrenamiento y tipo de pisada, con disponibilidad real por variante.
          </p>
          <div className="sf-page-hero__actions">
            <button
              type="button"
              className="sf-btn sf-btn--ghost-light"
              onClick={onOpenCatalog}
            >
              Ver todo el catálogo
            </button>
          </div>
        </div>
      </section>

      <section className="sf-section">
        <div className="sf-container">
          <div className="sf-disciplines-grid">
            {SPORT_DISCIPLINES.map((disc) => {
              const matchedCount = products.filter((prod) =>
                productMatchesDiscipline(prod, disc.tag),
              ).length;

              return (
                <article key={disc.id} className="sf-discipline-card">
                  <div className="sf-discipline-card__media">
                    <img
                      src={disc.image}
                      alt={disc.name}
                      className="sf-discipline-card__img"
                    />
                  </div>
                  <div className="sf-discipline-card__body">
                    <h2 className="sf-discipline-card__title">{disc.name}</h2>
                    <p className="sf-discipline-card__desc">{disc.description}</p>
                    <p className="sf-discipline-card__count">
                      {matchedCount > 0
                        ? `${matchedCount} modelo${matchedCount === 1 ? '' : 's'} en catálogo`
                        : 'Ver línea completa'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="sf-btn sf-btn--primary sf-btn--block"
                    onClick={() => onSelectDiscipline(disc.tag, disc.name)}
                  >
                    VER PRODUCTOS
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
