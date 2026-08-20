export interface EprelXmlOptions {
  product: any;
  eprelRegistrationNumber: string;
  onMarketStartDate: string;
  requestId?: string;
  operationId?: string | number;
}

function escapeXml(unsafe: any): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatBoolean(val: any, defaultVal = false): string {
  if (val === undefined || val === null || val === '') return defaultVal ? 'true' : 'false';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  const str = String(val).trim().toLowerCase();
  if (['true', 'yes', 'y', '1'].includes(str)) return 'true';
  if (['false', 'no', 'n', '0', '-', 'n/a'].includes(str)) return 'false';
  return defaultVal ? 'true' : 'false';
}

function formatDimmable(val: any): string {
  if (!val) return 'NO';
  const str = String(val).trim().toUpperCase();
  if (str.includes('NO') || str === 'N' || str === 'FALSE') return 'NO';
  if (str.includes('YES') || str === 'Y' || str === 'TRUE') return 'YES';
  return str;
}

function formatBeamAngleCorrespondence(val: any): string {
  if (!val) return 'SPHERE_360';
  const str = String(val).toUpperCase();
  if (str.includes('360') || str.includes('SPHERE')) return 'SPHERE_360';
  if (str.includes('120') || str.includes('WIDE')) return 'WIDE_CONE_120';
  if (str.includes('90') || str.includes('NARROW')) return 'NARROW_CONE_90';
  return 'SPHERE_360';
}

function formatMains(val: any): string {
  if (!val) return 'MLS';
  const str = String(val).toUpperCase();
  if (str.includes('NON') || str.includes('NMLS')) return 'NMLS';
  return 'MLS';
}

function formatDirectional(val: any): string {
  if (!val) return 'NDLS';
  const str = String(val).toUpperCase();
  if (str.includes('NON') || str.includes('NDLS')) return 'NDLS';
  if (str.includes('DIRECTIONAL') || str.includes('DLS')) return 'DLS';
  return 'NDLS';
}

function getMediaFilename(media: any, defaultFilename: string): string {
  if (!media) return defaultFilename;
  if (typeof media === 'string') {
    const parts = media.split(/[\/\\]/);
    return parts[parts.length - 1] || defaultFilename;
  }
  if (media.filename) return media.filename;
  if (media.url) {
    const parts = media.url.split(/[\/\\]/);
    return parts[parts.length - 1] || defaultFilename;
  }
  return defaultFilename;
}

function getColourTempFromCoordinates(xVal: any, yVal: any): string | null {
  const x = typeof xVal === 'number' ? xVal : parseFloat(String(xVal));
  const y = typeof yVal === 'number' ? yVal : parseFloat(String(yVal));

  // Determine CCT from X-Coordinate per revised specification table:
  // 0 -> Undefine
  // 0.30 - 0.32 -> 6500K
  // 0.33 - 0.35 -> 5000K
  // 0.36 - 0.39 (including 0.366, 0.37, 0.38) -> 4000K
  // 0.42 - 0.44 -> 3000K
  // 0.45 - 0.47 -> 2800K
  // > 0.47 -> Undefine
  let cctFromX: string | null = null;
  if (!isNaN(x) && x > 0) {
    if (x >= 0.295 && x <= 0.324) cctFromX = '6500K';
    else if (x >= 0.325 && x <= 0.354) cctFromX = '5000K';
    else if (x >= 0.355 && x <= 0.404) cctFromX = '4000K';
    else if (x >= 0.415 && x <= 0.444) cctFromX = '3000K';
    else if (x >= 0.445 && x <= 0.474) cctFromX = '2800K';
  }

  // Determine CCT from Y-Coordinate per revised specification table:
  // 0 -> Undefine
  // 0.32 - 0.34 -> 6500K
  // 0.35 - 0.36 -> 5000K
  // 0.367 - 0.38 (including 0.37, 0.38) -> 4000K
  // 0.39 - 0.40 -> 3000K
  // 0.41 - 0.42 -> 2800K
  // >= 0.43 -> Undefine
  let cctFromY: string | null = null;
  if (!isNaN(y) && y > 0) {
    if (y >= 0.315 && y <= 0.344) cctFromY = '6500K';
    else if (y >= 0.345 && y < 0.366) cctFromY = '5000K';
    else if (y >= 0.366 && y <= 0.384) cctFromY = '4000K';
    else if (y >= 0.385 && y <= 0.404) cctFromY = '3000K';
    else if (y >= 0.405 && y <= 0.424) cctFromY = '2800K';
  }

  return cctFromX || cctFromY || null;
}

