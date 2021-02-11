import { forward } from 'mgrs';

var utmObj = require('utm-latlng');
var utm = new utmObj(); // Defaults to WGS-84

function utmToLl(easting, northing, zoneNumber, zoneLetter) {
  return utm.convertUtmToLatLng(easting, northing, zoneNumber, zoneLetter);
}

function llToUtm(lat, lng, resolution = 0) {
  // return utm.convertLatLngToUtm(lat, lng, resolution);
  return _LLtoUTM({ lat: lat, lon: lng });
}

/**
 *
 * @param {arr} point [Lng,Lat]
 * @param {number} resolution
 */
function llToMgrs(point, resolution = 1) {
  return forward(point, resolution);
}

function _LLtoUTM(ll) {
  var Lat = ll.lat;
  var Long = ll.lon || ll.lng;
  var a = 6378137.0; //ellip.radius;
  var eccSquared = 0.00669438; //ellip.eccsq;
  var k0 = 0.9996;
  var LongOrigin;
  var eccPrimeSquared;
  var N, T, C, A, M;
  var LatRad = degToRad(Lat);
  var LongRad = degToRad(Long);
  var LongOriginRad;
  var ZoneNumber;
  // (int)
  ZoneNumber = Math.floor((Long + 180) / 6) + 1;

  //Make sure the longitude 180.00 is in Zone 60
  if (Long === 180) {
    ZoneNumber = 60;
  }

  // Special zone for Norway
  if (Lat >= 56.0 && Lat < 64.0 && Long >= 3.0 && Long < 12.0) {
    ZoneNumber = 32;
  }

  // Special zones for Svalbard
  if (Lat >= 72.0 && Lat < 84.0) {
    if (Long >= 0.0 && Long < 9.0) {
      ZoneNumber = 31;
    } else if (Long >= 9.0 && Long < 21.0) {
      ZoneNumber = 33;
    } else if (Long >= 21.0 && Long < 33.0) {
      ZoneNumber = 35;
    } else if (Long >= 33.0 && Long < 42.0) {
      ZoneNumber = 37;
    }
  }

  LongOrigin = (ZoneNumber - 1) * 6 - 180 + 3; //+3 puts origin
  // in middle of
  // zone
  LongOriginRad = degToRad(LongOrigin);

  eccPrimeSquared = eccSquared / (1 - eccSquared);

  N = a / Math.sqrt(1 - eccSquared * Math.sin(LatRad) * Math.sin(LatRad));
  T = Math.tan(LatRad) * Math.tan(LatRad);
  C = eccPrimeSquared * Math.cos(LatRad) * Math.cos(LatRad);
  A = Math.cos(LatRad) * (LongRad - LongOriginRad);

  M =
    a *
    ((1 - eccSquared / 4 - (3 * eccSquared * eccSquared) / 64 - (5 * eccSquared * eccSquared * eccSquared) / 256) *
      LatRad -
      ((3 * eccSquared) / 8 + (3 * eccSquared * eccSquared) / 32 + (45 * eccSquared * eccSquared * eccSquared) / 1024) *
        Math.sin(2 * LatRad) +
      ((15 * eccSquared * eccSquared) / 256 + (45 * eccSquared * eccSquared * eccSquared) / 1024) *
        Math.sin(4 * LatRad) -
      ((35 * eccSquared * eccSquared * eccSquared) / 3072) * Math.sin(6 * LatRad));

  var UTMEasting =
    k0 *
      N *
      (A +
        ((1 - T + C) * A * A * A) / 6.0 +
        ((5 - 18 * T + T * T + 72 * C - 58 * eccPrimeSquared) * A * A * A * A * A) / 120.0) +
    500000.0;

  var UTMNorthing =
    k0 *
    (M +
      N *
        Math.tan(LatRad) *
        ((A * A) / 2 +
          ((5 - T + 9 * C + 4 * C * C) * A * A * A * A) / 24.0 +
          ((61 - 58 * T + T * T + 600 * C - 330 * eccPrimeSquared) * A * A * A * A * A * A) / 720.0));
  if (Lat < 0.0) {
    UTMNorthing += 10000000.0; //10000000 meter offset for
    // southern hemisphere
  }

  return {
    northing: Math.round(UTMNorthing),
    easting: Math.round(UTMEasting),
    zoneNumber: ZoneNumber,
    zoneLetter: getLetterDesignator(Lat),
  };
}

/**
 * Conversion from degrees to radians.
 *
 * @private
 * @param {number} deg the angle in degrees.
 * @return {number} the angle in radians.
 */
function degToRad(deg) {
  return deg * (Math.PI / 180.0);
}

/**
 * Calculates the MGRS letter designator for the given latitude.
 *
 * @private
 * @param {number} lat The latitude in WGS84 to get the letter designator
 *     for.
 * @return {char} The letter designator.
 */
function getLetterDesignator(lat) {
  //This is here as an error flag to show that the Latitude is
  //outside MGRS limits
  var LetterDesignator = 'Z';

  if (84 >= lat && lat >= 72) {
    LetterDesignator = 'X';
  } else if (72 > lat && lat >= 64) {
    LetterDesignator = 'W';
  } else if (64 > lat && lat >= 56) {
    LetterDesignator = 'V';
  } else if (56 > lat && lat >= 48) {
    LetterDesignator = 'U';
  } else if (48 > lat && lat >= 40) {
    LetterDesignator = 'T';
  } else if (40 > lat && lat >= 32) {
    LetterDesignator = 'S';
  } else if (32 > lat && lat >= 24) {
    LetterDesignator = 'R';
  } else if (24 > lat && lat >= 16) {
    LetterDesignator = 'Q';
  } else if (16 > lat && lat >= 8) {
    LetterDesignator = 'P';
  } else if (8 > lat && lat >= 0) {
    LetterDesignator = 'N';
  } else if (0 > lat && lat >= -8) {
    LetterDesignator = 'M';
  } else if (-8 > lat && lat >= -16) {
    LetterDesignator = 'L';
  } else if (-16 > lat && lat >= -24) {
    LetterDesignator = 'K';
  } else if (-24 > lat && lat >= -32) {
    LetterDesignator = 'J';
  } else if (-32 > lat && lat >= -40) {
    LetterDesignator = 'H';
  } else if (-40 > lat && lat >= -48) {
    LetterDesignator = 'G';
  } else if (-48 > lat && lat >= -56) {
    LetterDesignator = 'F';
  } else if (-56 > lat && lat >= -64) {
    LetterDesignator = 'E';
  } else if (-64 > lat && lat >= -72) {
    LetterDesignator = 'D';
  } else if (-72 > lat && lat >= -80) {
    LetterDesignator = 'C';
  }
  return LetterDesignator;
}

export { utmToLl, llToUtm, llToMgrs };
