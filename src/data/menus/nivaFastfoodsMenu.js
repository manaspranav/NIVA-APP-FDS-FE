/** NIVA Fast Foods — re-export from legacy catalog with vendorId */
import { fastfoods } from '../productsData';

export const VENDOR_ID = 'niva-fastfoods';

export const menu = fastfoods.map((item) => ({
  ...item,
  vendorId: VENDOR_ID,
  productType: item.type || 'fastfood',
}));

export default menu;
