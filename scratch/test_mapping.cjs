const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Let's import or recreate the exact logic from xlsxToJsonConverter.ts
const { LUMINAIRE_KEYS, COLUMN_SYNONYMS, findHeadersRowIndex, cleanValue } = require('./xlsx_sim.cjs');

async function testFile(filename) {
  const filePath = path.resolve(filename);
  if (!fs.existsSync(filePath)) return;
  console.log('\n================ Testing:', filename, '================');
  const buffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const headersRowIdx = findHeadersRowIndex(rawRows);
  console.log('Detected headersRowIdx:', headersRowIdx);

  const rawHeaders = rawRows[headersRowIdx] || [];
  const headers = rawHeaders.map(h => String(h || '').trim().toLowerCase());

  console.log('--- Checking Column Mappings for target columns & all LUMINAIRE_KEYS ---');
  
  // Check how keys map
  const keyToExcelIndexMap = new Map();
  for (let i = 0; i < LUMINAIRE_KEYS.length; i++) {
    const key = LUMINAIRE_KEYS[i];
    let matchedIndex = -1;
    const synonyms = COLUMN_SYNONYMS[key] || [];

    for (const syn of synonyms) {
      matchedIndex = headers.findIndex(h => h === syn);
      if (matchedIndex !== -1) break;
    }
    if (matchedIndex === -1) {
      for (const syn of synonyms) {
        if (syn === 'ip') {
          matchedIndex = headers.findIndex(h => /\bip\b/i.test(h) || h === 'ipxx');
        } else if (syn.length <= 3) {
          const reg = new RegExp(`\\b${syn}\\b`, 'i');
          matchedIndex = headers.findIndex(h => reg.test(h));
        } else {
          matchedIndex = headers.findIndex(h => h.includes(syn));
        }
        if (matchedIndex !== -1) break;
      }
    }
    if (matchedIndex === -1) {
      const cleanKey = key.replace(/_/g, ' ');
      if (key === 'ip') {
        matchedIndex = headers.findIndex(h => /\bip\b/i.test(h));
      } else {
        matchedIndex = headers.findIndex(h => h === cleanKey || h.includes(cleanKey));
      }
    }
    keyToExcelIndexMap.set(key, matchedIndex);
  }

  function colToIdx(col) {
    let idx = 0;
    for (let i = 0; i < col.length; i++) {
      idx = idx * 26 + (col.toUpperCase().charCodeAt(i) - 64);
    }
    return idx - 1;
  }

  function idxToCol(idx) {
    let temp = '';
    let i = idx;
    while (i >= 0) {
      temp = String.fromCharCode((i % 26) + 65) + temp;
      i = Math.floor(i / 26) - 1;
    }
    return temp;
  }

  const targetCols = ['CO', 'CQ', 'CU', 'CV', 'CX', 'CY', 'CZ', 'DI'];
  console.log('\nTarget columns analysis:');
  for (const c of targetCols) {
    const colIdx = colToIdx(c);
    const headerAtCol = rawHeaders[colIdx];
    // Find if any LUMINAIRE_KEYS mapped to this column
    const mappedKeys = [];
    for (const [k, idx] of keyToExcelIndexMap.entries()) {
      if (idx === colIdx) {
        mappedKeys.push(k);
      }
    }
    console.log(`Col ${c} (idx ${colIdx}): header="${headerAtCol}" => mapped to key: [${mappedKeys.join(', ')}]`);
  }

  console.log('\nChecking all LUMINAIRE_KEYS mapped vs unmapped:');
  for (const key of LUMINAIRE_KEYS) {
    const idx = keyToExcelIndexMap.get(key);
    if (idx === -1) {
      console.log(`[UNMAPPED] ${key}`);
    } else {
      const colLetter = idxToCol(idx);
      // If idx is one of target or anything
      // console.log(`[MAPPED] ${key} -> Col ${colLetter} (idx ${idx}): "${rawHeaders[idx]}"`);
    }
  }
}

// Let's create xlsx_sim.cjs first
