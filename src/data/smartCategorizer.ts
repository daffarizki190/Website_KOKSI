/**
 * Smart Product Categorizer
 * Analyzes product names to determine the correct category and sub-category
 * using brand names, product type keywords, and common Indonesian product descriptors.
 */

import { CATEGORY_STRUCTURES } from './categories';

// ============================================================
// KEYWORD → SUB-CATEGORY MAPPING
// Each entry maps product name keywords to a specific sub-category.
// The parent category is auto-resolved from CATEGORY_STRUCTURES.
// ============================================================

interface KeywordRule {
  subCategory: string;
  /** Keywords to match in the product name (lowercase). Matches if ANY keyword is found. */
  keywords: string[];
  /** Brand names specific to this sub-category (lowercase). */
  brands: string[];
}

const KEYWORD_RULES: KeywordRule[] = [
  // ===== Makanan & Minuman Siap Saji (F&B) =====
  {
    subCategory: 'Minuman Dingin & Kemasan',
    keywords: [
      'air mineral', 'teh botol', 'teh kotak', 'teh pucuk', 'teh gelas',
      'jus', 'juice', 'susu uht', 'isotonik', 'minuman', 'soda',
      'cola', 'fanta', 'sprite', 'kopi botol', 'kopi kaleng', 'kopi sachet',
      'cappuccino', 'latte', 'energi drink', 'energy drink',
      'es teh', 'sirup', 'nectar', 'yakult', 'cimory',
      'botol', 'kaleng', 'gelas', 'pouch'
    ],
    brands: [
      'aqua', 'le minerale', 'pristine', 'ades', 'vit', 'club', 'cleo',
      'coca cola', 'coca-cola', 'pepsi', 'fanta', 'sprite', '7up',
      'pocari', 'pocari sweat', 'mizone', 'hydro coco',
      'tehbotol', 'teh botol sosro', 'teh pucuk', 'teh javana', 'teh kotak', 'fruit tea',
      'ultra milk', 'ultra', 'diamond', 'greenfields',
      'nescafe', 'kopiko', 'good day', 'kapal api', 'torabika', 'abc',
      'floridina', 'pulpy orange', 'minute maid', 'buavita',
      'bear brand', 'cap kaki tiga', 'larutan', 'adem sari',
      'kratingdaeng', 'extra joss', 'm-150', 'you c 1000', 'kukubima',
      'cimory', 'yakult', 'milkuat', 'milku'
    ]
  },
  {
    subCategory: 'Makanan Ringan (Snacks)',
    keywords: [
      'keripik', 'chips', 'snack', 'biskuit', 'wafer', 'kacang',
      'crackers', 'kraker', 'cracker', 'cookies', 'kukis',
      'roti', 'bread', 'cake', 'kue', 'donat',
      'popcorn', 'corn', 'jagung', 'stick', 'stik',
      'makaroni', 'seblak kering', 'basreng',
      'kerupuk', 'emping'
    ],
    brands: [
      'chitato', 'lays', 'pringles', 'doritos', 'cheetos',
      'qtela', 'kusuka', 'taro', 'leo',
      'roma', 'biskuat', 'oreo', 'good time', 'monde', 'khong guan',
      'regal', 'hatari', 'better', 'astor',
      'tango', 'wafer', 'gery', 'tim tam',
      'dua kelinci', 'garuda', 'kacang atom', 'kacang bawang',
      'sari roti', 'mr bread', 'bakers',
      'oishi', 'jetz', 'potabee', 'twistko',
      'richeese', 'nabati', 'richoco', 'ahh',
      'sukro', 'komo', 'momogi', 'enaak'
    ]
  },
  {
    subCategory: 'Makanan Instan',
    keywords: [
      'mie instan', 'mi instan', 'mie goreng', 'mi goreng',
      'mie kuah', 'mi kuah', 'instant noodle', 'noodle',
      'bubur instan', 'bubur bayi', 'sereal',
      'sosis', 'sarden', 'kornet', 'sardines', 'corned',
      'nugget', 'bakso instan', 'abon'
    ],
    brands: [
      'indomie', 'mie sedaap', 'sarimi', 'supermi', 'pop mie',
      'nissin', 'cup noodle', 'samyang',
      'abc', 'gaga', 'mamee',
      'energen', 'milo', 'quaker',
      'pronas', 'fiesta', 'farmhouse', 'bernardi',
      'kobe', 'boncabe', 'so nice', 'kanzler', 'champ', 'so good'
    ]
  },
  {
    subCategory: 'Bahan Makanan (Sembako)',
    keywords: [
      'beras', 'gula', 'minyak goreng', 'tepung', 'garam',
      'kecap', 'saus', 'saos', 'sambal', 'cuka',
      'santan', 'kelapa', 'bumbu', 'rempah', 'merica', 'lada',
      'penyedap', 'kaldu', 'vetsin',
      'margarin', 'mentega', 'butter', 'selai', 'jam',
      'telur', 'tahu', 'tempe', 'oncom',
      'madu', 'meses', 'coklat bubuk', 'susu kental'
    ],
    brands: [
      'rose brand', 'sania', 'bimoli', 'filma', 'tropical', 'fortune',
      'gulaku', 'gula kristal',
      'segitiga biru', 'bogasari', 'cakra kembar',
      'abc', 'bango', 'sedaap', 'kikkoman',
      'indofood', 'heinz', 'del monte',
      'royco', 'masako', 'sajiku', 'kokita',
      'blue band', 'palmia', 'forvita',
      'morin', 'skippy', 'nutella', 'ceres',
      'frisian flag', 'indomilk', 'carnation', 'cap enaak'
    ]
  },
  {
    subCategory: 'Susu & Olahan Susu',
    keywords: [
      'susu bubuk', 'susu formula', 'susu pertumbuhan', 'susu anak',
      'susu ibu hamil', 'susu dewasa', 'susu segar',
      'keju', 'cheese', 'yogurt', 'yoghurt',
      'mentega', 'butter', 'margarin',
      'krim', 'cream', 'whipping', 'krimer',
      'susu evaporasi', 'susu cair'
    ],
    brands: [
      'dancow', 'bebelac', 'sgm', 'lactogrow', 'nutrilon',
      'pediasure', 'sustagen', 'ensure', 'entrasol', 'anlene', 'hilo',
      'kraft', 'cheddar', 'prochiz', 'belcube',
      'cimory yogurt', 'heavenly blush', 'biokul',
      'anchor', 'elle & vire', 'greenfields'
    ]
  },

  // ===== Perawatan Diri & Kesehatan (Personal Care) =====
  {
    subCategory: 'Perawatan Mandi & Rambut',
    keywords: [
      'sabun mandi', 'sabun batang', 'sabun cair', 'body wash',
      'shower', 'shampo', 'shampoo', 'sampo',
      'kondisioner', 'conditioner', 'hair',
      'pembersih wajah', 'facial wash', 'face wash', 'cleanser',
      'lulur', 'scrub body'
    ],
    brands: [
      'lifebuoy', 'lux', 'dettol', 'nuvo', 'giv', 'biore', 'dove',
      'pantene', 'sunsilk', 'head shoulders', 'head & shoulders', 'clear',
      'rejoice', 'tresemme', 'herbal essences', 'zinc',
      'garnier', 'pond', 'ponds', 'himalaya', 'cetaphil', 'senka',
      'nivea', 'vaseline'
    ]
  },
  {
    subCategory: 'Perawatan Gigi',
    keywords: [
      'pasta gigi', 'odol', 'toothpaste', 'tooth paste',
      'sikat gigi', 'toothbrush', 'tooth brush',
      'obat kumur', 'mouthwash', 'mouth wash'
    ],
    brands: [
      'pepsodent', 'ciptadent', 'close up', 'closeup', 'sensodyne',
      'formula', 'oral-b', 'oral b', 'colgate',
      'listerine', 'betadine mouthwash', 'total care'
    ]
  },
  {
    subCategory: 'Perawatan Kulit & Tubuh',
    keywords: [
      'body lotion', 'hand body', 'hand & body', 'handbody',
      'lotion', 'moisturizer', 'pelembab',
      'deodoran', 'deodorant', 'deo', 'antiperspirant',
      'parfum', 'perfume', 'cologne', 'minyak wangi', 'eau de',
      'sunscreen', 'sunblock', 'tabir surya', 'spf',
      'lip balm', 'lipbalm', 'lip care',
      'perawatan pria', 'after shave', 'aftershave', 'pomade', 'wax rambut',
      'cream', 'krim', 'serum', 'toner', 'skincare', 'skin care',
      'masker wajah', 'face mask', 'sheet mask'
    ],
    brands: [
      'vaseline', 'nivea', 'marina', 'citra', 'shinzui', 'scarlett',
      'rexona', 'axe', 'old spice', 'dove deo',
      'gatsby', 'brylcreem', 'viking',
      'garnier', 'wardah', 'emina', 'somethinc', 'skintific',
      'innisfree', 'laneige', 'whitelab', 'avoskin',
      'banana boat', 'skin aqua', 'biore uv'
    ]
  },
  {
    subCategory: 'Kebutuhan Wanita & Bayi',
    keywords: [
      'pembalut', 'sanitary', 'menstrual', 'pantyliner', 'panty liner',
      'popok', 'diaper', 'diapers', 'pampers',
      'tisu basah', 'wet tissue', 'wet wipes', 'baby wipes',
      'minyak telon', 'baby oil', 'baby cream', 'baby powder',
      'bedak bayi', 'sabun bayi', 'baby soap', 'baby bath',
      'baby lotion', 'baby shampoo'
    ],
    brands: [
      'charm', 'laurier', 'softex', 'kotex',
      'sweety', 'mamy poko', 'mamypoko', 'goon', 'merries', 'huggies', 'pampers',
      'mitu', 'cussons baby', 'zwitsal', 'pigeon', 'johnson',
      'my baby', 'kodomo', 'sleek baby', 'cradle'
    ]
  },
  {
    subCategory: 'Obat-obatan Bebas (OTC) & P3K',
    keywords: [
      'obat', 'tablet', 'kaplet', 'kapsul', 'pil',
      'paracetamol', 'ibuprofen', 'aspirin',
      'flu', 'batuk', 'pilek', 'demam', 'panas',
      'maag', 'diare', 'mencret', 'sembelit',
      'sakit kepala', 'pusing', 'nyeri', 'pegal',
      'minyak angin', 'balsem', 'koyo', 'plester',
      'perban', 'betadine', 'antiseptik', 'alkohol',
      'vitamin', 'suplemen', 'multivitamin',
      'p3k', 'obat luka', 'salep', 'krim luka',
      'masker medis', 'masker kesehatan', 'hand sanitizer'
    ],
    brands: [
      'panadol', 'bodrex', 'paramex', 'sanmol', 'tempra',
      'decolgen', 'neozep', 'mixagrip', 'ultraflu',
      'promag', 'mylanta', 'polycrol', 'polysilane',
      'tolak angin', 'antangin', 'bintang toedjoe', 'cap lang',
      'salonpas', 'counterpain', 'geliga', 'gpu',
      'betadine', 'hansaplast', 'nexcare',
      'enervon', 'redoxon', 'hemaviton', 'sakatonik', 'fatigon',
      'dettol antiseptic', 'softies'
    ]
  },

  // ===== Kebutuhan Rumah Tangga (Household) =====
  {
    subCategory: 'Pembersih Pakaian',
    keywords: [
      'deterjen', 'detergent', 'detergen', 'sabun cuci',
      'pelembut', 'pewangi', 'softener', 'pelicin',
      'pemutih', 'bleach', 'vanish',
      'penghilang noda', 'stain remover',
      'pewangi pakaian', 'fabric softener'
    ],
    brands: [
      'rinso', 'attack', 'daia', 'surf', 'so klin',
      'molto', 'downy', 'comfort', 'snuggle',
      'bayclin', 'vanish', 'wipol', 'proclin',
      'gentle gen', 'ariel', 'tide'
    ]
  },
  {
    subCategory: 'Pembersih Rumah',
    keywords: [
      'sabun cuci piring', 'pencuci piring', 'dishwash', 'dish wash',
      'pembersih lantai', 'floor cleaner', 'pel lantai',
      'pembersih kaca', 'glass cleaner',
      'pembersih toilet', 'toilet cleaner', 'closet cleaner',
      'pembersih serbaguna', 'all purpose cleaner',
      'disinfektan', 'desinfektan', 'disinfectant',
      'karbol', 'kreolin', 'lysol',
      'pembersih keramik', 'pembersih dapur', 'kitchen cleaner'
    ],
    brands: [
      'sunlight', 'mama lemon', 'mama lime', 'ekonomi',
      'super pell', 'superpell', 'so klin lantai', 'wipol',
      'mr muscle', 'vixal', 'hit', 'cling',
      'harpic', 'domestos', 'wpc',
      'sos', 'yuri', 'primo'
    ]
  },
  {
    subCategory: 'Perlengkapan Rumah',
    keywords: [
      'tisu', 'tissue', 'tisu wajah', 'tisu dapur', 'facial tissue',
      'tisu toilet', 'toilet paper', 'toilet roll',
      'tisu dapur', 'kitchen towel',
      'kantong plastik', 'plastic bag', 'kantong sampah', 'trash bag',
      'kantong kresek',
      'kamper', 'kapur barus', 'mothball', 'naphthalene',
      'pengharum ruangan', 'air freshener', 'pewangi ruangan',
      'lilin', 'candle'
    ],
    brands: [
      'paseo', 'tessa', 'nice', 'montiss',
      'kir', 'oxium', 'locomo', 'bagus',
      'swallow', 'dahlia', 'bagus naphthalene',
      'stella', 'bayfresh', 'glade', 'ambipur',
      'baygon', 'force magic'
    ]
  },
  {
    subCategory: 'Alat Kebersihan Dasar',
    keywords: [
      'spons', 'sponge', 'busa cuci',
      'sikat', 'brush', 'sikat lantai', 'sikat toilet', 'sikat wc',
      'kain lap', 'microfiber', 'mikrofiber', 'lap piring', 'serbet',
      'sapu', 'broom', 'pengki', 'dustpan', 'serokan',
      'pel', 'mop', 'tongkat pel',
      'ember', 'gayung', 'baskom',
      'sarung tangan', 'rubber gloves',
      'kemoceng', 'sulak'
    ],
    brands: [
      'scotch-brite', 'scotch brite', '3m',
      'lion star', 'nagoya', 'bagus sikat',
      'krisbow', 'ace hardware'
    ]
  },

  // ===== Rokok & Produk Kasir (Impulse Items) =====
  {
    subCategory: 'Rokok & Aksesori',
    keywords: [
      'rokok', 'cigarette', 'cigaret', 'batang', 'filter',
      'kretek', 'skt', 'skm', 'spm',
      'korek', 'lighter', 'korek api', 'gas lighter',
      'asbak', 'ashtray',
      'vape', 'pod', 'liquid', 'e-cigarette'
    ],
    brands: [
      'gudang garam', 'djarum', 'sampoerna', 'marlboro',
      'dunhill', 'lucky strike', 'la bold', 'la lights',
      'surya', 'dji sam soe', 'class mild',
      'magnum', 'esse', 'camel', 'winston',
      'cricket', 'tokai', 'bic lighter', 'zippo'
    ]
  },
  {
    subCategory: 'Permen & Cokelat Kecil',
    keywords: [
      'permen', 'candy', 'lollipop', 'lolipop',
      'cokelat', 'coklat', 'chocolate',
      'chewing gum', 'permen karet', 'bubble gum',
      'penyegar', 'mint', 'lozenges',
      'wafer bar', 'chocolate bar'
    ],
    brands: [
      'mentos', 'lotte', 'big babol', 'yosan',
      'fisherman', "fisherman's friend", 'tic tac',
      'frozz', 'relaxa', 'polo', 'kopiko candy',
      'silverqueen', 'silver queen', 'cadbury', 'kitkat', 'kit kat',
      'snickers', 'beng beng', 'delfi', 'toblerone',
      "fox's", 'foxs', 'kiss', 'sugus', 'nano nano',
      'ricola', 'halls', 'vicks'
    ]
  },
  {
    subCategory: 'Aksesori & Baterai',
    keywords: [
      'baterai', 'battery', 'batere',
      'kabel', 'cable', 'charger', 'charging',
      'earphone', 'headphone', 'headset', 'earbud',
      'usb', 'type-c', 'type c', 'micro usb', 'lightning',
      'adaptor', 'adapter', 'power bank', 'powerbank'
    ],
    brands: [
      'abc alkaline', 'abc biru', 'energizer', 'panasonic baterai',
      'robot', 'vivan', 'ugreen', 'anker', 'baseus', 'aukey',
      'jbl', 'realme buds', 'xiaomi', 'aker', 'remax'
    ]
  },

  // ===== Non-Food & Perlengkapan Umum =====
  {
    subCategory: 'Alat Tulis Kantor (ATK) Dasar',
    keywords: [
      'pulpen', 'pen', 'ballpoint', 'ball point', 'bolpen', 'bolpoin',
      'pensil', 'pencil', 'mekanik',
      'buku tulis', 'notebook', 'buku catatan',
      'amplop', 'envelope',
      'gunting', 'scissors', 'cutter',
      'isolasi', 'selotip', 'tape', 'lakban', 'duct tape', 'double tape',
      'penghapus', 'eraser', 'tipe-x', 'tipex', 'correction',
      'spidol', 'marker', 'highlighter', 'stabilo',
      'stapler', 'staples', 'paper clip', 'paperclip', 'binder clip',
      'lem', 'glue', 'lem kertas', 'lem tembak',
      'map', 'folder', 'ordner', 'clear holder',
      'kertas', 'paper', 'hvs', 'a4', 'folio', 'f4'
    ],
    brands: [
      'faster', 'standard', 'joyko', 'pilot', 'snowman', 'zebra',
      'faber-castell', 'faber castell', 'staedtler', 'kenko',
      'sidu', 'sinar dunia', 'kiky', 'mirage', 'big boss',
      'paperline', 'royal',
      'daimaru', 'nachi', '3m scotch', 'scotch magic',
      'bantex', 'bindex'
    ]
  },
  {
    subCategory: 'Perlengkapan Plastik & Dapur',
    keywords: [
      'sedotan', 'straw',
      'gelas plastik', 'cup plastik', 'plastic cup',
      'piring plastik', 'plate', 'paper plate',
      'mika', 'tray', 'food container', 'kotak makan',
      'plastic wrap', 'cling wrap', 'wrapping', 'stretch film',
      'aluminium foil', 'aluminum foil',
      'thinwall', 'mangkok plastik', 'bowl plastik',
      'sendok plastik', 'garpu plastik', 'cutlery',
      'tusuk gigi', 'toothpick', 'tusuk sate'
    ],
    brands: [
      'supertwin', 'starindo', 'sip',
      'total protect', 'best fresh', 'delkochoice', 'bagus wrap',
      'lion star', 'golden dragon'
    ]
  }
];

