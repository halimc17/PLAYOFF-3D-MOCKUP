import type { Language, PanelId, PatternType } from '../types/design';

export interface Dictionary {
  common: {
    undo: string;
    redo: string;
    reset: string;
    exportPack: string;
    importProject: string;
    saveJson: string;
    savedLocally: string;
    saving: string;
    activePanel: string;
    applyAllPanels: string;
    delete: string;
    duplicate: string;
    mirrorSleeve: string;
    center: string;
    close: string;
    cancel: string;
    confirmReset: string;
  };
  layouts: {
    split: string;
    view3d: string;
    view2d: string;
  };
  tabs: {
    modelColor: string;
    pattern: string;
    graphics: string;
    text: string;
    layers: string;
  };
  panels: Record<PanelId, string>;
  sports: {
    football: string;
    futsal: string;
    volleyball: string;
  };
  sleeves: {
    label: string;
    short: string;
    long: string;
  };
  collars: {
    label: string;
    'v-neck': string;
  };
  fabrics: {
    label: string;
    milano: string;
    mesh: string;
    smooth: string;
  };
  patterns: Record<PatternType, string>;
  controls: {
    sportCategory: string;
    panelColor: string;
    baseColor: string;
    patternStyle: string;
    patternPrimary: string;
    patternSecondary: string;
    patternScale: string;
    patternRotation: string;
    patternOpacity: string;
    applyPatternAll: string;
    uploadHint: string;
    uploadSubhint: string;
    uploadedLibrary: string;
    noAssets: string;
    addToPanel: string;
    placeOn3D: string;
    placeOn3DActive: string;
    placeOn3DHint: string;
    quickPresets: string;
    presetTeamName: string;
    presetBackName: string;
    presetBackNumber: string;
    presetChestNumber: string;
    textContent: string;
    fontFamily: string;
    fontSize: string;
    textColor: string;
    outlineColor: string;
    outlineWidth: string;
    letterSpacing: string;
    uppercase: string;
    addText: string;
    selectedLayer: string;
    opacity: string;
    rotation: string;
    flipH: string;
    flipV: string;
    bringForward: string;
    sendBackward: string;
    noLayers: string;
    safeZoneLabel: string;
    click3DHint: string;
    autoRotate: string;
    cameraPresets: {
      front: string;
      back: string;
      left: string;
      right: string;
      collar: string;
    };
  };
  exportModal: {
    title: string;
    subtitle: string;
    customerName: string;
    teamName: string;
    fabricChoice: string;
    quantity: string;
    notes: string;
    notesPlaceholder: string;
    includedFiles: string;
    downloadZip: string;
    downloadPdfOnly: string;
    sendWhatsApp: string;
    generating: string;
    readyHint: string;
  };
}