export function getTechnicalDocumentFilename(type: 'light-source' | 'containing-product' | 'control-gear' | string, product: any): string {
  const specs = product?.specifications || {};
  const customerModel = String(specs.customer_model_no_new || specs.customer_model_no || product?.name || 'PRODUCT')
    .replace(/\//g, '-').replace(/[^a-zA-Z0-9_\-]/g, '_');
  const modelId = String(specs.model_identifier || specs.light_source_model_no || product?.name || 'MODEL_IDENTIFIER')
    .replace(/\//g, '-').replace(/[^a-zA-Z0-9_\-]/g, '_');
  const driverModel = String(specs.driver_model || specs.control_gear_model_no || 'DRIVER')
    .replace(/\//g, '-').replace(/[^a-zA-Z0-9_\-]/g, '_');

  if (type === 'control-gear') {
    return `${customerModel}_${driverModel}_CG_TD.pdf`;
  }
  if (type === 'containing-product') {
    return `${customerModel}_CP_TD.pdf`;
  }
  return `${customerModel}_${modelId}_LS_TD.pdf`;
}

export function getSpectrumFilename(product: any): string {
  const specs = product?.specifications || {};
  const rawChromX = specs.chromaticity_coordinates_x;
  const rawChromY = specs.chromaticity_coordinates_y;
  const coordCct = getColourTempFromCoordinates(rawChromX, rawChromY);

  const rawCct = specs.cct_k || product?.colourTemperature || '3000/4000/6500';
  const cctMatches = String(rawCct).match(/\d{4}/g) || ['3000', '4000', '6500'];
  const firstCct = cctMatches[0] || '3000';
  const effectiveSpectrumCct = coordCct || (firstCct ? `${firstCct}k` : '4000k');

  const rawModelId = specs.model_identifier || specs.light_source_model_no || product?.name || 'MODEL';
  const safeModelId = String(rawModelId).replace(/\//g, '-').replace(/[^a-zA-Z0-9_\-]/g, '_');

  const rawSeriesName = specs.series_name || (product?.families && typeof product?.families === 'object' ? product?.families.name : '') || product?.series || safeModelId;
  const safeSeriesName = String(rawSeriesName).trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '_');

  return `${safeSeriesName}_${effectiveSpectrumCct}_spectrum.jpg`.toLowerCase();
}

export function generateEprelXml(options: EprelXmlOptions): string {
  const { product, eprelRegistrationNumber, onMarketStartDate } = options;
  const specs = product.specifications || {};

  // 1. Request ID & Operation ID
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const defaultRequestId = `MGM${y}${m}${d}${hh}${mm}`;
  const requestId = escapeXml(options.requestId || defaultRequestId);
  const operationId = escapeXml(options.operationId || '14');

  // 2. Model Identifier & Customer Model
  const rawCustomerModelNo = specs.customer_model_no_new || specs.customer_model_no || product.name || 'PRODUCT';
  const rawModelIdentifier = specs.model_identifier || specs.light_source_model_no || product.name || 'MODEL_IDENTIFIER';

  const modelIdentifier = escapeXml(rawModelIdentifier);

  // 3. Date formatting (ensure timezone or format YYYY-MM-DD+01:00)
  let formattedStartDate = onMarketStartDate ? String(onMarketStartDate).trim() : '2027-01-01+01:00';
  if (formattedStartDate.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(formattedStartDate)) {
    formattedStartDate += '+01:00';
  }

  // 4. Media & Tech Doc file paths: always uses standard technical document filename
  // "${customer_model_no_new}_${model_identifier}_LS_TD.pdf"
  const techDocFilename = getTechnicalDocumentFilename('light-source', product);

  // 5. CCT values & Chromaticity Coordinates calculation
  const rawChromX = specs.chromaticity_coordinates_x;
  const rawChromY = specs.chromaticity_coordinates_y;
  const coordCct = getColourTempFromCoordinates(rawChromX, rawChromY);

  const rawCct = specs.cct_k || product.colourTemperature || '3000/4000/6500';
  const cctMatches = String(rawCct).match(/\d{4}/g) || ['3000', '4000', '6500'];
  const cctType = cctMatches.length > 1 ? 'STEPS' : 'SINGLE_VALUE';
  const cctTags = cctMatches.map(c => `<CORRELATED_COLOUR_TEMP>${c}</CORRELATED_COLOUR_TEMP>`).join('\n');
  const firstCct = cctMatches[0] || '3000';

  // Spectrum filename
  const spectrumFilename = getSpectrumFilename(product);

  // 6. Extracted Parameters from Specifications
  const lightingTech = escapeXml(specs.lighting_tech || 'LED');
  const capType = escapeXml(specs.cap_type || 'terminal block');
  const directional = formatDirectional(specs.directional_non_directional);
  const mains = formatMains(specs.mains_non_mains);
  const connectedLs = formatBoolean(specs.connected_light_source, false);
  const colourTuneable = formatBoolean(specs.colour_tuneable_light_source, false);
  const highLuminance = formatBoolean(specs.high_luminance_light_source, false);
  const antiGlare = formatBoolean(specs.anti_glare_shield, false);
  const dimmable = formatDimmable(specs.light_source_dimmable || specs.dimmable);

  const energyCons = escapeXml(
    (specs.energy_consumption_on_mode !== undefined && specs.energy_consumption_on_mode !== null && specs.energy_consumption_on_mode !== '')
      ? specs.energy_consumption_on_mode
      : (specs.on_mode_power_w || product.power || '20')
  );
  const energyClass = escapeXml(specs.energy_efficiency_class || 'D');
  const luminousFlux = escapeXml(
    (specs.light_source_useful_luminous_flux_lm !== undefined && specs.light_source_useful_luminous_flux_lm !== null && specs.light_source_useful_luminous_flux_lm !== '')
      ? specs.light_source_useful_luminous_flux_lm
      : (specs.useful_luminous_flux_lm || specs.total_luminous_flux_lm || '3100')
  );
  const beamAngleCorrespondence = formatBeamAngleCorrespondence(specs.beam_angle_correspondence);

  const powerOnMode = escapeXml(
    (specs.light_source_on_mode_power_w !== undefined && specs.light_source_on_mode_power_w !== null && specs.light_source_on_mode_power_w !== '')
      ? specs.light_source_on_mode_power_w
      : (specs.on_mode_power_w || product.power || '20')
  );
  const powerStandby = escapeXml(
    (specs.light_source_standby_power_w !== undefined && specs.light_source_standby_power_w !== null && specs.light_source_standby_power_w !== '')
      ? specs.light_source_standby_power_w
      : '0'
  );
  const cri = escapeXml(
    specs.ra ||
    specs.cri ||
    specs.cri_lower_80 ||
    '80'
  );

  const dimHeight = escapeXml(
    (specs.light_source_outer_dimensions_high_mm !== undefined && specs.light_source_outer_dimensions_high_mm !== null && specs.light_source_outer_dimensions_high_mm !== '')
      ? specs.light_source_outer_dimensions_high_mm
      : (specs.height_mm || '29')
  );
  const dimWidth = escapeXml(
    (specs.light_source_outer_dimensions_width_mm !== undefined && specs.light_source_outer_dimensions_width_mm !== null && specs.light_source_outer_dimensions_width_mm !== '')
      ? specs.light_source_outer_dimensions_width_mm
      : (specs.width_mm || specs.diameter_mm || '157')
  );
  const dimDepth = escapeXml(
    (specs.light_source_outer_dimensions_depth_mm !== undefined && specs.light_source_outer_dimensions_depth_mm !== null && specs.light_source_outer_dimensions_depth_mm !== '')
      ? specs.light_source_outer_dimensions_depth_mm
      : (specs.length_mm || specs.diameter_mm || specs.width_mm || '157')
  );

  const claimEquivalentPower = formatBoolean(specs.claim_equivalent_power, false);
  const chromX = escapeXml(specs.chromaticity_coordinates_x || '0.38');
  const chromY = escapeXml(specs.chromaticity_coordinates_y || '0.38');
  const r9Cri = escapeXml(
    (specs.r9_cri_value !== undefined && specs.r9_cri_value !== null && specs.r9_cri_value !== '')
      ? specs.r9_cri_value
      : '0'
  );
  const survivalFactor = escapeXml(specs.survival_factor || '0.9');
  const lumenMaintenanceFactor = escapeXml(specs.lumen_maintanance_factor_3600h || '0.96');
  const displacementFactor = escapeXml(specs.displacement_factor || '0.9');
  const colourConsistency = escapeXml(specs.colour_consistency || '6');
  const claimReplaceFluorescent = formatBoolean(specs.claim_fluorescent_light_replacement, false);
  const flickerMetric = escapeXml(specs.flicker_metric || '1');
  const stroboscopicMetric = escapeXml(specs.svm || '0.4');

  // 7. Construct XML
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns3:ProductModelRegistrationRequest xmlns:ns2="http://eprel.ener.ec.europa.eu/productModel/productCore/v2" xmlns:ns3="http://eprel.ener.ec.europa.eu/services/productModelService/modelRegistrationService/v2" REQUEST_ID="${requestId}">
<productOperation OPERATION_TYPE="UPDATE_PRODUCT_MODEL" OPERATION_ID="${operationId}">
<MODEL_VERSION>
<EPREL_MODEL_REGISTRATION_NUMBER>${escapeXml(eprelRegistrationNumber)}</EPREL_MODEL_REGISTRATION_NUMBER>
<MODEL_IDENTIFIER>${modelIdentifier}</MODEL_IDENTIFIER>
<TRADEMARK_REFERENCE>MEGAMAN®</TRADEMARK_REFERENCE>
<DELEGATED_ACT>EU_2019_2015</DELEGATED_ACT>
<PRODUCT_GROUP>LAMP</PRODUCT_GROUP>
<ENERGY_LABEL xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ns5="http://eprel.ener.ec.europa.eu/commonTypes/EnergyLabelTypes/v2" xsi:type="ns5:GeneratedEnergyLabel">
<USE_SUPPLIER_UPLOADED_LABEL>false</USE_SUPPLIER_UPLOADED_LABEL>
</ENERGY_LABEL>
<ON_MARKET_START_DATE>${escapeXml(formattedStartDate)}</ON_MARKET_START_DATE>
<REGISTRANT_NATURE>AUTHORISED_REPRESENTATIVE</REGISTRANT_NATURE>
<MODEL_AVAILABILITY_IN_COUNTRIES AVAILABILITY_IN_EU_EEA_COUNTRIES="AS_SPECIFIED">
<EU_EEA_COUNTRY>AT</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>BE</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>BG</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>CY</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>CZ</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>DE</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>DK</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>EE</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>EL</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>ES</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>FI</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>FR</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>HR</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>HU</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>IE</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>IT</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>LT</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>LU</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>LV</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>MT</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>NL</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>PL</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>PT</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>RO</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>SE</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>SI</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>SK</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>LI</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>NO</EU_EEA_COUNTRY>
<EU_EEA_COUNTRY>IS</EU_EEA_COUNTRY>
<OTHER_COUNTRY>XI</OTHER_COUNTRY>
</MODEL_AVAILABILITY_IN_COUNTRIES>
<TECHNICAL_DOCUMENTATION xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="ns2:TechnicalDocumentationDetail">
<DOCUMENT>
<ns2:DESCRIPTION>Technical Document</ns2:DESCRIPTION>
<LANGUAGE>EN</LANGUAGE>
<TECHNICAL_PART>TESTING_CONDITIONS</TECHNICAL_PART>
<TECHNICAL_PART>CALCULATIONS</TECHNICAL_PART>
<TECHNICAL_PART>GENERAL_DESCRIPTION</TECHNICAL_PART>
<TECHNICAL_PART>MESURED_TECHNICAL_PARAMETERS</TECHNICAL_PART>
<TECHNICAL_PART>REFERENCES_TO_HARMONISED_STANDARDS</TECHNICAL_PART>
<TECHNICAL_PART>SPECIFIC_PRECAUTIONS</TECHNICAL_PART>
<FILE_PATH>./${escapeXml(techDocFilename)}</FILE_PATH>
</DOCUMENT>
</TECHNICAL_DOCUMENTATION>
<CONTACT_DETAILS xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="ns2:ContactByReference">
<CONTACT_REFERENCE>Helpdesk</CONTACT_REFERENCE>
</CONTACT_DETAILS>
<COMPLIANCE_CONTACT_DETAILS xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="ns2:ContactByReference">
<CONTACT_REFERENCE>Helpdesk</CONTACT_REFERENCE>
</COMPLIANCE_CONTACT_DETAILS>
<PRODUCT_GROUP_DETAIL xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ns5="http://eprel.ener.ec.europa.eu/productModel/productGroups/lightsource/v1" xsi:type="ns5:LightSource">
<LIGHTING_TECHNOLOGY>${lightingTech}</LIGHTING_TECHNOLOGY>
<CAP_TYPE>${capType}</CAP_TYPE>
<DIRECTIONAL>${directional}</DIRECTIONAL>
<MAINS>${mains}</MAINS>
<CONNECTED_LIGHT_SOURCE>${connectedLs}</CONNECTED_LIGHT_SOURCE>
<COLOUR_TUNEABLE_LIGHT_SOURCE>${colourTuneable}</COLOUR_TUNEABLE_LIGHT_SOURCE>
<HIGH_LUMINANCE_LIGHT_SOURCE>${highLuminance}</HIGH_LUMINANCE_LIGHT_SOURCE>
<ANTI_GLARE_SHIELD>${antiGlare}</ANTI_GLARE_SHIELD>
<DIMMABLE>${dimmable}</DIMMABLE>
<ENERGY_CONS_ON_MODE>${energyCons}</ENERGY_CONS_ON_MODE>
<ENERGY_CLASS>${energyClass}</ENERGY_CLASS>
<LUMINOUS_FLUX>${luminousFlux}</LUMINOUS_FLUX>
<BEAM_ANGLE_CORRESPONDENCE>${beamAngleCorrespondence}</BEAM_ANGLE_CORRESPONDENCE>
<CORRELATED_COLOUR_TEMP_TYPE>${cctType}</CORRELATED_COLOUR_TEMP_TYPE>
${cctTags}
<POWER_ON_MODE>${powerOnMode}</POWER_ON_MODE>
<POWER_STANDBY>${powerStandby}</POWER_STANDBY>
<COLOUR_RENDERING_INDEX>${cri}</COLOUR_RENDERING_INDEX>
<DIMENSION_HEIGHT>${dimHeight}</DIMENSION_HEIGHT>
<DIMENSION_WIDTH>${dimWidth}</DIMENSION_WIDTH>
<DIMENSION_DEPTH>${dimDepth}</DIMENSION_DEPTH>
<SPECTRAL_POWER_DISTRIBUTION_IMAGE>./${escapeXml(spectrumFilename)}</SPECTRAL_POWER_DISTRIBUTION_IMAGE>
<CLAIM_EQUIVALENT_POWER>${claimEquivalentPower}</CLAIM_EQUIVALENT_POWER>
<CHROMATICITY_COORD_X>${chromX}</CHROMATICITY_COORD_X>
<CHROMATICITY_COORD_Y>${chromY}</CHROMATICITY_COORD_Y>
<R9_COLOUR_RENDERING_INDEX>${r9Cri}</R9_COLOUR_RENDERING_INDEX>
<SURVIVAL_FACTOR>${survivalFactor}</SURVIVAL_FACTOR>
<LUMEN_MAINTENANCE_FACTOR>${lumenMaintenanceFactor}</LUMEN_MAINTENANCE_FACTOR>
<DISPLACEMENT_FACTOR>${displacementFactor}</DISPLACEMENT_FACTOR>
<COLOUR_CONSISTENCY>${colourConsistency}</COLOUR_CONSISTENCY>
<CLAIM_LED_REPLACE_FLUORESCENT>${claimReplaceFluorescent}</CLAIM_LED_REPLACE_FLUORESCENT>
<FLICKER_METRIC>${flickerMetric}</FLICKER_METRIC>
<STROBOSCOPIC_EFFECT_METRIC>${stroboscopicMetric}</STROBOSCOPIC_EFFECT_METRIC>
<TECHNICAL_PARAMETERS>
<TECH_LUMINOUS_FLUX>${luminousFlux}</TECH_LUMINOUS_FLUX>
<TECH_COLOUR_RENDERING_INDEX>${cri}</TECH_COLOUR_RENDERING_INDEX>
<TECH_POWER_ON_MODE>${powerOnMode}</TECH_POWER_ON_MODE>
<TECH_CORRELATED_COLOUR_TEMP>${firstCct}</TECH_CORRELATED_COLOUR_TEMP>
<TECH_POWER_STANDBY>${powerStandby}</TECH_POWER_STANDBY>
<TECH_R9_COLOUR_RENDERING_INDEX>${r9Cri}</TECH_R9_COLOUR_RENDERING_INDEX>
<TECH_SURVIVAL_FACTOR>${survivalFactor}</TECH_SURVIVAL_FACTOR>
<TECH_LUMEN_MAINTENANCE_FACTOR>${lumenMaintenanceFactor}</TECH_LUMEN_MAINTENANCE_FACTOR>
<TECH_DISPLACEMENT_FACTOR>${displacementFactor}</TECH_DISPLACEMENT_FACTOR>
<TECH_COLOUR_CONSISTENCY>${colourConsistency}</TECH_COLOUR_CONSISTENCY>
<TECH_FLICKER_METRIC>${flickerMetric}</TECH_FLICKER_METRIC>
<TECH_STROBOSCOPIC_EFFECT_METRIC>${stroboscopicMetric}</TECH_STROBOSCOPIC_EFFECT_METRIC>
</TECHNICAL_PARAMETERS>
</PRODUCT_GROUP_DETAIL>
</MODEL_VERSION>
</productOperation>
</ns3:ProductModelRegistrationRequest>
`;
}
