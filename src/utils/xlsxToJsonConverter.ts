import * as xlsx from 'xlsx';

export const LUMINAIRE_KEYS = [
  "product_manager",
  "project_manager",
  "product_type",
  "series_name",
  "zone",
  "customer",
  "data_status",
  "customer_model_no_old",
  "customer_model_no_new",
  "yk_product_code",
  "yk_model_no",
  "option_code",
  "description",
  "gn",
  "rated_voltage_v",
  "frequency_hz",
  "input_current_ma",
  "on_mode_power_w",
  "total_luminous_flux_lm",
  "useful_luminous_flux_lm",
  "total_mains_efficacy_lmw",
  "cct_k",
  "ra",
  "cri_lower_80",
  "colour_consistency",
  "maximum_intensity_cd",
  "beam_angle",
  "cutoff_angle",
  "ugr",
  "dimmable",
  "dimming_type",
  "dimming_range",
  "power_factor",
  "displacement_factor",
  "flickering",
  "flicker_metric",
  "svm",
  "function",
  "remote_distance",
  "features",
  "norminal_life_h",
  "temperature_of_ambient",
  "operating_temperature",
  "switching_Cycles",
  "diameter_mm",
  "length_mm",
  "width_mm",
  "height_mm",
  "recessed_cut_out_mm",
  "net_weight_g",
  "shape",
  "fitting_colour",
  "housing_material",
  "diffuser_material",
  "protection_class",
  "ip",
  "ik",
  "standards",
  "glow_wire",
  "photobiological_risk_group",
  "mounting",
  "covered_by_thermal_material",
  "type_terminal block",
  "type_input_cable",
  "internal_wire",
  "cable_flex_plug",
  "standard_accessories",
  "optional_accessories",
  "packaging",
  "specific_thermal_management",
  "mercury_content_mg",
  "dc_input_compatable",
  "launch_time",
  "replacable_light_source",
  "removable_light_source",
  "replaceble_control_gear",
  "removable_control_gear",
  "model_identifier",
  "norminal_life_l70b50_h",
  "light_source",
  "lighting_tech",
  "mains_non_mains",
  "directional_non_directional",
  "cap_type",
  "light_output_within_a_solid",
  "connected_light_source",
  "colour_tuneable_light_source",
  "high_luminance_light_source",
  "luminance_hlls",
  "envelope",
  "anti_glare_shield",
  "light_source_dimmable",
  "energy_consumption_on_mode",
  "energy_efficiency_class",
  "light_source_useful_luminous_flux_lm",
  "beam_angle_correspondence",
  "light_source_rated_voltage_v",
  "light_source_input_current_ma",
  "light_source_on_mode_power_w",
  "light_source_standby_power_w",
  "light_source_networked_standby_power_w",
  "light_source_outer_dimensions_high_mm",
  "light_source_outer_dimensions_width_mm",
  "light_source_outer_dimensions_depth_mm",
  "claim_equivalent_power",
  "equivalent_power_w",
  "chromaticity_coordinates_x",
  "chromaticity_coordinates_y",
  "dls_peak_luminous_intensity_cd",
  "dls_beam_angle",
  "claim_fluorescent_light_replacement",
  "replacement_claim_w",
  "r9_cri_value",
  "survival_factor",
  "lumen_maintanance_factor_3600h",
  "excitation_purity_ctls",
  "led_light_source_distributor_brand",
  "led_light_source_model_number",
  "led_light_source_phsophor",
  "led_light_source_led_chip",
  "led_light_source_led_package",
  "led_light_source_type_size",
  "qty_led_chip",
  "driver_type",
  "driver_model",
  "scg_max_output_power",
  "scg_efficiency_full_load",
  "scg_no_load_power",
  "scg_standby_power",
  "scg_networked_standby_power",
  "scg_outer_dimensions_height_mm",
  "scg_outer_dimensions_width_mm",
  "scg_outer_dimensions_depth_mm",
  "scg_mass_g",
  "scg_standards_compliance",
  "max_power_w",
  "max_no_lum",
  "inrush_current_a",
  "inrush_current_duration_uS",
  "mcb_b10",
  "mcb_b16",
  "mcb_c10",
  "mcb_c16",
  "thd",
  "output_votage_fixture_v",
  "output_current_fixture_ma",
  "surge_voltage_l_n_v",
  "surge_voltage_ln_g_v",
  "luminaire_category",
  "lamp_source",
  "type_emergency_light_operation",
  "emergency_power",
  "emergency_battery_type",
  "emergency_battery_capacity",
  "emergency_duration_discharge",
  "emergency_charging_time",
  "type_emergency_operation_test",
  "integrated_test_switch",
  "lumen_output_emergency_mode",
  "emergency_optics",
  "exit_viewing_distance",
  "remark",
  "performa_essentials",
  "suitable_ceiling_depth_mm",
  "master_slave",
  "qty_slave_connection",
  "lamp_holder_type",
  "Art_Nr"
];

