// ------------------------------------------------------
//  Airports helper – caches a slimmed‑down airports list
// ------------------------------------------------------
const AIRPORTS_URL =
  "https://raw.githubusercontent.com/mwgg/Airports/master/airports.json";
const AIRPORTS_CACHE_KEY = "airportsSlim";   // bump the version if schema changes

const DB_NAME = 'FlightAppDB';
const STORE_NAME = 'AirportData';
const DB_VERSION = 1;

const iso2to3 = {
  "AF": "AFG", "AL": "ALB", "DZ": "DZA", "AS": "ASM", "AD": "AND", "AO": "AGO",
  "AI": "AIA", "AQ": "ATA", "AG": "ATG", "AR": "ARG", "AM": "ARM", "AW": "ABW",
  "AU": "AUS", "AT": "AUT", "AZ": "AZE", "BS": "BHS", "BH": "BHR", "BD": "BGD",
  "BB": "BRB", "BY": "BLR", "BE": "BEL", "BZ": "BLZ", "BJ": "BEN", "BM": "BMU",
  "BT": "BTN", "BO": "BOL", "BA": "BIH", "BW": "BWA", "BR": "BRA", "BN": "BRN",
  "BG": "BGR", "BF": "BFA", "BI": "BDI", "KH": "KHM", "CM": "CMR", "CA": "CAN",
  "CV": "CPV", "KY": "CYM", "CF": "CAF", "TD": "TCD", "CL": "CHL", "CN": "CHN",
  "CO": "COL", "KM": "COM", "CD": "COD", "CG": "COG", "CR": "CRI", "CI": "CIV",
  "HR": "HRV", "CU": "CUB", "CY": "CYP", "CZ": "CZE", "DK": "DNK", "DJ": "DJI",
  "DM": "DMA", "DO": "DOM", "EC": "ECU", "EG": "EGY", "SV": "SLV", "GQ": "GNQ",
  "ER": "ERI", "EE": "EST", "ET": "ETH", "FJ": "FJI", "FI": "FIN", "FR": "FRA",
  "GA": "GAB", "GM": "GMB", "GE": "GEO", "DE": "DEU", "GH": "GHA", "GR": "GRC",
  "GL": "GRL", "GD": "GRD", "GU": "GUM", "GT": "GTM", "GN": "GIN", "GW": "GNB",
  "GY": "GUY", "HT": "HTI", "HN": "HND", "HK": "HKG", "HU": "HUN", "IS": "ISL",
  "IN": "IND", "ID": "IDN", "IR": "IRN", "IQ": "IRQ", "IE": "IRL", "IL": "ISR",
  "IT": "ITA", "JM": "JAM", "JP": "JPN", "JO": "JOR", "KZ": "KAZ", "KE": "KEN",
  "KI": "KIR", "KP": "PRK", "KR": "KOR", "KW": "KWT", "KG": "KGZ", "LA": "LAO",
  "LV": "LVA", "LB": "LBN", "LS": "LSO", "LR": "LBR", "LY": "LBY", "LI": "LIE",
  "LT": "LTU", "LU": "LUX", "MO": "MAC", "MK": "MKD", "MG": "MDG", "MW": "MWI",
  "MY": "MYS", "MV": "MDV", "ML": "MLI", "MT": "MLT", "MH": "MHL", "MR": "MRT",
  "MU": "MUS", "MX": "MEX", "FM": "FSM", "MD": "MDA", "MC": "MCO", "MN": "MNG",
  "ME": "MNE", "MA": "MAR", "MZ": "MOZ", "MM": "MMR", "NA": "NAM", "NR": "NRU",
  "NP": "NPL", "NL": "NLD", "NZ": "NZL", "NI": "NIC", "NE": "NER", "NG": "NGA",
  "NO": "NOR", "OM": "OMN", "PK": "PAK", "PW": "PLW", "PA": "PAN", "PG": "PNG",
  "PY": "PRY", "PE": "PER", "PH": "PHL", "PL": "POL", "PT": "PRT", "PR": "PRI",
  "QA": "QAT", "RO": "ROU", "RU": "RUS", "RW": "RWA", "KN": "KNA", "LC": "LCA",
  "VC": "VCT", "WS": "WSM", "SM": "SMR", "ST": "STP", "SA": "SAU", "SN": "SEN",
  "RS": "SRB", "SC": "SYC", "SL": "SLE", "SG": "SGP", "SK": "SVK", "SI": "SVN",
  "SB": "SLB", "SO": "SOM", "ZA": "ZAF", "ES": "ESP", "LK": "LKA", "SD": "SDN",
  "SR": "SUR", "SZ": "SWZ", "SE": "SWE", "CH": "CHE", "SY": "SYR", "TW": "TWN",
  "TJ": "TJK", "TZ": "TZA", "TH": "THA", "TL": "TLS", "TG": "TGO", "TO": "TON",
  "TT": "TTO", "TN": "TUN", "TR": "TUR", "TM": "TKM", "UG": "UGA", "UA": "UKR",
  "AE": "ARE", "GB": "GBR", "US": "USA", "UY": "URY", "UZ": "UZB", "VU": "VUT",
  "VE": "VEN", "VN": "VNM", "YE": "YEM", "ZM": "ZMB", "ZW": "ZWE"
};

async function loadAirportsSlim() {
  const cached = await getFromAirportDB(AIRPORTS_CACHE_KEY);
  if (cached) return cached;

  const raw = await fetch(AIRPORTS_URL).then(res => res.json());

  // Slim it down (skip those without IATA)
  const slim = {};
  for (const key in raw) {
    const a = raw[key];
    if (!a.iata) continue;
    slim[a.iata.toUpperCase()] = {
      name: a.name,
      lat:  a.lat,
      lon:  a.lon,
      tz:   a.tz,
      country:  a.country
    };
  }

  await saveToAirportDB(AIRPORTS_CACHE_KEY, slim);
  return slim;
}


// ------------------------------------------------------
//  Convenience look‑ups using the slim cache
// ------------------------------------------------------

// get [lat, lon]
async function getAirportCoords(iata) {
  const data = await loadAirportsSlim();
  const a = data[iata.toUpperCase()];
  return a ? [a.lat, a.lon] : null;
}

// get airport name
async function getAirportName(iata) {
  const data = await loadAirportsSlim();
  return data[iata.toUpperCase()]?.name || null;
}

// get timezone
async function getAirportTZ(iata) {
  const data = await loadAirportsSlim();
  return data[iata.toUpperCase()]?.tz || null;
}

async function getCountryCode(iata) {
    const data = await loadAirportsSlim();
    // const airport = Object.values(data).find(a => a.iata === iata.toUpperCase());
    const countryName = data[iata.toUpperCase()]?.country;

    if (!countryName) return null;

    return iso2to3[countryName];
    
    // return data[iata.toUpperCase()]?.country || null;
}

function openAirportDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveToAirportDB(key, value) {
  return openAirportDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function getFromAirportDB(key) {
  return openAirportDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}