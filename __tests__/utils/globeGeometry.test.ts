import { projectGlobe } from '../../utils/globeGeometry';
it.each([
  [-180, 0],
  [180, 0],
  [0, 90],
  [0, -90],
  [121.47, 31.23],
])(
  'clips a finite globe at longitude %s latitude %s',
  (longitudeDeg, latitudeDeg) => {
    const camera = { longitudeDeg, latitudeDeg },
      paths = projectGlobe(camera, camera, camera);
    for (const path of [paths.land, paths.grid, paths.night])
      expect(path).not.toMatch(/NaN|Infinity/);
    expect(paths.land.length).toBeGreaterThan(100);
    expect(paths.observer![0]).toBeCloseTo(110, 5);
    expect(paths.subsolar![1]).toBeCloseTo(110, 5);
    const opposite = {
      longitudeDeg: longitudeDeg + 180,
      latitudeDeg: -latitudeDeg,
    };
    const far = projectGlobe(camera, opposite, opposite);
    expect(far.observer).toBeNull();
    expect(far.subsolar).toBeNull();
  },
);

it.each([
  [-0.6, -12.2],
  [179, 23.4],
  [-80, -23.4],
])(
  'shows a fully lit hemisphere when looking at the Sun at %s,%s',
  (longitudeDeg, latitudeDeg) => {
    const sun = { longitudeDeg, latitudeDeg };
    expect(projectGlobe(sun, sun, sun).night).toBe('');
    const midnight = {
      longitudeDeg: longitudeDeg + 180,
      latitudeDeg: -latitudeDeg,
    };
    expect(projectGlobe(midnight, sun, sun).night.length).toBeGreaterThan(100);
  },
);
