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
    navHeading: "#ffffff",       // Color for the store name in navbar
    buttonBackground: "#0f1015", // Color for buttons (like Inquire, Add Product)
    buttonText: "#ffffff",       // Text color inside buttons
    textContent: "#ffffff"       // Color for product names and general front-end text
  },
  whatsappNumber: "919510072745",
  maxImagesPerProduct: 5,
  homepageCategories: [
    { name: "Cord Set", image: "https://i.pinimg.com/1200x/f3/be/68/f3be681610e27754af9c37ef095c0dd1.jpg" },
    { name: "Kurties", image: "https://i.pinimg.com/736x/fa/8c/c7/fa8cc72d6f36e5cc68dcaff2a96e3a9d.jpg" }
  ],
  customFields: [
    {
      key: 'material',
      label: 'Material',
      type: 'select',
      options: ['Gold Plated', 'Silver Plated', 'Rose Gold', 'Brass', 'Alloy'],
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
      type: 'heroCarousel',
      slides: 
      [
        { 
          title: "Address", 
          subtitle: "B-5144/45 Global Textile Market, Surat, Gujarat"
        },
        { 
          title: "MOQ", 
          subtitle: "Minimum 10 Set"
        },

      ]
    },
    // {
    //   type: 'textContent',
    //   title: 'Welcome to RC Imitation Jewellery',
    //   body: 'Browse our exclusive collection of premium imitation jewellery. We offer the best wholesale prices directly from manufacturers.'
    // }
  ]
};