export const translations: Record<Language, Dictionary> = {
  id: {
    common: {
      undo: 'Urungkan',
      redo: 'Ulangi',
      reset: 'Reset',
      exportPack: 'Export Produksi',
      importProject: 'Buka .json',
      saveJson: 'Simpan .json',
      savedLocally: 'Tersimpan lokal',
      saving: 'Menyimpan...',
      activePanel: 'Panel Aktif',
      applyAllPanels: 'Terapkan ke Semua Panel',
      delete: 'Hapus',
      duplicate: 'Duplikat',
      mirrorSleeve: 'Cermin ke Lengan Sebelah',
      center: 'Rata Tengah',
      close: 'Tutup',
      cancel: 'Batal',
      confirmReset: 'Reset seluruh desain jersey ke pengaturan awal?',
    },
    layouts: {
      split: 'Split 2D + 3D',
      view3d: '3D Saja',
      view2d: 'Kanvas 2D',
    },
    tabs: {
      modelColor: 'Model & Warna',
      pattern: 'Motif',
      graphics: 'Upload Grafis',
      text: 'Teks & Nomor',
      layers: 'Layer',
    },
    panels: {
      front: 'Badan Depan',
      back: 'Badan Belakang',
      leftSleeve: 'Lengan Kiri',
      rightSleeve: 'Lengan Kanan',
      collar: 'Kerah',
      cuffs: 'Rib / List',
    },
    sports: {
      football: 'Sepak Bola',
      futsal: 'Futsal',
      volleyball: 'Bola Voli',
    },
    sleeves: {
      label: 'Panjang Lengan',
      short: 'Lengan Pendek',
      long: 'Lengan Panjang',
    },
    collars: {
      label: 'Model Kerah',
      'v-neck': 'V-Neck',
    },
    fabrics: {
      label: 'Tekstur Kain 3D',
      milano: 'Dry-Fit Milano',
      mesh: 'Mesh / Bintik',
      smooth: 'Serena Halus',
    },
    patterns: {
      solid: 'Polos',
      'vertical-stripes': 'Garis Vertikal',
      'horizontal-hoops': 'Garis Horizontal',
      'diagonal-sash': 'Selempang Diagonal',
      chevron: 'Chevron V',
      gradient: 'Gradasi Halus',
      'geometric-hex': 'Geometris Hex',
      'half-split': 'Belah Tengah',
      pinstripes: 'Pinstripe Tipis',
      'lightning-wave': 'Aksen Dinamis',
    },
    controls: {
      sportCategory: 'Cabang Olahraga',
      panelColor: 'Pilih Bagian & Warna',
      baseColor: 'Warna Dasar Panel',
      patternStyle: 'Preset Pola / Motif',
      patternPrimary: 'Warna Motif 1',
      patternSecondary: 'Warna Motif 2',
      patternScale: 'Skala Pola',
      patternRotation: 'Sudut Rotasi',
      patternOpacity: 'Opasitas Motif',
      applyPatternAll: 'Terapkan Motif ke Badan & Lengan',
      uploadHint: 'Tarik & lepas file grafis atau klik untuk upload',
      uploadSubhint: 'Mendukung PNG (transparan), JPG, dan SVG resolusi tinggi',
      uploadedLibrary: 'Pustaka Grafis',
      noAssets: 'Belum ada file grafis yang diupload.',
      addToPanel: 'Pasang',
      placeOn3D: 'Taruh di 3D',
      placeOn3DActive: 'Klik permukaan jersey 3D...',
      placeOn3DHint: 'Klik titik mana pun di model 3D untuk memindahkan objek aktif ke titik tersebut.',
      quickPresets: 'Tambah Cepat',
      presetTeamName: 'Nama Tim',
      presetBackName: 'Nama Punggung',
      presetBackNumber: 'Nomor Punggung',
      presetChestNumber: 'Nomor Dada',
      textContent: 'Isi Teks',
      fontFamily: 'Jenis Font',
      fontSize: 'Ukuran Font',
      textColor: 'Warna Isi',
      outlineColor: 'Warna Garis Luar',
      outlineWidth: 'Tebal Garis Luar',
      letterSpacing: 'Jarak Huruf',
      uppercase: 'Huruf Kapital',
      addText: 'Tambah Teks',
      selectedLayer: 'Properti Objek Terpilih',
      opacity: 'Opasitas',
      rotation: 'Rotasi',
      flipH: 'Balik Horizontal',
      flipV: 'Balik Vertikal',
      bringForward: 'Naikkan Layer',
      sendBackward: 'Turunkan Layer',
      noLayers: 'Belum ada logo atau teks pada panel ini.',
      safeZoneLabel: 'Area Aman Cetak',
      click3DHint: 'Klik bagian jersey 3D untuk memilih panel',
      autoRotate: 'Putar 360°',
      cameraPresets: {
        front: 'Depan',
        back: 'Belakang',
        left: 'Kiri',
        right: 'Kanan',
        collar: 'Kerah',
      },
    },
    exportModal: {
      title: 'Export Paket Siap Produksi',
      subtitle: 'Lengkapi catatan singkat agar produsen dapat memproses desain Anda tanpa salah paham.',
      customerName: 'Nama Pemesan / PIC',
      teamName: 'Nama Tim / Klub',
      fabricChoice: 'Pilihan Bahan Kain Produksi',
      quantity: 'Estimasi Jumlah (pcs)',
      notes: 'Catatan Khusus Produsen',
      notesPlaceholder: 'Contoh: Jahitan obras rantai, logo dada pakai polyflex / sublimasi penuh, butuh sample dulu...',
      includedFiles: 'Isi Paket Produksi (.zip): Tech Pack PDF (4 sudut 3D + kode warna + inventaris aset), Flat Texture 2048px per panel, File Logo Mentah Asli, dan File Proyek .jersey.json.',
      downloadZip: 'Download Paket Lengkap (.zip)',
      downloadPdfOnly: 'Download Tech Pack PDF',
      sendWhatsApp: 'Kirim Ringkasan ke WhatsApp',
      generating: 'Menyiapkan Render 3D & Paket Produksi...',
      readyHint: 'Tip: Setelah mengunduh file ZIP/PDF, klik tombol WhatsApp untuk mengirim ringkasan lalu lampirkan file tersebut.',
    },
  },
  en: {
    common: {
      undo: 'Undo',
      redo: 'Redo',
      reset: 'Reset',
      exportPack: 'Export Pack',
      importProject: 'Open .json',
      saveJson: 'Save .json',
      savedLocally: 'Saved locally',
      saving: 'Saving...',
      activePanel: 'Active Panel',
      applyAllPanels: 'Apply to All Panels',
      delete: 'Delete',
      duplicate: 'Duplicate',
      mirrorSleeve: 'Mirror to Other Sleeve',
      center: 'Center',
      close: 'Close',
      cancel: 'Cancel',
      confirmReset: 'Reset the entire jersey design back to defaults?',
    },
    layouts: {
      split: 'Split 2D + 3D',
      view3d: '3D Only',
      view2d: '2D Canvas',
    },
    tabs: {
      modelColor: 'Model & Color',
      pattern: 'Patterns',
      graphics: 'Upload Art',
      text: 'Text & Numbers',
      layers: 'Layers',
    },
    panels: {
      front: 'Front Body',
      back: 'Back Body',
      leftSleeve: 'Left Sleeve',
      rightSleeve: 'Right Sleeve',
      collar: 'Collar',
      cuffs: 'Cuffs / Trim',
    },
    sports: {
      football: 'Football',
      futsal: 'Futsal',
      volleyball: 'Volleyball',
    },
    sleeves: {
      label: 'Sleeve Length',
      short: 'Short Sleeve',
      long: 'Long Sleeve',
    },
    collars: {
      label: 'Collar Style',
      'v-neck': 'V-Neck',
    },
    fabrics: {
      label: '3D Fabric Texture',
      milano: 'Dry-Fit Milano',
      mesh: 'Micro Mesh',
      smooth: 'Smooth Knit',
    },
    patterns: {
      solid: 'Solid',
      'vertical-stripes': 'Vertical Stripes',
      'horizontal-hoops': 'Horizontal Hoops',
      'diagonal-sash': 'Diagonal Sash',
      chevron: 'Chevron V',
      gradient: 'Smooth Gradient',
      'geometric-hex': 'Geometric Hex',
      'half-split': 'Half & Half',
      pinstripes: 'Pinstripes',
      'lightning-wave': 'Dynamic Accent',
    },
    controls: {
      sportCategory: 'Sport Category',
      panelColor: 'Panel Selection & Color',
      baseColor: 'Panel Base Color',
      patternStyle: 'Pattern Presets',
      patternPrimary: 'Pattern Color 1',
      patternSecondary: 'Pattern Color 2',
      patternScale: 'Pattern Scale',
      patternRotation: 'Rotation Angle',
      patternOpacity: 'Pattern Opacity',
      applyPatternAll: 'Apply Pattern to Body & Sleeves',
      uploadHint: 'Drag & drop graphics or click to upload',
      uploadSubhint: 'Supports transparent PNG, JPG, and high-res SVG',
      uploadedLibrary: 'Graphic Library',
      noAssets: 'No graphics uploaded yet.',
      addToPanel: 'Place',
      placeOn3D: 'Place on 3D',
      placeOn3DActive: 'Click on the 3D jersey...',
      placeOn3DHint: 'Click any point on the 3D jersey to move the active object directly there.',
      quickPresets: 'Quick Presets',
      presetTeamName: 'Team Name',
      presetBackName: 'Back Name',
      presetBackNumber: 'Back Number',
      presetChestNumber: 'Chest Number',
      textContent: 'Text Content',
      fontFamily: 'Font Family',
      fontSize: 'Font Size',
      textColor: 'Fill Color',
      outlineColor: 'Outline Color',
      outlineWidth: 'Outline Width',
      letterSpacing: 'Letter Spacing',
      uppercase: 'Uppercase',
      addText: 'Add Text',
      selectedLayer: 'Selected Object Properties',
      opacity: 'Opacity',
      rotation: 'Rotation',
      flipH: 'Flip Horizontal',
      flipV: 'Flip Vertical',
      bringForward: 'Bring Forward',
      sendBackward: 'Send Backward',
      noLayers: 'No graphics or text on this panel yet.',
      safeZoneLabel: 'Safe Print Area',
      click3DHint: 'Click any 3D jersey panel to select it',
      autoRotate: 'Auto-Rotate',
      cameraPresets: {
        front: 'Front',
        back: 'Back',
        left: 'Left',
        right: 'Right',
        collar: 'Collar',
      },
    },
    exportModal: {
      title: 'Export Production Pack',
      subtitle: 'Add a quick production brief so your manufacturer captures every detail accurately.',
      customerName: 'Contact / Customer Name',
      teamName: 'Team / Club Name',
      fabricChoice: 'Production Fabric Option',
      quantity: 'Estimated Qty (pcs)',
      notes: 'Special Production Notes',
      notesPlaceholder: 'Example: Full sublimation print, stitched crest patch, send pre-production proof...',
      includedFiles: 'Production Pack (.zip) includes: Tech Pack PDF (4-angle 3D renders + color codes + asset manifest), 2048px Flat Panel Textures, Original Uploaded Assets, and re-openable .jersey.json Project File.',
      downloadZip: 'Download Full Pack (.zip)',
      downloadPdfOnly: 'Download Tech Pack PDF',
      sendWhatsApp: 'Send Summary via WhatsApp',
      generating: 'Rendering 3D Angles & Packaging Production Files...',
      readyHint: 'Tip: Download the ZIP or PDF first, then click WhatsApp to send the summary and attach the file.',
    },
  },
};