export function cleanValue(val: any, key: string): any {
  if (val === undefined || val === null) return null;
  
  const strVal = String(val).trim();
  
  // Clean empty strings / null strings / N/As
  const lowerVal = strVal.toLowerCase();
  if (lowerVal === '' || lowerVal === 'n/a' || lowerVal === 'na' || lowerVal === 'null' || lowerVal === 'undefined') {
    return null;
  }
  
  // IP rating specific validation and cleanup
  if (key === 'ip') {
    if (strVal.length > 25 || lowerVal.includes('shape:') || lowerVal.includes('housing') || lowerVal.includes('bunker') || lowerVal.includes('ceiling light')) {
      return null;
    }
    const parts = strVal.split(/[\/,;]/).map(p => p.trim()).filter(Boolean);
    const normalizedParts = parts.map(p => /^ip\d+/i.test(p) ? p.toUpperCase() : p);
    const unique = Array.from(new Set(normalizedParts));
    if (unique.length === 0) return null;
    return unique.length === 1 ? unique[0] : unique.join('/');
  }

  // List of fields that MUST be numbers in the target JSON schema
  const numericFields = new Set([
    "input_current_ma",
    "cct_k",
    "ra",
    "colour_consistency",
    "maximum_intensity_cd",
    "beam_angle",
    "cutoff_angle",
    "ugr",
    "power_factor",
    "displacement_factor",
    "flicker_metric",
    "svm",
    "temperature_of_ambient",
    "switching_Cycles",
    "diameter_mm",
    "length_mm",
    "width_mm",
    "height_mm",
    "recessed_cut_out_mm",
    "net_weight_g",
    "ik",
    "glow_wire",
    "norminal_life_l70b50_h",
    "energy_consumption_on_mode",
    "light_source_useful_luminous_flux_lm",
    "light_source_input_current_ma",
    "light_source_on_mode_power_w",
    "light_source_standby_power_w",
    "light_source_networked_standby_power_w",
    "light_source_outer_dimensions_high_mm",
    "light_source_outer_dimensions_width_mm",
    "light_source_outer_dimensions_depth_mm",
    "equivalent_power_w",
    "chromaticity_coordinates_x",
    "chromaticity_coordinates_y",
    "dls_peak_luminous_intensity_cd",
    "dls_beam_angle",
    "replacement_claim_w",
    "r9_cri_value",
    "survival_factor",
    "lumen_maintanance_factor_3600h",
    "qty_led_chip",
    "scg_max_output_power",
    "scg_efficiency_full_load",
    "scg_standby_power",
    "scg_networked_standby_power",
    "scg_outer_dimensions_height_mm",
    "scg_outer_dimensions_width_mm",
    "scg_outer_dimensions_depth_mm",
    "scg_mass_g",
    "max_power_w",
    "max_no_lum",
    "inrush_current_a",
    "inrush_current_duration_uS",
    "mcb_b10",
    "mcb_b16",
    "mcb_c10",
    "mcb_c16",
    "thd",
    "output_current_fixture_ma",
    "surge_voltage_l_n_v",
    "surge_voltage_ln_g_v",
    "emergency_power",
    "lumen_output_emergency_mode",
    "exit_viewing_distance",
    "suitable_ceiling_depth_mm",
    "qty_slave_connection"
  ]);

  if (numericFields.has(key)) {
    if (typeof val === 'number') return val;
    
    // Attempt parsing float/int after stripping symbols
    const cleanedNumStr = strVal.replace(/[^\d.-]/g, '');
    const parsed = Number(cleanedNumStr);
    if (!isNaN(parsed) && cleanedNumStr !== '') {
      return parsed;
    }
  }
  
  // Format Date for GN and Launch Time columns
  if (key === 'gn' || key === 'launch_time') {
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }
  }

  // General clean-up for string values (trim leading/trailing spaces)
  return typeof val === 'string' ? val.trim() : val;
}

