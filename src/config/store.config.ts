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
  colors: {
    navHeading: string;
    buttonBackground: string;
    buttonText: string;
    textContent: string;
  };
  whatsappNumber: string;
  maxImagesPerProduct: number;
  homepageCategories: { name: string; image: string }[];
  customFields: CustomField[];
  homeLayout: LayoutComponent[];
}

// ---------------------------------------------------------
// CONFIGURE YOUR CLIENT'S STORE HERE
// ---------------------------------------------------------
export const STORE_CONFIG: StoreConfig = {
  storeName: "Rikli Creation",
  colors: {
    navHeading: "#000000",       // Color for the store name in navbar
    buttonBackground: "#000000", // Color for buttons (like Inquire, Add Product)
    buttonText: "#ffffff",       // Text color inside buttons
    textContent: "#000000"       // Color for product names and general front-end text
  },
  whatsappNumber: "919510072745",
  maxImagesPerProduct: 5,
  homepageCategories: [
    { name: "Cord Set", image: "https://images.unsplash.com/photo-1618932260643-eee4a2f65ba8?q=80&w=800&auto=format&fit=crop" },
    { name: "Kurties", image: "https://images.unsplash.com/photo-1583391733958-d25e07fac662?q=80&w=800&auto=format&fit=crop" }
  ],
  customFields: [
    {
      key: 'parent_category',
      label: 'Main Type',
      type: 'select',
      options: ['Cord Set', 'Kurties'],
      defaultValue: 'Cord Set',
      isFilterable: false,
      isSortable: false
    },
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
      key: 'Size',
      label: 'Size',
      defaultValue:'M,L,XL,XXL,XXXL',
      type: 'text',
      isFilterable: false,
      isSortable: false
    },
    {
      key: 'in_stock',
      label: 'In Stock',
      type: 'boolean',
      defaultValue: true,
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
