import { MarketplaceConfig, MarketplaceId } from '../types';

export const MARKETPLACE_ORDER: MarketplaceId[] = [
  'myntra',
  'd2c',
  'firstcry',
  'flipkart',
  'amazon',
  'nykaa',
  'ajio'
];

export const MARKETPLACE_CONFIGS: Record<MarketplaceId, MarketplaceConfig> = {
  myntra: {
    id: 'myntra',
    name: 'Myntra + SJIT',
    channels: ['PUSPL _MYNTRA_ONLINE', 'MYNTRA_SJIT'],
    structure: 'STRUCTURE_A',
    iconName: 'ShoppingBag',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    subChannels: ['PPMP', 'SJIT']
  },
  d2c: {
    id: 'd2c',
    name: 'D2C (Shopify)',
    channels: ['D2C Shopify', 'D2C', 'SHOPIFY'],
    structure: 'STRUCTURE_B',
    iconName: 'Globe',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  },
  firstcry: {
    id: 'firstcry',
    name: 'FirstCry',
    channels: ['FIRSTCRY'],
    structure: 'STRUCTURE_B',
    iconName: 'Baby',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  flipkart: {
    id: 'flipkart',
    name: 'Flipkart',
    channels: ['PUSPL _FLIPKART_ONLINE', 'FLIPKART'],
    structure: 'STRUCTURE_B',
    iconName: 'Package',
    badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon + Cocoblu + FBA',
    channels: ['AMAZON_FLEX_API', 'PUSPL _COCOBLU_ONLINE', 'AMAZON_COCOBLU', 'COCOBLU', 'AMAZON_FBA'],
    structure: 'STRUCTURE_A',
    iconName: 'ShoppingCart',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    subChannels: ['Amazon', 'Cocoblu', 'FBA']
  },
  nykaa: {
    id: 'nykaa',
    name: 'Nykaa',
    channels: ['PUSPL _NYKAA_ONLINE', 'NYKAA'],
    structure: 'STRUCTURE_B',
    iconName: 'Sparkles',
    badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20'
  },
  ajio: {
    id: 'ajio',
    name: 'Ajio',
    channels: ['AJIO_Dropship', 'AJIO'],
    structure: 'STRUCTURE_B',
    iconName: 'Store',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }
};

export const CHANNEL_TO_MARKETPLACE_MAP: Record<string, { marketplaceId: MarketplaceId; subChannel?: string }> = {
  'PUSPL _MYNTRA_ONLINE': { marketplaceId: 'myntra', subChannel: 'PPMP' },
  'MYNTRA_SJIT': { marketplaceId: 'myntra', subChannel: 'SJIT' },
  'AMAZON_FLEX_API': { marketplaceId: 'amazon', subChannel: 'Amazon' },
  'PUSPL _COCOBLU_ONLINE': { marketplaceId: 'amazon', subChannel: 'Cocoblu' },
  'AMAZON_COCOBLU': { marketplaceId: 'amazon', subChannel: 'Cocoblu' },
  'COCOBLU': { marketplaceId: 'amazon', subChannel: 'Cocoblu' },
  'AMAZON_FBA': { marketplaceId: 'amazon', subChannel: 'FBA' },
  'AJIO_Dropship': { marketplaceId: 'ajio' },
  'PUSPL _NYKAA_ONLINE': { marketplaceId: 'nykaa' },
  'FIRSTCRY': { marketplaceId: 'firstcry' },
  'PUSPL _FLIPKART_ONLINE': { marketplaceId: 'flipkart' },
  'D2C Shopify': { marketplaceId: 'd2c' }
};

export interface CategoryDefinition {
  name: string;
  division: 'FOOTWEAR' | 'APPAREL' | 'ACCESSORIES';
  largerSizePct?: number;
  smallerSizePct?: number;
  defaultMyntraStyleCount?: number;
}

export const FOOTWEAR_CATEGORIES: CategoryDefinition[] = [
  { name: 'BALLERINAS', division: 'FOOTWEAR', largerSizePct: 0.698, smallerSizePct: 0.302, defaultMyntraStyleCount: 23 },
  { name: 'BOOTS', division: 'FOOTWEAR', largerSizePct: 1.0, smallerSizePct: 0.0, defaultMyntraStyleCount: 4 },
  { name: 'CANVAS SHOES', division: 'FOOTWEAR', largerSizePct: 1.0, smallerSizePct: 0.0, defaultMyntraStyleCount: 7 },
  { name: 'CASUAL SHOES', division: 'FOOTWEAR', largerSizePct: 0.417, smallerSizePct: 0.583, defaultMyntraStyleCount: 18 },
  { name: 'FASHION SANDALS', division: 'FOOTWEAR', largerSizePct: 0.743, smallerSizePct: 0.257, defaultMyntraStyleCount: 9 },
  { name: 'FLIP FLOPS', division: 'FOOTWEAR', largerSizePct: 0.571, smallerSizePct: 0.429, defaultMyntraStyleCount: 29 },
  { name: 'LYCRA SHOES', division: 'FOOTWEAR', largerSizePct: 0.118, smallerSizePct: 0.882, defaultMyntraStyleCount: 0 },
  { name: 'MOULDS', division: 'FOOTWEAR', largerSizePct: 0.778, smallerSizePct: 0.222, defaultMyntraStyleCount: 36 },
  { name: 'SLIDES', division: 'FOOTWEAR', largerSizePct: 0.414, smallerSizePct: 0.586, defaultMyntraStyleCount: 6 },
  { name: 'SPORTS SANDALS', division: 'FOOTWEAR', largerSizePct: 0.972, smallerSizePct: 0.028, defaultMyntraStyleCount: 2 },
  { name: 'SPORTS SHOES', division: 'FOOTWEAR', largerSizePct: 0.909, smallerSizePct: 0.091, defaultMyntraStyleCount: 6 },
  { name: 'BOOTIES', division: 'FOOTWEAR', largerSizePct: 0.5, smallerSizePct: 0.5, defaultMyntraStyleCount: 5 }
];

export const APPAREL_CATEGORIES: CategoryDefinition[] = [
  { name: 'DRESS', division: 'APPAREL', largerSizePct: 0.571, smallerSizePct: 0.429, defaultMyntraStyleCount: 10 },
  { name: 'DUNGAREE', division: 'APPAREL', largerSizePct: 0.667, smallerSizePct: 0.333, defaultMyntraStyleCount: 1 },
  { name: 'JACKET', division: 'APPAREL', largerSizePct: 0.688, smallerSizePct: 0.313, defaultMyntraStyleCount: 0 },
  { name: 'SHIRT', division: 'APPAREL', largerSizePct: 1.0, smallerSizePct: 0.0, defaultMyntraStyleCount: 7 },
  { name: 'SKIRT', division: 'APPAREL', largerSizePct: 0.786, smallerSizePct: 0.214, defaultMyntraStyleCount: 4 },
  { name: 'SWEATER', division: 'APPAREL', largerSizePct: 0.615, smallerSizePct: 0.385, defaultMyntraStyleCount: 0 },
  { name: 'SWEATSHIRT', division: 'APPAREL', largerSizePct: 1.0, smallerSizePct: 0.0, defaultMyntraStyleCount: 0 },
  { name: 'TOP', division: 'APPAREL', largerSizePct: 0.845, smallerSizePct: 0.155, defaultMyntraStyleCount: 11 },
  { name: 'TROUSERS', division: 'APPAREL', largerSizePct: 0.780, smallerSizePct: 0.220, defaultMyntraStyleCount: 11 },
  { name: 'POLO T-SHIRT', division: 'APPAREL', largerSizePct: 0.750, smallerSizePct: 0.250, defaultMyntraStyleCount: 0 },
  { name: 'T-SHIRT', division: 'APPAREL', largerSizePct: 0.833, smallerSizePct: 0.167, defaultMyntraStyleCount: 13 },
  { name: 'JEANS', division: 'APPAREL', largerSizePct: 0.800, smallerSizePct: 0.200, defaultMyntraStyleCount: 17 },
  { name: 'JEGGING', division: 'APPAREL', largerSizePct: 0.5, smallerSizePct: 0.5, defaultMyntraStyleCount: 0 },
  { name: 'LOWER', division: 'APPAREL', largerSizePct: 0.750, smallerSizePct: 0.250, defaultMyntraStyleCount: 4 },
  { name: 'JUMPSUIT', division: 'APPAREL', largerSizePct: 0.0, smallerSizePct: 1.0, defaultMyntraStyleCount: 4 },
  { name: 'BERMUDA', division: 'APPAREL', largerSizePct: 1.0, smallerSizePct: 0.0, defaultMyntraStyleCount: 3 },
  { name: 'ROMPER', division: 'APPAREL', largerSizePct: 0.0, smallerSizePct: 1.0, defaultMyntraStyleCount: 0 },
  { name: 'CLOTHING SET', division: 'APPAREL', largerSizePct: 0.0, smallerSizePct: 1.0, defaultMyntraStyleCount: 2 },
  { name: 'CAP', division: 'ACCESSORIES', largerSizePct: 0.5, smallerSizePct: 0.5, defaultMyntraStyleCount: 0 },
  { name: 'TOY', division: 'ACCESSORIES', largerSizePct: 0.5, smallerSizePct: 0.5, defaultMyntraStyleCount: 0 },
  { name: 'SHORTS', division: 'APPAREL', largerSizePct: 0.75, smallerSizePct: 0.25, defaultMyntraStyleCount: 6 }
];

export const ALL_CATEGORIES = [...FOOTWEAR_CATEGORIES, ...APPAREL_CATEGORIES];
