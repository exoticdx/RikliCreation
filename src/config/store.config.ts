export type FieldType = 'text' | 'number' | 'select' | 'boolean' | 'sizes_manager' | 'color_variants';

export interface CustomField {
  key: string;            // The key stored in the database (e.g., 'stitches')
  label: string;          // The user-facing label (e.g., 'Stitch Count')
  type: FieldType;        // Type of input/data
  options?: string[];     // Required if type is 'select'
  defaultValue?: any;     // Default value when adding new product or downloading template
  isFilterable?: boolean; // Should this appear in the sidebar filters?
  isSortable?: boolean;   // Should this appear in the sort dropdown?
}

// --- Layout Types ---
export type ComponentType = 'heroCarousel' | 'banner' | 'textContent';

export interface BaseComponentConfig {
  type: ComponentType;
}

export interface HeroCarouselConfig extends BaseComponentConfig {
  type: 'heroCarousel';
  slides: { title: string; subtitle: string; }[];
}

export interface BannerConfig extends BaseComponentConfig {
  type: 'banner';
  imageUrl: string;
  linkUrl?: string;
  altText?: string;
}

export interface TextContentConfig extends BaseComponentConfig {
  type: 'textContent';
  title: string;
  body: string;
}

export type LayoutComponent = HeroCarouselConfig | BannerConfig | TextContentConfig;

export interface StoreConfig {
  storeName: string;
  themeColor: string;
  whatsappNumber: string;
  maxImagesPerProduct: number;
  customFields: CustomField[];
  homeLayout: LayoutComponent[];
}

// ---------------------------------------------------------
// CONFIGURE YOUR CLIENT'S STORE HERE
// ---------------------------------------------------------
export const STORE_CONFIG: StoreConfig = {
  storeName: "Rikli Creation",
  themeColor: "#9c5c41",
  whatsappNumber: "919510072745",
  maxImagesPerProduct: 5,
  customFields: [
    {
      key: 'price',
      label: 'Price',
      type: 'number',
      isFilterable: false,
      isSortable: false
    },
    {
      key: 'material',
      label: 'Material',
      type: 'select',
      options: ['Gold Plated', 'Silver Plated', 'Rose Gold', 'Brass', 'Alloy'],
      isFilterable: false,
      isSortable: false
    },
    {
      key: 'color',
      label: 'Color',
      type: 'text',
      isFilterable: false,
      isSortable: false
    },
    {
      key: 'in_stock',
      label: 'In Stock',
      type: 'boolean',
      isFilterable: false,
      isSortable: false
    }
  ],
  homeLayout: [
    {
      type: 'textContent',
      title: 'Address',
      body: 'D-253 Global Textile Market, Surat'
    },
    // {
    //   type: 'textContent',
    //   title: 'Welcome to RC Imitation Jewellery',
    //   body: 'Browse our exclusive collection of premium imitation jewellery. We offer the best wholesale prices directly from manufacturers.'
    // }
  ]
};
