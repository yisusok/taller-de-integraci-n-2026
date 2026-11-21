import type { Producto, Variante } from '../Catalog/api';
import heroSneaker from '../../assets/figma/hero-sneaker.png';
import sportRunning from '../../assets/figma/sport-running.png';
import sportFutbol from '../../assets/figma/sport-futbol.png';
import sportBasquet from '../../assets/figma/sport-basquet.png';
import sportTenis from '../../assets/figma/sport-tenis.png';
import sportTraining from '../../assets/figma/sport-training.png';
import sportLifestyle from '../../assets/figma/sport-lifestyle.png';
import productFallback1 from '../../assets/figma/product-fallback-1.png';
import productFallback2 from '../../assets/figma/product-fallback-2.png';
import productFallback3 from '../../assets/figma/product-fallback-3.png';
import bentoNuevo from '../../assets/figma/bento-nuevo.png';
import bentoTendencia from '../../assets/figma/bento-tendencia.png';
import bentoOferta1 from '../../assets/figma/bento-oferta-1.png';
import bentoOferta2 from '../../assets/figma/bento-oferta-2.png';
import brand1 from '../../assets/figma/brand-1.png';
import brand2 from '../../assets/figma/brand-2.png';
import brand3 from '../../assets/figma/brand-3.png';
import brand4 from '../../assets/figma/brand-4.png';
import brand5 from '../../assets/figma/brand-5.png';
import brand6 from '../../assets/figma/brand-6.png';
import iconUser from '../../assets/figma/icon-user.svg';
import iconCart from '../../assets/figma/icon-cart.svg';
import iconHeart from '../../assets/figma/icon-heart.svg';
import iconHeartOutline from '../../assets/figma/icon-heart-outline.svg';
import iconHeartActive from '../../assets/figma/icon-heart-active.svg';
import iconHeartWhite from '../../assets/figma/icon-heart-white.svg';
import iconSearch from '../../assets/figma/icon-search.svg';
import iconChevronDown from '../../assets/figma/icon-chevron-down.svg';
import iconShieldCheck from '../../assets/figma/icon-shield-check.svg';

export interface UserSession {
  id?: string;
  nombre: string;
  email: string;
  rol?: string;
  avatar?: string | null;
}

export type StoreView =
  | 'home'
  | 'catalog'
  | 'sports'
  | 'product'
  | 'favorites'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'account'
  | 'backoffice';

export type PriceRangeFilter = 'all' | 'under-80k' | '80k-140k' | 'over-140k';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

export interface CatalogFilters {
  search: string;
  categoriaId: string;
  sportTag: string;
  sportLabel: string;
  marca: string;
  talle: string;
  color: string;
  priceRange: PriceRangeFilter;
  sort: SortOption;
  onlyInStock: boolean;
}

export interface CartItem {
  key: string;
  productId: string;
  variantId: string;
  nombre: string;
  marca: string;
  imagenUrl: string;
  precio: number;
  talle: string;
  color: string;
  quantity: number;
  maxStock: number;
}

export interface SportDiscipline {
  id: string;
  tag: string;
  name: string;
  shortName: string;
  description: string;
  image: string;
}

export interface BrandTile {
  name: string;
  image: string;
}

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  search: '',
  categoriaId: '',
  sportTag: '',
  sportLabel: '',
  marca: '',
  talle: '',
  color: '',
  priceRange: 'all',
  sort: 'featured',
  onlyInStock: false,
};

export const HERO_FALLBACK_IMAGE = heroSneaker;

export const PRODUCT_FALLBACKS = [
  productFallback1,
  productFallback2,
  productFallback3,
];

export const BENTO_FALLBACKS = {
  nuevo: bentoNuevo,
  tendencia: bentoTendencia,
  oferta1: bentoOferta1,
  oferta2: bentoOferta2,
};

export const ICONS = {
  user: iconUser,
  cart: iconCart,
  heart: iconHeart,
  heartOutline: iconHeartOutline,
  heartActive: iconHeartActive,
  heartWhite: iconHeartWhite,
  search: iconSearch,
  chevronDown: iconChevronDown,
  shieldCheck: iconShieldCheck,
};