export function findHeadersRowIndex(rawRows: any[][]): number {
  const candidates = [
    'model number', 'model_number', 'customer model no', 'product code', 'mm code',
    'series', 'category', 'power', 'wattage', 'voltage', 'description'
  ];
  
  let bestRowIdx = 1; // Default to index 1 (original behavior)
  let maxMatches = -1;
  
  // Search the first 4 rows to find the one with the most header matches
  const searchLimit = Math.min(4, rawRows.length);
  for (let r = 0; r < searchLimit; r++) {
    const row = rawRows[r];
    if (!row) continue;
    let matches = 0;
    for (const val of row) {
      if (!val) continue;
      const cleanVal = String(val).toLowerCase();
      if (candidates.some(cand => cleanVal.includes(cand))) {
        matches++;
      }
    }
    if (matches > maxMatches && matches > 0) {
      maxMatches = matches;
      bestRowIdx = r;
    }
  }
  
  return bestRowIdx;
}

export const COLUMN_SYNONYMS: Record<string, string[]> = {
  product_type: ['product type', 'category1', 'category2', 'category', '产品类型'],
  series_name: ['series name', 'series', 'family', '系列名'],
  customer: ['customer', '客户'],
  customer_model_no_old: ['customer model no.(old)', 'customer model no old', 'old model no', 'old model number'],
  customer_model_no_new: ['customer model no.  (new erp)', 'customer model no. (new)', 'customer model no new', 'new erp model no', 'new erp model number', 'model number', 'model_number'],
  yk_product_code: ['yk product code', 'yk product_code', 'yk code', 'product code'],
  yk_model_no: ['yk model no', 'yk model_no', 'yk model', 'factory model', '工厂型号'],
  description: ['description', 'desc', '描述'],
  rated_voltage_v: ['rated voltage', 'input voltage', 'voltage', 'voltage map', '额定电压'],
  frequency_hz: ['frequency', '频率'],
  input_current_ma: ['input current', 'current', '输入电流'],
  on_mode_power_w: ['on-mode power', 'on mode power', 'power', 'wattage', 'watt', '工作功率'],
  total_luminous_flux_lm: ['total luminous flux', 'luminous flux', 'lumen', 'useful luminous flux', '光通量'],
  cct_k: ['correlated colour temperature', 'colour temperature', 'color temp', 'cct', '色温'],
  ra: ['colour rendering index', 'cri', 'ra'],
  beam_angle: ['beam angle', 'beam', '光束角'],
  dimmable: ['dimmable', 'dim'],
  dimming_type: ['dimming type', 'dimming_type', 'dimming'],
  power_factor: ['power factor', 'pf'],
  diameter_mm: ['diameter', 'width', 'diameter_mm'],
  height_mm: ['height', 'height_mm'],
  width_mm: ['width', 'width_mm'],
  shape: ['shape', '形状'],
  housing_material: ['housing material', 'material', '外壳材质'],
  diffuser_material: ['diffuser material', 'cover material', 'diffuser', 'cover finish', '透光罩材质'],
  ip: ['ip rating', 'ip_rating', 'ipxx', '防护等级', 'ip'],
  driver_model: ['driver model', 'driver_model', 'scg_driver_model_no', 'control gear model no', 'control gear model'],
  scg_max_output_power: ['maximum output power', 'max output power', 'scg_max_output_power', 'maximum output power (w)'],
  scg_efficiency_full_load: ['efficiency in full-load', 'efficiency in full load', 'efficiency full load', 'scg_efficiency_full_load'],
  scg_no_load_power: ['no-load power (pno)', 'no-load power', 'no load power (pno)', 'no load power', 'pno', 'scg_no_load_power'],
  scg_standby_power: ['standby power (psb)', 'standby power', 'psb', 'scg_standby_power'],
  scg_networked_standby_power: ['networked standby power (pnet)', 'networked standby power', 'pnet', 'scg_networked_standby_power'],
  scg_outer_dimensions_height_mm: ['scg height', 'scg_outer_dimensions_height_mm', 'outer dimensions height'],
  scg_outer_dimensions_width_mm: ['scg width', 'scg_outer_dimensions_width_mm', 'outer dimensions width'],
  scg_outer_dimensions_depth_mm: ['scg depth', 'scg_outer_dimensions_depth_mm', 'outer dimensions depth'],
  scg_mass_g: ['mass in grams', 'mass (g)', 'mass in gram', 'scg_mass_g'],
  scg_standards_compliance: ['standards compliance', 'standards_compliance', 'scg_standards_compliance'],
  output_votage_fixture_v: ['output voltage', 'output voltage (v)', 'output voltage fixture', 'output_votage_fixture_v', 'output_voltage'],
  output_current_fixture_ma: ['output current', 'output current (ma)', 'output current fixture', 'output_current_fixture_ma', 'output_current'],
};

