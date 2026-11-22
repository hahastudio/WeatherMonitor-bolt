import React from 'react';
import { render } from '@testing-library/react-native';
import { useSharedValue } from 'react-native-reanimated';
import Svg, {
  Circle,
  Ellipse,
  G,
  Image as SkyImage,
  LinearGradient,
  Mask,
  Path,
  RadialGradient,
  Rect,
} from 'react-native-svg';
import {
  WeatherScenery,
  clearNightStars,
} from '../../components/WeatherScenery';
import { getTheme, type SceneCondition } from '../../utils/weatherTheme';

const opening = {
  headerBottom: 60,
  settings: { x: 330, y: 12, width: 44, height: 44 },
  hero: {
    frame: { x: 16, y: 76, width: 358, height: 162 },
    titleWidth: 128,
    readings: [
      { x: 8, y: 10, width: 130, height: 88 },
      { x: 208, y: 68, width: 142, height: 24 },
      { x: 8, y: 118, width: 342, height: 34 },
    ],
  },
};

it.each([
  [320, 550, 14, 298, 138, 410],
  [390, 780, 90, 292, 100, 285],
  [948, 600, 90, 330, 0, 385],
])(
  'keeps all 84 static stars clear of the measured reading and Settings areas at width %i',
  (w, h, left, right, settingsBottom, bottom) => {
    const areas = [
      { x: left, width: right - left, y: 0, height: bottom },
      { x: w * 0.7, width: w * 0.3, y: 0, height: settingsBottom },
    ];
    const stars = clearNightStars(w, h, areas);
    expect(stars).toHaveLength(84);
    expect(clearNightStars(w, h, areas)).toEqual(stars);
    expect(new Set(stars.map((s) => s.opacity)).size).toBe(5);
    expect(new Set(stars.map((s) => s.radius))).toEqual(
      new Set([0.75, 1, 1.25]),
    );
    for (const { x, y, radius } of stars) {
      expect(x - radius).toBeGreaterThanOrEqual(0);
      expect(x + radius).toBeLessThanOrEqual(w);
      expect(y + radius).toBeLessThanOrEqual(h);
      expect(
        y - radius < bottom + 12 &&
          x + radius > left - 12 &&
          x - radius < right + 12,
      ).toBe(false);
      expect(y - radius < settingsBottom && x + radius > w * 0.7).toBe(false);
    }
  },
);

it('draws each static weather field and fades daylight scenery at the reading surface', () => {
  const scene = (condition: SceneCondition, dark = false, night = false) => (
    <WeatherScenery
      width={390}
      height={780}
      opening={opening}
      theme={getTheme(condition, dark, night)}
    />
  );
  const view = render(scene('clear'));
  for (const dark of [false, true]) {
    view.rerender(scene('clear', dark));
    expect(view.UNSAFE_getByType(RadialGradient).props.id).toMatch(
      /-sunlight$/,
    );
    expect(view.UNSAFE_queryAllByType(Circle)).toHaveLength(0);
    expect(view.queryByTestId('weather-particles')).toBeNull();
    view.rerender(scene('clear', dark, true));
    expect(view.UNSAFE_getAllByType(Circle)).toHaveLength(84);
    expect(view.UNSAFE_queryAllByType(RadialGradient)).toHaveLength(0);
  }
  view.rerender(scene('drizzle'));
  const [cloudMask, particleMask] = view.UNSAFE_getAllByType(Mask);
  expect(particleMask.props.height).toBe(238);
  expect(cloudMask.props.height).toBeLessThan(particleMask.props.height);
  expect(
    view.UNSAFE_getAllByType(Rect).filter((r) => r.props.width === 1),
  ).toHaveLength(16);
  for (const condition of ['rain', 'thunderstorm'] as const) {
    view.rerender(scene(condition, false, true));
    expect(view.UNSAFE_getByType(SkyImage)).toBeTruthy();
    expect(view.UNSAFE_queryAllByType(Path).length > 0).toBe(
      condition === 'thunderstorm',
    );
    expect(
      view.UNSAFE_getAllByType(Rect).filter((r) => r.props.width === 1),
    ).toHaveLength(32);
    expect(view.UNSAFE_queryAllByType(Circle)).toHaveLength(0);
  }
  view.rerender(scene('snow', true));
  expect(view.UNSAFE_getAllByType(Circle)).toHaveLength(24);
  view.rerender(scene('clouds', false, true));
  expect(view.UNSAFE_getByType(SkyImage).props.preserveAspectRatio).toBe(
    'xMaxYMin slice',
  );
  view.rerender(scene('mist', true, true));
  expect(view.UNSAFE_getAllByType(Ellipse)).toHaveLength(3);
});