export const SPORT_DISCIPLINES: SportDiscipline[] = [
  {
    id: 'running',
    tag: 'running',
    name: 'Running',
    shortName: 'Running',
    description:
      'Amortiguación reactiva y suelas diseñadas para asfalto, pista o fondos largos.',
    image: sportRunning,
  },
  {
    id: 'futbol',
    tag: 'futbol',
    name: 'Fútbol',
    shortName: 'Fútbol',
    description:
      'Botines con tracción precisa para césped natural, sintético o salón.',
    image: sportFutbol,
  },
  {
    id: 'basquet',
    tag: 'basquet',
    name: 'Básquet',
    shortName: 'Básquet',
    description:
      'Soporte lateral, estabilidad en el tobillo y respuesta explosiva en cancha.',
    image: sportBasquet,
  },
  {
    id: 'tenis',
    tag: 'tenis',
    name: 'Tenis / Padel',
    shortName: 'Tenis',
    description:
      'Refuerzos de puntera y agarre multidireccional para desplazamientos rápidos.',
    image: sportTenis,
  },
  {
    id: 'training',
    tag: 'training',
    name: 'Training / Gimnasio',
    shortName: 'Training',
    description:
      'Base firme y ventilación superior para circuitos funcionales y fuerza.',
    image: sportTraining,
  },
  {
    id: 'urbano',
    tag: 'urbano',
    name: 'Lifestyle / Urbano',
    shortName: 'Lifestyle',
    description:
      'Siluetas versátiles y confort diario para combinar con tu estilo.',
    image: sportLifestyle,
  },
];

export const BRAND_TILES: BrandTile[] = [
  { name: 'Nike', image: brand1 },
  { name: 'Adidas', image: brand2 },
  { name: 'Puma', image: brand3 },
  { name: 'New Balance', image: brand4 },
  { name: 'Under Armour', image: brand5 },
  { name: 'Asics', image: brand6 },
];

const DISCIPLINE_KEYWORDS: Record<string, string[]> = {
  running: ['running', 'run', 'correr', 'maraton'],
  futbol: ['futbol', 'botin', 'mercurial', 'salomon', 'papi'],
  basquet: ['basquet', 'basket', 'basketball'],
  tenis: ['tenis', 'padel', 'paddle', 'tennis'],
  training: ['training', 'gym', 'gimnasio', 'entrenamiento', 'fitness', 'crossfit'],
  urbano: ['urbano', 'urbana', 'urbanas', 'casual', 'casuales', 'lifestyle', 'diario'],
};

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const getProductImage = (product: Producto, index = 0): string => {
  const custom = product.imagen_url?.trim();
  if (custom) {
    return custom;
  }
  const safeIndex = Math.abs(index) % PRODUCT_FALLBACKS.length;
  return PRODUCT_FALLBACKS[safeIndex];
};

export const productMatchesDiscipline = (
  product: Producto,
  tag: string,
): boolean => {
  const normalizedTag = normalizeText(tag);
  if (!normalizedTag) {
    return true;
  }
  const keywords = DISCIPLINE_KEYWORDS[normalizedTag] ?? [normalizedTag];
  const fields = [
    ...product.etiquetas,
    product.uso_recomendado ?? '',
    product.categoria?.nombre ?? '',
    product.nombre,
  ].map(normalizeText);

  return fields.some((field) => keywords.some((kw) => field.includes(kw)));
};

export const getDefaultAvailableVariant = (
  product: Producto,
): Variante | undefined => {
  if (!product.variantes.length) {
    return undefined;
  }
  return (
    product.variantes.find((variant) => variant.stock_actual > 0) ??
    product.variantes[0]
  );
};

export const filterAndSortProducts = (
  products: Producto[],
  filters: Pick<
    CatalogFilters,
    'talle' | 'color' | 'priceRange' | 'sort' | 'onlyInStock'
  >,
): Producto[] => {
  const talleFilter = filters.talle.trim().toLowerCase();
  const colorFilter = filters.color.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (filters.onlyInStock && product.stock_total <= 0) {
      return false;
    }

    if (talleFilter) {
      const hasTalle = product.variantes.some(
        (variant) =>
          variant.talle.trim().toLowerCase() === talleFilter &&
          (!filters.onlyInStock || variant.stock_actual > 0),
      );
      if (!hasTalle) {
        return false;
      }
    }

    if (colorFilter) {
      const hasColor = product.variantes.some(
        (variant) =>
          variant.color.trim().toLowerCase() === colorFilter &&
          (!filters.onlyInStock || variant.stock_actual > 0),
      );
      if (!hasColor) {
        return false;
      }
    }

    if (filters.priceRange === 'under-80k' && product.precio >= 80000) {
      return false;
    }
    if (
      filters.priceRange === '80k-140k' &&
      (product.precio < 80000 || product.precio > 140000)
    ) {
      return false;
    }
    if (filters.priceRange === 'over-140k' && product.precio <= 140000) {
      return false;
    }

    return true;
  });

  const sorted = [...filtered];

  if (filters.sort === 'price-asc') {
    sorted.sort((a, b) => a.precio - b.precio);
  } else if (filters.sort === 'price-desc') {
    sorted.sort((a, b) => b.precio - a.precio);
  } else if (filters.sort === 'newest') {
    sorted.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } else {
    sorted.sort((a, b) => {
      const aStock = a.stock_total > 0 ? 1 : 0;
      const bStock = b.stock_total > 0 ? 1 : 0;
      return bStock - aStock;
    });
  }

  return sorted;
};
