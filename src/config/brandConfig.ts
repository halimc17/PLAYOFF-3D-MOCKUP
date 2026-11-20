export interface BrandConfig {
  appName: string;
  taglineId: string;
  taglineEn: string;
  producerName: string;
  whatsappNumber: string; // international format without '+' e.g. 6281234567890
  accentHex: string;
  fabricCatalog: Array<{
    id: string;
    label: string;
    descriptionId: string;
    descriptionEn: string;
  }>;
  quickColorPalette: string[];
  sportFonts: Array<{
    id: string;
    label: string;
    family: string;
  }>;
}

/**
 * White-Label Configuration
 * Edit this single file to rebrand the application, change WhatsApp contact,
 * or customize available fabrics and color presets for your jersey factory.
 */
export const brandConfig: BrandConfig = {
  appName: 'KitForge 3D',
  taglineId: 'Studio Desain Jersey Olahraga 3D',
  taglineEn: '3D Sportswear Jersey Design Studio',
  producerName: 'KitForge Apparel Production',
  whatsappNumber: '6281234567890',
  accentHex: '#10b981',
  fabricCatalog: [
    {
      id: 'milano',
      label: 'Dry-Fit Milano (Zigzag)',
      descriptionId: 'Ringan, cepat kering, tekstur zigzag premium untuk sepak bola & futsal',
      descriptionEn: 'Lightweight, fast-dry zigzag texture for football & futsal',
    },
    {
      id: 'brazil',
      label: 'Dry-Fit Brazil (Bintik / Jarum)',
      descriptionId: 'Sirkulasi udara tinggi dengan pori bintik halus, cocok untuk futsal & voli',
      descriptionEn: 'High airflow micro-dot mesh, ideal for futsal & volleyball',
    },
    {
      id: 'serena',
      label: 'Dry-Fit Serena (Halus)',
      descriptionId: 'Permukaan lembut, elastis, dan warna sublimasi sangat tajam',
      descriptionEn: 'Smooth, elastic surface with crisp sublimation output',
    },
    {
      id: 'benzema',
      label: 'Dry-Fit Benzema (Hexagon)',
      descriptionId: 'Tekstur heksagonal sporty, kuat dan nyaman di intensitas tinggi',
      descriptionEn: 'Sporty hexagonal knit, durable under high-intensity play',
    },
  ],
  quickColorPalette: [
    '#0f172a', // Deep Navy Slate
    '#111827', // Charcoal Black
    '#ffffff', // Pure White
    '#dc2626', // Crimson Red
    '#ea580c', // Blaze Orange
    '#f59e0b', // Gold Amber
    '#facc15', // Electric Yellow
    '#16a34a', // Pitch Green
    '#059669', // Emerald
    '#0d9488', // Teal
    '#0284c7', // Sky Blue
    '#1d4ed8', // Royal Blue
    '#1e3a8a', // Club Navy
    '#7c3aed', // Royal Purple
    '#be123c', // Maroon
    '#64748b', // Steel Grey
  ],
  sportFonts: [
    { id: 'anton', label: 'Anton (Bold Athletic)', family: 'Anton, sans-serif' },
    { id: 'bebas', label: 'Bebas Neue (Tall Kit)', family: '"Bebas Neue", sans-serif' },
    { id: 'oswald', label: 'Oswald (Pro League)', family: 'Oswald, sans-serif' },
    { id: 'teko', label: 'Teko (Modern Sport)', family: 'Teko, sans-serif' },
    { id: 'barlow', label: 'Barlow Condensed', family: '"Barlow Condensed", sans-serif' },
    { id: 'rajdhani', label: 'Rajdhani (Tech / Volley)', family: 'Rajdhani, sans-serif' },
    { id: 'montserrat', label: 'Montserrat ExtraBold', family: 'Montserrat, sans-serif' },
  ],
};
