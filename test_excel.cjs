const XLSX = require('xlsx');

// Create a dummy workbook that mimics the user's uploaded file
const wb = XLSX.utils.book_new();
const ws_data = [];

// Fill with some empty rows to simulate the top of the file
for (let i = 0; i < 20; i++) {
  ws_data.push([]);
}

// Row 24 (index 23)
ws_data.push([, , "Sunsilk renceng 12's", "Rp 10.000,00", "Rp 11.000,00", "12.000,00"]);
// Row 25
ws_data.push([, , "Pantene Shampoo Renceng", "Rp 10.000,00", "Rp 11.000,00", "12.000,00"]);
// Row 26
ws_data.push([3, "Kondisioner", "Pantene Conditioner Hair Fall Control 160 ml", "-", "-", "-"]);
// Row 27
ws_data.push([, , "Pantene Conditioner 3 Minute Miracle Hair Fall Control 150", "-", "-", "-"]);
// Row 28
ws_data.push([, , "Sunsilk Conditioner Soft & Smooth 160 ml", "Rp 18.680,00", "Rp 19.000,00", "20.000,00"]);

for(let i = 0; i < 10; i++) ws_data.push([]);

// Row 39 (index 38)
ws_data.push(["No", "Kategori Perawatan Mandi", "Nama Produk & Gramasi", "Harga"]);
ws_data.push(["", "Pepsodent Pencegah Gigi Berlubang 190 g", "Rp 16.380,00", "Rp 17.000,00", "18.000,00"]); // Wait, in screenshot, Pepsodent is in Col C!
// Let me look at screenshot again.
// Row 39: Col A: No, Col B: Kategori Perawatan Mandi, Col C: Nama Produk & Gramasi, Col D: Harga
// Row 40: Col A: empty, Col B: empty, Col C: Pepsodent Pencegah Gigi Berlubang 190 g, Col D: Rp 16.380,00, Col E: Rp 17.000,00, Col F: 18.000,00
ws_data.push([, , "Pepsodent Pencegah Gigi Berlubang 190 g", "Rp 16.380,00", "Rp 17.000,00", "18.000,00"]);


const ws = XLSX.utils.aoa_to_sheet(ws_data);
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

const matrixRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
const formattedProducts = [];

let currentCategory = 'Default';
let currentSubCategory = '';
let isKoksiFormat = false;

if (matrixRows && matrixRows.length > 0) {
    for (let r = 0; r < Math.min(50, matrixRows.length); r++) {
    const row = matrixRows[r];
    if (!Array.isArray(row)) continue;
    const rowStr = row.map(cell => String(cell || '').trim().toLowerCase());
    
    // Check for variation of "nama produk"
    if (rowStr.some(cell => cell.includes('nama produk & gramasi') || cell === 'nama produk & gramasi' || cell.includes('nama produk &'))) {
        isKoksiFormat = true;
        break;
    }
    }
}

console.log("Is KOKSI Format?", isKoksiFormat);

if (isKoksiFormat) {
    for (let r = 0; r < matrixRows.length; r++) {
    const row = matrixRows[r];
    if (!Array.isArray(row) || row.length === 0) continue;
    
    const colB = String(row[1] || '').trim();
    const colC = String(row[2] || '').trim();
    const colD = row[3]; // Harga dasar
    const colE = row[4]; // Harga jual anggota
    
    if (colB.toLowerCase().startsWith('kategori ')) {
        currentCategory = colB.replace(/kategori\s+/i, '').trim();
        currentSubCategory = '';
    } else if (colB && colB.toLowerCase() !== 'nama produk & gramasi' && colB.toLowerCase() !== 'kategori' && !colC) {
        currentSubCategory = colB;
    } else if (colB && colB.toLowerCase() !== 'nama produk & gramasi' && colB.toLowerCase() !== 'kategori') {
        currentSubCategory = colB;
    }
    
    if (colC && colC.toLowerCase() !== 'nama produk & gramasi' && colC.toLowerCase() !== 'nama produk') {
        const hargaRaw = colE !== undefined && colE !== null && String(colE).trim() !== '-' ? colE : colD;
        const hargaStr = String(hargaRaw || '0');
        const hargaNum = parseInt(hargaStr.replace(/[^0-9]/g, ''), 10) || 0;
        
        if (hargaNum > 0 || (colD && String(colD).trim() !== '-')) {
        formattedProducts.push({
            nama_barang: colC,
            kategori: currentCategory,
            sub_kategori: currentSubCategory,
            harga: hargaNum,
            stok: 0
        });
        }
    }
    }
}

console.log("Products found:", formattedProducts.length);
console.log(formattedProducts.slice(0, 2));