export async function processXlsxToJson(xlsxBuffer: Buffer): Promise<any[]> {
  let workbook: any;
  try {
    workbook = xlsx.read(xlsxBuffer, { type: 'buffer' });
  } catch (error: any) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Spreadsheet does not contain any sheets.');
  }

  const sheet = workbook.Sheets[sheetName];
  // Parse rows as raw matrix (array of arrays)
  const rawRows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  if (rawRows.length < 5) {
    throw new Error('Spreadsheet structure invalid. Expected at least 4 header rows and 1 data row.');
  }

  // Detect header row dynamically
  const headersRowIdx = findHeadersRowIndex(rawRows);
  const rawHeaders = rawRows[headersRowIdx] || [];
  const headers: string[] = [];
  for (let i = 0; i < rawHeaders.length; i++) {
    headers.push(String(rawHeaders[i] || '').trim().toLowerCase());
  }

  // Dynamically map LUMINAIRE_KEYS to sheet columns
  const keyToExcelIndexMap = new Map<string, number>();
  for (let i = 0; i < LUMINAIRE_KEYS.length; i++) {
    const key = LUMINAIRE_KEYS[i];

    let matchedIndex = -1;
    const synonyms = COLUMN_SYNONYMS[key] || [];
    
    // 1. Try exact matches on synonyms first
    for (const syn of synonyms) {
      matchedIndex = headers.findIndex(h => h === syn);
      if (matchedIndex !== -1) break;
    }
    
    // 2. Try regex or includes matches on synonyms if no exact match found
    if (matchedIndex === -1) {
      for (const syn of synonyms) {
        if (syn === 'ip') {
          // Avoid matching "description" for short key "ip"
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

    // 3. Fallback to clean key (e.g. replace underscore with space)
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

  // Row 4 (index 4) onwards contain product data rows
  const dataRows = rawRows.slice(4);
  const convertedList: any[] = [];

  const idxModelNew = keyToExcelIndexMap.get('customer_model_no_new') ?? -1;
  const idxModelYk = keyToExcelIndexMap.get('yk_model_no') ?? -1;

  for (const row of dataRows) {
    if (row.length === 0) continue;
    
    // Check if the row contains a valid Model Name SKU
    const modelNew = idxModelNew !== -1 ? row[idxModelNew] : null;
    const modelYk = idxModelYk !== -1 ? row[idxModelYk] : null;
    if (!modelNew && !modelYk) continue;

    const obj: any = {};
    for (let i = 0; i < LUMINAIRE_KEYS.length; i++) {
      const key = LUMINAIRE_KEYS[i];
      const excelIndex = keyToExcelIndexMap.get(key) ?? -1;
      
      const rawVal = excelIndex !== -1 ? row[excelIndex] : null;
      obj[key] = cleanValue(rawVal, key);
    }
    
    convertedList.push(obj);
  }

  return convertedList;
}