/**
 * Smart categorize a product by analyzing its name.
 * Returns the best matching { kategori, sub_kategori } or null if no match.
 */
export function smartCategorize(productName: string): { kategori: string; sub_kategori: string } | null {
  const nameLow = productName.toLowerCase();

  let bestMatch: { kategori: string; sub_kategori: string; score: number } | null = null;

  // Helper function to escape special characters for RegExp
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  for (const rule of KEYWORD_RULES) {
    let score = 0;

    // Check brand matches (higher weight — brands are very specific)
    for (const brand of rule.brands) {
      const regex = new RegExp(`\\b${escapeRegExp(brand)}\\b`, 'i');
      if (regex.test(nameLow)) {
        score += 10 + brand.length; // Longer brand = more specific = higher score
      }
    }

    // Check keyword matches
    for (const kw of rule.keywords) {
      const regex = new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i');
      if (regex.test(nameLow)) {
        score += 5 + kw.length;
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      // Resolve parent category from CATEGORY_STRUCTURES
      const parentCat = CATEGORY_STRUCTURES.find(c =>
        c.subCategories.some(sub => sub === rule.subCategory)
      );

      if (parentCat) {
        bestMatch = {
          kategori: parentCat.name,
          sub_kategori: rule.subCategory,
          score
        };
      }
    }
  }

  if (bestMatch) {
    return { kategori: bestMatch.kategori, sub_kategori: bestMatch.sub_kategori };
  }

  return null;
}
