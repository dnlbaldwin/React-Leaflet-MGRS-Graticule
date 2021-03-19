import { getGZD } from 'gzd-utils';
import { forward } from 'mgrs';

// The following indicies are used to indentify coordinates returned from gzd-utils
const SW_INDEX = 0;
const NW_INDEX = 1;
const NE_INDEX = 2;

const LONGITUDE_INDEX = 0;
const LATITUDE_INDEX = 1;

const TEN_K_MGRS_REGEX = /([0-9]+[A-Z])([A-Z]{2})([0-9]{2})/;
const GZD_INDEX = 1;
/**
 *
 * @param {*} pointOne
 * @param {*} pointTwo
 */
function getLineSlope(pointOne, pointTwo) {
  if (pointOne === pointTwo) {
    return 0;
  } else if (pointOne.lng === pointTwo.lng) {
    return NaN;
  } else {
    return (pointTwo.lat - pointOne.lat) / (pointTwo.lng - pointOne.lng);
  }
}

/**
 *
 * @param {*} slope
 * @param {*} adjustedLongitude
 * @param {*} unadjustedLatLong
 */
function getAdjustedLatitude(slope, adjustedLongitude, unadjustedLatLong) {
  let result;
  if (!isNaN(slope)) {
    result = unadjustedLatLong.lat + slope * (adjustedLongitude - unadjustedLatLong.lng);
  } else {
    result = unadjustedLatLong.lat;
  }

  return result;
}

/**
 *
 * @param {*} slope
 * @param {*} adjustedLongitude
 * @param {*} unadjustedLatLong
 */
function getAdjustedLongitude(slope, adjustedLatitude, unadjustedLatLong) {
  let result;
  if (slope === 0) {
    const e = new Error('getAdjustedLongitude: Zero slope received');
    throw e;
  } else if (!isNaN(slope)) {
    result = (adjustedLatitude - unadjustedLatLong.lat + slope * unadjustedLatLong.lng) / slope;
  } else {
    result = unadjustedLatLong.lng;
  }

  return result;
}
/**
 *
 * @param {string} char
 */
function getNextMgrsGzdCharacter(char) {
  // I and O are not valid characters for MGRS, so get the next
  // character recursively
  const result = String.fromCharCode(char.charCodeAt(0) + 1);
  if (result === 'I' || result === 'O') {
    return getNextMgrsGzdCharacter(result);
  } else {
    return result;
  }
}

/**
 * Given two points and a direction, will return a new point along the
 * line generated by pointOne and pointTwo which rests on the GZD boundary
 * @param {Dict} pointOne
 * @param {Dict} pointTwo
 * @param {String} direction
 */
function connectToGzdBoundary(pointOne, pointTwo, direction) {
  const slope = getLineSlope(pointOne, pointTwo);
  // 10k mgrs resolution grid - e.g. 18TVR90
  const grid = forward([pointOne.lng, pointOne.lat], 1);
  let adjustedLongitude;
  let adjustedLatitude;

  switch (direction) {
    case 'East':
      const gzdEastLongitude = getGZD(grid.match(TEN_K_MGRS_REGEX)[GZD_INDEX]).geometry.coordinates[0][NE_INDEX][
        LONGITUDE_INDEX
      ];

      adjustedLatitude = getAdjustedLatitude(slope, gzdEastLongitude, pointTwo);
      adjustedLongitude = gzdEastLongitude;

      return { lat: adjustedLatitude, lng: adjustedLongitude };

    case 'West':
      const gzdWestLongitude = getGZD(grid.match(TEN_K_MGRS_REGEX)[GZD_INDEX]).geometry.coordinates[0][NW_INDEX][
        LONGITUDE_INDEX
      ];

      adjustedLatitude = getAdjustedLatitude(slope, gzdWestLongitude, pointTwo);

      adjustedLongitude = gzdWestLongitude;
      return { lat: adjustedLatitude, lng: adjustedLongitude };
    case 'North':
      const gzdNorthLatitude = getGZD(grid.match(TEN_K_MGRS_REGEX)[GZD_INDEX]).geometry.coordinates[0][NW_INDEX][
        LATITUDE_INDEX
      ];

      adjustedLongitude = getAdjustedLongitude(slope, gzdNorthLatitude, pointTwo);

      // Handle a special case where the west most 100k easting line in the 32V GZD extends
      // west of the boundary
      const WEST_LNG_32V_BOUNDARY = 3;
      if (
        grid.match(TEN_K_MGRS_REGEX)[GZD_INDEX] === '31V' &&
        adjustedLongitude < WEST_LNG_32V_BOUNDARY &&
        pointTwo.lng > WEST_LNG_32V_BOUNDARY
      ) {
        adjustedLatitude = getAdjustedLatitude(slope, WEST_LNG_32V_BOUNDARY, pointTwo);
        adjustedLongitude = WEST_LNG_32V_BOUNDARY;
      } else {
        adjustedLatitude = gzdNorthLatitude;
      }

      return { lat: adjustedLatitude, lng: adjustedLongitude };

    case 'South':
      const gzdSouthLatitude = getGZD(grid.match(TEN_K_MGRS_REGEX)[GZD_INDEX]).geometry.coordinates[0][SW_INDEX][
        LATITUDE_INDEX
      ];

      adjustedLongitude = getAdjustedLongitude(slope, gzdSouthLatitude, pointTwo);

      adjustedLatitude = gzdSouthLatitude;
      return { lat: adjustedLatitude, lng: adjustedLongitude };

    default:
      // TODO - lat/lng are undefined if we use this return statement
      return { lat: adjustedLatitude, lng: adjustedLongitude };
  }
}

