import {
  connectToGzdBoundary,
  getAdjustedLatitude,
  getAdjustedLongitude,
  getAllVisibleGzds,
  getLineSlope,
  getNextMgrsGzdCharacter,
} from './CommonUtils';

describe('Line slope test cases', () => {
  it('Give the proper line slope', () => {
    const pointOneArray = [
      { lat: -89, lng: -135 },
      { lat: -36, lng: 18 },
      { lat: 87, lng: 94 },
      { lat: 87, lng: -67 },
      { lat: 19, lng: -115 },
      { lat: -63, lng: -112 },
      { lat: -5, lng: 78 },
    ];

    const pointTwoArray = [
      { lat: 46, lng: -23 },
      { lat: -31, lng: 144 },
      { lat: -14, lng: 78 },
      { lat: 32, lng: 136 },
      { lat: -72, lng: 95 },
      { lat: -24, lng: -100 },
      { lat: -51, lng: 121 },
    ];
    const resultArray = [1.205357143, 0.03968254, 6.3125, -0.270935961, -0.433333333, 3.25, -1.069767442];

    resultArray.forEach((expectedResult, index) => {
      expect(getLineSlope(pointOneArray[index], pointTwoArray[index])).toBeCloseTo(expectedResult, 3);
    });
  });

  it('Handle zero slope', () => {
    const LATITUDE = 42;
    const pointOne = { lat: LATITUDE, lng: 57 };
    const pointTwo = { lat: LATITUDE, lng: 62 };

    expect(getLineSlope(pointOne, pointTwo)).toBe(0);
  });

  it('Handle an infinite slope', () => {
    const LONGITUDE = 65;
    const pointOne = { lat: 45, lng: LONGITUDE };
    const pointTwo = { lat: 62, lng: LONGITUDE };

    expect(getLineSlope(pointOne, pointTwo)).toBeNaN();
  });

  it('Handle two identical points', () => {
    const pointOne = { lat: -89, lng: -135 };
    const pointTwo = pointOne;

    expect(getLineSlope(pointOne, pointTwo)).toBe(0);
  });
});

describe('getNextMgrsGzdCharacter test cases', () => {
  it('Should produce the next alphabetical character (exluding invalid)', () => {
    const inputArray = [
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'J',
      'K',
      'L',
      'M',
      'N',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
    ];
    const outputArray = [
      'D',
      'E',
      'F',
      'G',
      'H',
      'J',
      'K',
      'L',
      'M',
      'N',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
    ];

    inputArray.forEach((elem, index) => {
      expect(getNextMgrsGzdCharacter(elem)).toBe(outputArray[index]);
    });
  });
});

describe('getAdjustedLatitude test cases', () => {
  it('Handle an infinite slope', () => {
    const slope = NaN;
    const adjustedLongitude = 18;
    const unadjustedLatLong = {
      lat: 80,
      lng: -70,
    };
    expect(getAdjustedLatitude(slope, adjustedLongitude, unadjustedLatLong)).toBe(unadjustedLatLong.lat);
  });

  it('Handle zero slope', () => {
    const slope = 0;
    const adjustedLongitude = 18;
    const unadjustedLatLong = {
      lat: 80,
      lng: -70,
    };
    expect(getAdjustedLatitude(slope, adjustedLongitude, unadjustedLatLong)).toBe(unadjustedLatLong.lat);
  });

  it('General use cases', () => {
    const slopes = [0.0194957, -0.0174, 0.0206431];

    const adjustedLatitudes = [-72, 132, 138];

    const unadjustedLatLongs = [
      { lat: 55.934976, lng: -70.600782 },
      { lat: -26.20563, lng: 132.998304 },
      { lat: 31.617775, lng: 138.891514 },
    ];

    const results = [55.90769, -26.188262, 31.59937];

    results.forEach((elem, idx) => {
      expect(getAdjustedLatitude(slopes[idx], adjustedLatitudes[idx], unadjustedLatLongs[idx])).toBeCloseTo(elem, 2);
    });
  });
});