it.each([
  [320, 0],
  [840, 76],
])(
  'casts soft daylight rays down from the upper left at width %i',
  (width, railInset) => {
    const view = render(
      <WeatherScenery
        theme={getTheme('clear')}
        width={width}
        height={780}
        opening={opening}
        railInset={railInset}
      />,
    );
    const source = view.UNSAFE_getAllByType(G).find((g) => g.props.transform);
    const [x, y] = source!.props.transform.match(/[-\d.]+/g).map(Number);
    expect(x).toBeLessThan(railInset);
    expect(y).toBeLessThan(0);
    const rays = source!.findAllByType(Ellipse);
    const angles = rays.map(({ props }) =>
      Number(props.transform.match(/\d+/)[0]),
    );
    expect(new Set(angles).size).toBeGreaterThan(2);
    for (const angle of angles) {
      expect(angle).toBeGreaterThan(0);
      expect(angle).toBeLessThan(90);
    }
    for (const { props } of rays) {
      expect(props.rx).toBeGreaterThan(5 * props.ry);
      expect(props.fill).toMatch(/-sunlight\)$/);
    }
    expect(view.UNSAFE_getByType(Mask).props.height).toBe(
      opening.hero.frame.y + opening.hero.frame.height,
    );
  },
);

it('extends and brightens the phone cloud bank with reported cloud cover', () => {
  const scene = (cloudCover: number) => (
    <WeatherScenery
      theme={getTheme('clouds')}
      width={390}
      height={780}
      opening={opening}
      cloudCover={cloudCover}
    />
  );
  const view = render(scene(5));
  const sparse = view.UNSAFE_getByType(SkyImage).props;
  view.rerender(scene(100));
  const overcast = view.UNSAFE_getByType(SkyImage).props;
  expect(overcast.y + overcast.height).toBeGreaterThan(
    sparse.y + sparse.height,
  );
  expect(overcast.opacity).toBeGreaterThan(sparse.opacity);
  expect(overcast.href).toEqual(sparse.href);
});

it('places stars in the gaps between the measured title, controls and split readings', () => {
  const insetTop = 38;
  const view = render(
    <WeatherScenery
      theme={getTheme('clear', false, true)}
      width={390}
      height={780}
      opening={{ ...opening, insetTop }}
    />,
  );
  const { frame, readings, titleWidth } = opening.hero;
  const areas = [
    {
      x: frame.x,
      y: insetTop,
      width: titleWidth,
      height: opening.headerBottom,
    },
    { ...opening.settings, y: insetTop + opening.settings.y },
    ...readings.map((box) => ({
      ...box,
      x: frame.x + box.x,
      y: insetTop + frame.y + box.y,
    })),
  ];
  const visible = view
    .UNSAFE_getAllByType(Circle)
    .map((circle) => circle.props)
    .filter(({ cy }) => cy < insetTop + frame.y + frame.height);
  expect(
    visible.some(({ cx, cy }) => cx > 160 && cx < 320 && cy > insetTop + 20),
  ).toBe(true);
  for (const { cx, cy, r } of visible) {
    expect(cy - r).toBeGreaterThanOrEqual(insetTop);
    for (const box of areas) {
      expect(
        cx + r <= box.x - 12 ||
          cx - r >= box.x + box.width + 12 ||
          cy + r <= box.y - 12 ||
          cy - r >= box.y + box.height + 12,
      ).toBe(true);
    }
  }
});