// TODO - REFACTOR HACK
function getAllVisibleGzds(nwGzd, neGzd, seGzd, swGzd) {
  const GZD_REGEX = /([0-9]+)([A-Z])/;
  const LONGITUDE_BAND_INDEX = 1;
  const LATITUDE_BAND_INDEX = 2;

  // Short circuit
  if (nwGzd === seGzd) {
    return [nwGzd];
  }
  const nwLongitudeBand = parseInt(nwGzd.match(GZD_REGEX)[LONGITUDE_BAND_INDEX]);
  const nwLatitudeBand = nwGzd.match(GZD_REGEX)[LATITUDE_BAND_INDEX];

  const neLongitudeBand = parseInt(neGzd.match(GZD_REGEX)[LONGITUDE_BAND_INDEX]);

  const swLatitudeBand = swGzd.match(GZD_REGEX)[LATITUDE_BAND_INDEX];

  let result = [];

  const longitudeBands = []; // container for the formatted GZDs

  // If the NW GZD is 32V then also include the relevant 31 series GZDs below it
  // This ensures that grids are displayed (since 32V is larger at the expense of 31V)
  if (nwGzd === '32V') {
    longitudeBands.push('31');
  }

  // We span at least two vertical bands
  if (nwLongitudeBand !== neLongitudeBand) {
    for (let i = nwLongitudeBand; i <= neLongitudeBand; i++) {
      longitudeBands.push(i.toString());
    }
    if (nwLatitudeBand !== swLatitudeBand) {
      const initialLongitudeBand = [...longitudeBands];

      let currentLatitudeBand = swLatitudeBand;
      while (currentLatitudeBand <= nwLatitudeBand) {
        const len = initialLongitudeBand.length;

        for (let i = 0; i < len; i++) {
          result.push(initialLongitudeBand[i] + currentLatitudeBand);
        }

        currentLatitudeBand = getNextMgrsGzdCharacter(currentLatitudeBand);
      }

      result = result.flat();
    } else {
      // Append the alpha character to the array of GZDs
      const len = longitudeBands.length;
      for (let i = 0; i < len; i++) {
        longitudeBands[i] = longitudeBands[i].toString() + nwLatitudeBand;
      }
      result = longitudeBands;
    }
  } else {
    // We span a single vertical band
    let currentLatitudeBand = swLatitudeBand;
    const longitudeBand = []; // Container for the formatted GZDs

    while (currentLatitudeBand <= nwLatitudeBand) {
      longitudeBand.push(nwLongitudeBand.toString() + currentLatitudeBand);

      currentLatitudeBand = getNextMgrsGzdCharacter(currentLatitudeBand);
    }
    result = longitudeBand;
  }
  // Remove non-existant X series GZDs around Svalbard
  result = result.filter(function (a) {
    return a !== '32X' && a !== '34X' && a !== '36X';
  });

  // Add 32V if 31W is visible
  // This ensures that grids are displayed (since 32V is larger at the expense of 31V)
  if (result.includes('31W') && !result.includes('32V')) {
    result.push('32V');
  }

  // Handles a special case where 32V can be the NW and NE GZD, but the algorithm
  // doesn't show the 31U GZD
  if (neGzd === '32V' && seGzd === '32U' && !result.includes('31U')) {
    result.push('31U');
  }

  return result;
}

function drawLabel(ctx, labelText, textColor, backgroundColor, labelPosition) {
  const textWidth = ctx.measureText(labelText).width;
  const textHeight = ctx.measureText(labelText).fontBoundingBoxAscent;

  // Calculate label xy position
  const labelX = labelPosition.x;
  const labelY = labelPosition.y;

  ctx.fillStyle = backgroundColor;
  // Magic numbers will centre the rectangle over the text
  ctx.fillRect(labelX - textWidth / 2 - 1, labelY - textHeight + 1, textWidth + 3, textHeight + 2);
  ctx.fillStyle = textColor;
  ctx.fillText(labelText, labelX - textWidth / 2, labelY);
}

export {
  connectToGzdBoundary,
  drawLabel,
  getAdjustedLatitude,
  getAdjustedLongitude,
  getAllVisibleGzds,
  getLineSlope,
  getNextMgrsGzdCharacter,
};