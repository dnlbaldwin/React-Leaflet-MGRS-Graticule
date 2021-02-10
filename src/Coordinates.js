// import Mgrs from 'geodesy';
import proj4 from 'proj4';

const wgs84ll = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

var utmObj = require('utm-latlng');
var utmO = new utmObj(); // Defaults to WGS-84

function utmProjStr(utmZone, isSHemisphere) {
  if (utmZone >= 1 && utmZone <= 60) {
    let res = '+proj=utm +zone=' + utmZone.toString() + ' +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
    if (isSHemisphere) {
      res = res + ' +south';
    }
    return res;
  } else {
    console.log('Invalid UTM zone.');
  }
}

export function utmLl(easting, northing, zoneNumber, zoneLetter) {
  const isSHemisphere = zoneLetter >= 'C' && zoneLetter <= 'M' ? true : false;

  const baseUtmProjection =
    '+proj=utm +zone=' + zoneNumber + zoneLetter + ' +ellps=WGS84 +datum=WGS84 +units=m +no_defs';

  const utmProjection = isSHemisphere ? baseUtmProjection + '+south' : baseUtmProjection;

  const res = proj4(utmProjection, wgs84ll).forward([easting, northing]);

  return { lat: res[1], lng: res[0] };
}

export function llUtm(lat, lng) {
  const isSHemisphere = lat < 0 ? true : false;

  let zoneNumber = utmLongBand(lat, lng);
  let zoneLetter = utmLatitudeBand(lat);

  const baseUtmProjection =
    '+proj=utm +zone=' + zoneNumber + zoneLetter + ' +ellps=WGS84 +datum=WGS84 +units=m +no_defs';

  const utmProjection = isSHemisphere ? baseUtmProjection + '+south' : baseUtmProjection;

  const res = proj4(wgs84ll, utmProjection).forward([lng, lat]);

  //   console.log(res);

  return { easting: res[0], northing: res[1], zoneLetter: zoneLetter, zoneNumber: Math.floor(zoneNumber) };
}

function utmLatitudeBand(latitude) {
  latitude = parseFloat(latitude);
  if (84 <= latitude && latitude >= 72) return 'X';
  else if (72 < latitude && latitude >= 64) return 'W';
  else if (64 < latitude && latitude >= 56) return 'V';
  else if (56 < latitude && latitude >= 48) return 'U';
  else if (48 < latitude && latitude >= 40) return 'T';
  else if (40 < latitude && latitude >= 32) return 'S';
  else if (32 < latitude && latitude >= 24) return 'R';
  else if (24 < latitude && latitude >= 16) return 'Q';
  else if (16 < latitude && latitude >= 8) return 'P';
  else if (8 < latitude && latitude >= 0) return 'N';
  else if (0 < latitude && latitude >= -8) return 'M';
  else if (-8 < latitude && latitude >= -16) return 'L';
  else if (-16 < latitude && latitude >= -24) return 'K';
  else if (-24 < latitude && latitude >= -32) return 'J';
  else if (-32 < latitude && latitude >= -40) return 'H';
  else if (-40 < latitude && latitude >= -48) return 'G';
  else if (-48 < latitude && latitude >= -56) return 'F';
  else if (-56 < latitude && latitude >= -64) return 'E';
  else if (-64 < latitude && latitude >= -72) return 'D';
  else if (-72 < latitude && latitude >= -80) return 'C';
  else return 'Z';
}

function utmLongBand(latitude, longitude) {
  let zoneNumber;
  if (latitude >= 56.0 && latitude < 64.0 && longitude >= 0.0 && longitude < 3.0) {
    zoneNumber = 31;
  } else if (latitude >= 56.0 && latitude < 64.0 && longitude >= 3.0 && longitude < 12.0) {
    zoneNumber = 32;
  } else {
    zoneNumber = (longitude + 180) / 6 + 1;

    if (latitude >= 72.0 && latitude < 84.0) {
      if (longitude >= 0.0 && longitude < 9.0) {
        zoneNumber = 31;
      } else if (longitude >= 9.0 && longitude < 21.0) {
        zoneNumber = 33;
      } else if (longitude >= 21.0 && longitude < 33.0) {
        zoneNumber = 35;
      } else if (longitude >= 33.0 && longitude < 42.0) {
        zoneNumber = 37;
      }
    }
  }
  return zoneNumber;
}

