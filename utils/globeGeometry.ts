import {
  geoCircle,
  geoDistance,
  geoGraticule10,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from 'd3-geo';
import type { EarthPoint } from '../types/astronomy';
import land from '../assets/astronomy/world-land.json';

const graticule = geoGraticule10();
const point = (p: EarthPoint): [number, number] => [
  p.longitudeDeg,
  p.latitudeDeg,
];

export function projectGlobe(
  camera: EarthPoint,
  subsolar: EarthPoint,
  observer: EarthPoint,
) {
  const center = point(camera);
  const projection = geoOrthographic()
    .rotate([-camera.longitudeDeg, -camera.latitudeDeg])
    .translate([110, 110])
    .scale(104)
    // Avoid coincident great-circle boundaries when looking directly at the Sun.
    // This subpixel inset prevents d3's polygon clip from inverting the night cap.
    .clipAngle(89.999);
  const path = geoPath(projection);
  const night = geoCircle()
    .center([subsolar.longitudeDeg + 180, -subsolar.latitudeDeg])
    .radius(90)
    .precision(3)();
  const marker = (p: EarthPoint) =>
    geoDistance(center, point(p)) < Math.PI / 2 ? projection(point(p)) : null;
  return {
    land: path(land as GeoPermissibleObjects) || '',
    grid: path(graticule) || '',
    night: path(night) || '',
    observer: marker(observer),
    subsolar: marker(subsolar),
  };
}

export function coordinateLabel(point: EarthPoint): string {
  return `${Math.abs(point.latitudeDeg).toFixed(1)}°${point.latitudeDeg >= 0 ? 'N' : 'S'}, ${Math.abs(point.longitudeDeg).toFixed(1)}°${point.longitudeDeg >= 0 ? 'E' : 'W'}`;
}
