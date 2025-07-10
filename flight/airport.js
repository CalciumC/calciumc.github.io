// ------------------------------------------------------
//  Airports helper – caches a slimmed‑down airports list
// ------------------------------------------------------
const AIRPORTS_URL =
  "https://raw.githubusercontent.com/mwgg/Airports/master/airports.json";
const AIRPORTS_CACHE_KEY = "airportsSlimV1";   // bump the version if schema changes

const DB_NAME = 'FlightAppDB';
const STORE_NAME = 'AirportData';
const DB_VERSION = 1;


async function loadAirportsSlim() {
  const cached = await getFromAirportDB('airportsSlim');
  if (cached) return cached;

  const raw = await fetch('https://yourdomain.com/airports.json').then(res => res.json());

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

  await saveToAirportDB('airportsSlim', slim);
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
    const data = loadAirportsSlim();
    // const airport = Object.values(data).find(a => a.iata === iata.toUpperCase());
    // const countryName = airport?.country;

    // if (typeof countries !== 'undefined') {
    //     return countries.getAlpha2Code(countryName, 'en');
    // }

    // return null;
    return data[iata.toUpperCase()]?.country || null;
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