describe('getAdjustedLongitude test cases', () => {
  it('Handle an infinite slope', () => {
    const slope = NaN;
    const adjustedLatitude = 80;
    const unadjustedLatLong = {
      lat: 80,
      lng: -70,
    };
    expect(getAdjustedLongitude(slope, adjustedLatitude, unadjustedLatLong)).toBe(unadjustedLatLong.lng);
  });

  it('General use cases', () => {
    const slopes = [-19.950875, 204.407597, 24.939428];

    const adjustedLatitudes = [48, -16, 56];

    const unadjustedLatLongs = [
      { lat: 46.92338, lng: -48.37299 },
      { lat: -17.18262, lng: 8.05965 },
      { lat: 55.036748, lng: 100.564765 },
    ];

    const results = [-48.42695, 8.06543, 100.60338];

    results.forEach((elem, idx) => {
      expect(getAdjustedLongitude(slopes[idx], adjustedLatitudes[idx], unadjustedLatLongs[idx])).toBeCloseTo(elem, 2);
    });
  });

  it('Handle zero slope', () => {
    const slope = 0;
    const adjustedLatitude = 80;
    const unadjustedLatLong = {
      lat: 80,
      lng: -70,
    };
    expect(() => {
      getAdjustedLongitude(slope, adjustedLatitude, unadjustedLatLong);
    }).toThrow(Error);
  });
});

describe('connectToGzdBoundary test cases', () => {
  it('Handle North', () => {
    const pointOne = {
      lat: 46.046265,
      lng: -76.292532,
    };
    const pointTwo = {
      lat: 45.146392,
      lng: -76.272032,
    };
    const expectedResult = {
      lat: 48,
      lng: -76.33703,
    };

    const result = connectToGzdBoundary(pointOne, pointTwo, 'North');
    expect(result.lat).toBe(expectedResult.lat);
    expect(result.lng).toBeCloseTo(expectedResult.lng, 2);
  });
  it('Handle South', () => {
    const pointOne = {
      lat: 44.24637,
      lng: -76.252477,
    };
    const pointTwo = {
      lat: 45.146392,
      lng: -76.27203,
    };
    const expectedResult = {
      lat: 40,
      lng: -76.16021,
    };

    const result = connectToGzdBoundary(pointOne, pointTwo, 'South');
    expect(result.lat).toBe(expectedResult.lat);
    expect(result.lng).toBeCloseTo(expectedResult.lng, 2);
  });
  it('Handle East', () => {
    const pointOne = {
      lat: 51.41588,
      lng: -66.12371,
    };
    const pointTwo = {
      lat: 51.44235,
      lng: -67.56112,
    };
    const expectedResult = {
      lat: 51.413605,
      lng: -66,
    };

    const result = connectToGzdBoundary(pointOne, pointTwo, 'East');
    expect(result.lat).toBeCloseTo(expectedResult.lat, 2);
    expect(result.lng).toBe(expectedResult.lng);
  });
  it('Handle West', () => {
    const pointOne = {
      lat: 44.225784,
      lng: -77.50406,
    };
    const pointTwo = {
      lat: 44.24637,
      lng: -76.252477,
    };
    const expectedResult = {
      lat: 44.21762,
      lng: -78,
    };

    const result = connectToGzdBoundary(pointOne, pointTwo, 'West');
    expect(result.lat).toBeCloseTo(expectedResult.lat, 2);
    expect(result.lng).toBe(expectedResult.lng);
  });

  it('Handle that special case for 31V northwestmost easting line', () => {
    const pointOne = {
      lat: 63.89754,
      lng: 2.88178,
    };
    const pointTwo = {
      lat: 63.00502,
      lng: 3.07004,
    };
    const expectedResult = {
      lat: 63.3371,
      lng: 3,
    };

    const result = connectToGzdBoundary(pointOne, pointTwo, 'North');
    expect(result.lat).toBeCloseTo(expectedResult.lat, 2);
    expect(result.lng).toBe(expectedResult.lng);
  });
});