// Converts a set of Longitude and Latitude co-ordinates to UTM using the WGS84 ellipsoid
export function LLtoUTM(ll) {
  const Lat = ll.lat;
  //! added || ll.lng to comply with Leaflet
  const Long = ll.lon || ll.lng;
  const a = 6378137; // ellip.radius;
  const eccSquared = 0.00669438; // ellip.eccsq;
  const k0 = 0.9996;
  const LatRad = degToRad(Lat);
  const LongRad = degToRad(Long);
  let ZoneNumber;
  // (int)
  ZoneNumber = Math.floor((Long + 180) / 6) + 1;

  // Make sure the longitude 180 is in Zone 60
  if (Long === 180) {
    ZoneNumber = 60;
  }

  // Special zone for Norway
  if (Lat >= 56 && Lat < 64 && Long >= 3 && Long < 12) {
    ZoneNumber = 32;
  }

  // Special zones for Svalbard
  if (Lat >= 72 && Lat < 84) {
    if (Long >= 0 && Long < 9) {
      ZoneNumber = 31;
    } else if (Long >= 9 && Long < 21) {
      ZoneNumber = 33;
    } else if (Long >= 21 && Long < 33) {
      ZoneNumber = 35;
    } else if (Long >= 33 && Long < 42) {
      ZoneNumber = 37;
    }
  }

  const LongOrigin = (ZoneNumber - 1) * 6 - 180 + 3;
  // +3 puts origin in middle of zone
  const LongOriginRad = degToRad(LongOrigin);

  const eccPrimeSquared = eccSquared / (1 - eccSquared);

  const N = a / Math.sqrt(1 - eccSquared * Math.sin(LatRad) * Math.sin(LatRad));
  const T = Math.tan(LatRad) * Math.tan(LatRad);
  const C = eccPrimeSquared * Math.cos(LatRad) * Math.cos(LatRad);
  const A = Math.cos(LatRad) * (LongRad - LongOriginRad);

  const M =
    a *
    ((1 - eccSquared / 4 - (3 * eccSquared * eccSquared) / 64 - (5 * eccSquared * eccSquared * eccSquared) / 256) *
      LatRad -
      ((3 * eccSquared) / 8 + (3 * eccSquared * eccSquared) / 32 + (45 * eccSquared * eccSquared * eccSquared) / 1024) *
        Math.sin(2 * LatRad) +
      ((15 * eccSquared * eccSquared) / 256 + (45 * eccSquared * eccSquared * eccSquared) / 1024) *
        Math.sin(4 * LatRad) -
      ((35 * eccSquared * eccSquared * eccSquared) / 3072) * Math.sin(6 * LatRad));

  const UTMEasting =
    k0 *
      N *
      (A +
        ((1 - T + C) * A * A * A) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * eccPrimeSquared) * A * A * A * A * A) / 120) +
    500000;

  let UTMNorthing =
    k0 *
    (M +
      N *
        Math.tan(LatRad) *
        ((A * A) / 2 +
          ((5 - T + 9 * C + 4 * C * C) * A * A * A * A) / 24 +
          ((61 - 58 * T + T * T + 600 * C - 330 * eccPrimeSquared) * A * A * A * A * A * A) / 720));
  if (Lat < 0) {
    UTMNorthing += 10000000; // 10000000 meter offset for
    // southern hemisphere
  }

  return {
    northing: Math.trunc(UTMNorthing),
    easting: Math.trunc(UTMEasting),
    zoneNumber: ZoneNumber,
    zoneLetter: getLetterDesignator(Lat),
  };
}

function getLetterDesignator(latitude) {
  if (latitude <= 84 && latitude >= 72) {
    // the X band is 12 degrees high
    return 'X';
  }
  if (latitude < 72 && latitude >= -80) {
    // Latitude bands are lettered C through X, excluding I and O
    const bandLetters = 'CDEFGHJKLMNPQRSTUVWX';
    const bandHeight = 8;
    const minLatitude = -80;
    const index = Math.floor((latitude - minLatitude) / bandHeight);
    return bandLetters[index];
  }
  if (latitude > 84 || latitude < -80) {
    // This is here as an error flag to show that the Latitude is
    // outside MGRS limits
    return 'Z';
  }
}