it('uses the whole unfolded window for every weather field and its fade', () => {
  const scene = (
    condition: SceneCondition,
    night = false,
    width = 840,
    railInset = 76,
  ) => (
    <WeatherScenery
      theme={getTheme(condition, false, night)}
      width={width}
      height={800}
      opening={opening}
      railInset={railInset}
    />
  );
  const view = render(scene('clouds'));
  for (const condition of [
    'clouds',
    'drizzle',
    'rain',
    'snow',
    'mist',
    'thunderstorm',
  ] as const) {
    view.rerender(scene(condition));
    const field = view.UNSAFE_getAllByType(Svg)[0].props;
    expect(field.width).toBe(840);
    for (const { props: mask } of view.UNSAFE_getAllByType(Mask)) {
      expect([mask.x, mask.width, mask.height]).toEqual([0, 840, field.height]);
    }
    const fade = view
      .UNSAFE_getAllByType(LinearGradient)
      .find((g) => g.props.id.endsWith('-fade'))!.props;
    expect(fade.x1).toBe(fade.x2);
    expect(fade.y2).toBe(field.height);
    if (condition !== 'mist')
      expect(view.UNSAFE_getByType(SkyImage).props.width).toBe(840);
    if (
      condition === 'snow' ||
      ['drizzle', 'rain', 'thunderstorm'].includes(condition)
    ) {
      const xs =
        condition === 'snow'
          ? view
              .UNSAFE_getAllByType(Circle)
              .filter((n) => n.props.cy < field.height)
              .map((n) => n.props.cx)
          : view
              .UNSAFE_getAllByType(Rect)
              .filter((n) => n.props.width === 1 && n.props.y < field.height)
              .map((n) => n.props.x);
      expect(Math.min(...xs)).toBeLessThan(840 / 2);
      expect(Math.max(...xs)).toBeGreaterThan(840 / 2);
    }
  }
  view.rerender(scene('clouds', true));
  const photo = view.UNSAFE_getByType(SkyImage).props;
  expect(view.UNSAFE_getAllByType(G).some((group) => group.props.mask)).toBe(
    true,
  );
  expect(view.UNSAFE_getByType(Mask).props.height).toBeCloseTo(
    photo.y + photo.height,
  );
  view.rerender(scene('clear', true));
  const stars = view.UNSAFE_getAllByType(Circle);
  expect(stars).toHaveLength(84);
  for (const {
    props: { cx, cy, r },
  } of stars) {
    for (const box of opening.hero.readings) {
      const x = 76 + opening.hero.frame.x + box.x;
      const y = opening.hero.frame.y + box.y;
      expect(
        cy - r < y + box.height &&
          cy + r > y &&
          cx + r > x &&
          cx - r < x + box.width,
      ).toBe(false);
    }
  }
  view.rerender(scene('clouds', false, 390, 0));
  expect(view.UNSAFE_getByType(SkyImage).props.preserveAspectRatio).toBe(
    'xMaxYMin slice',
  );
  expect(view.UNSAFE_getByType(Svg).props.width).toBe(390);
});

it.each([
  [390, 0, 100, 0, 205],
  [840, 76, 0, 175, 130],
  [840, 76, 0, 350, 0],
])(
  'keeps flakes in the uncovered sky at width %i with pane and screen scrolling',
  (width, railInset, screenOffset, paneOffset, visibleHeight) => {
    function Scene() {
      const scroll = useSharedValue(screenOffset);
      const heroScroll = useSharedValue(paneOffset);
      return (
        <WeatherScenery
          theme={getTheme('snow', false, true)}
          width={width}
          height={800}
          opening={{
            headerBottom: 76,
            insetTop: 10,
            scroll,
            hero: {
              ...opening.hero,
              frame: { x: 16, y: 76, width: 358, height: 219 },
              scroll: heroScroll,
            },
          }}
          railInset={railInset}
        />
      );
    }
    const view = render(<Scene />);
    const particles = view.getByTestId('weather-particles');
    expect(particles).toHaveStyle({
      left: railInset,
      width: railInset ? 374 : width,
      height: visibleHeight,
      overflow: 'hidden',
    });
    expect(particles.findAllByType(Circle)).not.toHaveLength(0);
    expect(particles.findAllByType(SkyImage)).toHaveLength(0);
    if (railInset)
      expect(view.UNSAFE_getByType(SkyImage).props.width).toBe(width);
  },
);
