// ------------------------------------------------------
//  Airports helper – caches a slimmed‑down airports list
// ------------------------------------------------------
const AIRPORTS_URL =
  "https://raw.githubusercontent.com/mwgg/Airports/master/airports.json";
const AIRPORTS_CACHE_KEY = "airportsSlimV1";   // bump the version if schema changes

async function loadAirportsSlim() {
  const cached = localStorage.getItem(AIRPORTS_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const res = await fetch(AIRPORTS_URL);
  const full = await res.json();

  const slim = {};
  for (const code in full) {
    const a = full[code];
    if (a.iata) {
      slim[a.iata.toUpperCase()] = {
        name: a.name,
        lat: a.lat,
        lon: a.lon,
        tz: a.tz,
        country: a.country,
      };
    }
  }

  localStorage.setItem(AIRPORTS_CACHE_KEY, JSON.stringify(slim));
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
    const airport = Object.values(data).find(a => a.iata === iata.toUpperCase());
    const countryName = airport?.country;

    if (typeof countries !== 'undefined') {
        return countries.getAlpha2Code(countryName, 'en');
    }

    return null;
}

// ------------------------------------------------------
//  Example usage:
//  const coords = await getAirportCoords("LHR");
//  const tz     = await getAirportTZ("HKG");
// ------------------------------------------------------