// UTM zones are grouped, and assigned to one of a group of 6 sets
const NUM_100K_SETS = 6;
// The column letters (for easting) of the lower left value, per set
const SET_ORIGIN_COLUMN_LETTERS = 'AJSAJS';
// The row letters (for northing) of the lower left value, per set
const SET_ORIGIN_ROW_LETTERS = 'AFAFAF';

const A = 65; // A
const I = 73; // I
const O = 79; // O
const V = 86; // V
const Z = 90; // Z

// Conversion from degrees to radians
function degToRad(deg) {
  return deg * (Math.PI / 180);
}

// Conversion from radians to degrees
function radToDeg(rad) {
  return 180 * (rad / Math.PI);
}

export function UTMtoLL(utm) {
  console.log(utm);
  const UTMNorthing = utm.northing;
  const UTMEasting = utm.easting;
  const { zoneLetter, zoneNumber } = utm;
  // check the ZoneNumber is valid
  if (zoneNumber < 0 || zoneNumber > 60) {
    return null;
  }

  const k0 = 0.9996;
  const a = 6378137; // ellip.radius;
  const eccSquared = 0.00669438; // ellip.eccsq;
  const e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared));

  // remove 500,000 meter offset for longitude
  const x = UTMEasting - 500000;
  let y = UTMNorthing;

  // We must know somehow if we are in the Northern or Southern
  // hemisphere, this is the only time we use the letter So even
  // if the Zone letter isn't exactly correct it should indicate
  // the hemisphere correctly
  if (zoneLetter < 'N') {
    y -= 10000000; // remove 10,000,000 meter offset used
    // for southern hemisphere
  }

  // There are 60 zones with zone 1 being at West -180 to -174
  const LongOrigin = (zoneNumber - 1) * 6 - 180 + 3; // +3 puts origin
  // in middle of
  // zone

  const eccPrimeSquared = eccSquared / (1 - eccSquared);

  const M = y / k0;
  const mu =
    M /
    (a * (1 - eccSquared / 4 - (3 * eccSquared * eccSquared) / 64 - (5 * eccSquared * eccSquared * eccSquared) / 256));

  const phi1Rad =
    mu +
    ((3 * e1) / 2 - (27 * e1 * e1 * e1) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * e1 * e1 * e1 * e1) / 32) * Math.sin(4 * mu) +
    ((151 * e1 * e1 * e1) / 96) * Math.sin(6 * mu);
  // double phi1 = ProjMath.radToDeg(phi1Rad);

  const N1 = a / Math.sqrt(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad));
  const T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
  const C1 = eccPrimeSquared * Math.cos(phi1Rad) * Math.cos(phi1Rad);
  const R1 = (a * (1 - eccSquared)) / Math.pow(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5);
  const D = x / (N1 * k0);

  let lat =
    phi1Rad -
    ((N1 * Math.tan(phi1Rad)) / R1) *
      ((D * D) / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) * D * D * D * D) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * eccPrimeSquared - 3 * C1 * C1) * D * D * D * D * D * D) / 720);
  lat = radToDeg(lat);

  let lon =
    (D -
      ((1 + 2 * T1 + C1) * D * D * D) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eccPrimeSquared + 24 * T1 * T1) * D * D * D * D * D) / 120) /
    Math.cos(phi1Rad);
  lon = LongOrigin + radToDeg(lon);

  let result;
  if (typeof utm.accuracy === 'number') {
    const topRight = UTMtoLL({
      northing: utm.northing + utm.accuracy,
      easting: utm.easting + utm.accuracy,
      zoneLetter: utm.zoneLetter,
      zoneNumber: utm.zoneNumber,
    });
    result = {
      top: topRight.lat,
      right: topRight.lon,
      bottom: lat,
      left: lon,
    };
  } else {
    result = {
      lat,
      lon,
    };
  }
  return result;
}