describe('getAllVisibleGzds test cases', () => {
  it('Handle only one GZD', () => {
    const nwGzd = '18T';
    const neGzd = '18T';
    const seGzd = '18T';
    const swGzd = '18T';

    const result = ['18T'];

    expect(getAllVisibleGzds(nwGzd, neGzd, seGzd, swGzd)).toStrictEqual(result);
  });
  it('Handle a vertical band', () => {
    const nwGzd = '18T';
    const neGzd = '18T';
    const seGzd = '18H';
    const swGzd = '18H';

    const result = ['18H', '18J', '18K', '18L', '18M', '18N', '18P', '18Q', '18R', '18S', '18T'];

    expect(getAllVisibleGzds(nwGzd, neGzd, seGzd, swGzd)).toStrictEqual(result);
  });
  it('Handle a horizontal band', () => {
    const nwGzd = '30V';
    const neGzd = '36V';
    const seGzd = '36V';
    const swGzd = '30V';

    const result = ['30V', '31V', '32V', '33V', '34V', '35V', '36V'];

    expect(getAllVisibleGzds(nwGzd, neGzd, seGzd, swGzd)).toStrictEqual(result);
  });
  it('Handle a region covering multiple horizontal and vertical bands', () => {
    const nwGzd = '6L';
    const neGzd = '10L';
    const seGzd = '6J';
    const swGzd = '10J';

    const result = ['6J', '7J', '8J', '9J', '10J', '6K', '7K', '8K', '9K', '10K', '6L', '7L', '8L', '9L', '10L'];

    expect(getAllVisibleGzds(nwGzd, neGzd, seGzd, swGzd)).toStrictEqual(result);
  });
  it('Handle NW GZD as 32V - Ensure 31U and south is also returned', () => {
    const nwGzd = '32V';
    const neGzd = '33V';
    const seGzd = '33S';
    const swGzd = '32S';

    const result = ['31S', '32S', '33S', '31T', '32T', '33T', '31U', '32U', '33U', '31V', '32V', '33V'];

    expect(getAllVisibleGzds(nwGzd, neGzd, seGzd, swGzd)).toStrictEqual(result);
  });
  it('Handle NE GZD as 31W - Ensure 32V is also returned', () => {
    const nwGzd = '29W';
    const neGzd = '31W';
    const seGzd = '31U';
    const swGzd = '29U';

    const result = ['29U', '30U', '31U', '29V', '30V', '31V', '29W', '30W', '31W', '32V'];

    expect(getAllVisibleGzds(nwGzd, neGzd, seGzd, swGzd)).toStrictEqual(result);
  });

  it('Handle Svalbard', () => {
    const nwGzd = '30X';
    const neGzd = '38X';
    const seGzd = '38X';
    const swGzd = '30X';

    const result = ['30X', '31X', '33X', '35X', '37X', '38X'];

    expect(getAllVisibleGzds(nwGzd, neGzd, seGzd, swGzd)).toStrictEqual(result);
  });

  it('Handle special case where 32V is NW and NE, but 31U is not shown', () => {
    const nwGzd = '32V';
    const neGzd = '32V';
    const seGzd = '32U';
    const swGzd = '31U';

    const result = ['32U', '32V', '31U'];

    expect(getAllVisibleGzds(nwGzd, neGzd, seGzd, swGzd)).toStrictEqual(result);
  });

  it('Handle special case where 32V is NW and NE and 31U is the only other visible GZD', () => {
    const nwGzd = '32V';
    const neGzd = '32V';
    const seGzd = '31U';
    const swGzd = '31U';

    const result = ['32U', '32V', '31U'];

    expect(getAllVisibleGzds(nwGzd, neGzd, seGzd, swGzd)).toStrictEqual(result);
  });
});
