import React from 'react';
import { render } from '@testing-library/react-native';
import { useSharedValue } from 'react-native-reanimated';
import Svg, {
  Circle,
  Ellipse,
  Image as SkyImage,
  LinearGradient,
  Mask,
  Rect,
} from 'react-native-svg';
import {
  WeatherScenery,
  clearNightStars,
} from '../../components/WeatherScenery';
import { getTheme, type SceneCondition } from '../../utils/weatherTheme';

it.each([
  [320, 550, 14, 298, 138, 410],
  [390, 780, 90, 292, 100, 285],
  [948, 600, 90, 330, 0, 385],
])(
  'keeps all 84 static stars clear of the measured reading and Settings areas at width %i',
  (w, h, left, right, settingsBottom, bottom) => {
    const bounds = { left, right, top: 0, bottom };
    const stars = clearNightStars(w, h, bounds, settingsBottom);
    expect(stars).toHaveLength(84);
    expect(clearNightStars(w, h, bounds, settingsBottom)).toEqual(stars);
    expect(new Set(stars.map((s) => s.opacity)).size).toBe(5);
    expect(new Set(stars.map((s) => s.radius)).size).toBe(3);
    for (const { x, y, radius } of stars) {
      expect(x - radius).toBeGreaterThanOrEqual(0);
      expect(x + radius).toBeLessThanOrEqual(w);
      expect(y + radius).toBeLessThanOrEqual(h);
      expect(
        y - radius < bottom && x + radius > left && x - radius < right,
      ).toBe(false);
      expect(y - radius < settingsBottom && x + radius > w * 0.7).toBe(false);
    }
  },
);

it('draws each static weather field and fades daylight scenery at the reading surface', () => {
  const opening = {
    headerBottom: 70,
    settings: true,
    hero: {
      x: 16,
      width: 358,
      bottom: 340,
      textLeft: 85,
      textRight: 280,
    },
  };
  const scene = (condition: SceneCondition, dark = false, night = false) => (
    <WeatherScenery
      width={390}
      height={780}
      opening={opening}
      theme={getTheme(condition, dark, night)}
    />
  );
  const view = render(scene('clear'));
  expect(view.toJSON()).toBeNull();
  for (const dark of [false, true]) {
    view.rerender(scene('clear', dark, true));
    expect(view.UNSAFE_getAllByType(Circle)).toHaveLength(84);
    expect(view.UNSAFE_queryAllByType(Ellipse)).toHaveLength(0);
  }
  view.rerender(scene('drizzle'));
  expect(
    view.UNSAFE_getAllByType(Mask).map((mask) => mask.props.height),
  ).toEqual([340, 340]);
  expect(
    view.UNSAFE_getAllByType(Rect).filter((r) => r.props.width === 1),
  ).toHaveLength(16);
  for (const condition of ['rain', 'thunderstorm'] as const) {
    view.rerender(scene(condition, false, true));
    expect(view.UNSAFE_queryAllByType(Mask)).toHaveLength(0);
    expect(
      view.UNSAFE_getAllByType(Rect).filter((r) => r.props.width === 1),
    ).toHaveLength(32);
    expect(view.UNSAFE_queryAllByType(Circle)).toHaveLength(0);
  }
  view.rerender(scene('snow', true));
  expect(view.UNSAFE_getAllByType(Circle)).toHaveLength(24);
  view.rerender(scene('clouds', false, true));
  expect(view.UNSAFE_getAllByType(Ellipse)).toHaveLength(9);
  view.rerender(scene('mist', true, true));
  expect(view.UNSAFE_getAllByType(Rect)).toHaveLength(3);
});

it('uses the whole unfolded window for every weather field and its fade', () => {
  const opening = {
    headerBottom: 76,
    hero: { x: 16, width: 360, bottom: 295, textLeft: 45, textRight: 198 },
  };
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
  expect(photo.mask).toBeTruthy();
  expect(view.UNSAFE_getByType(Mask).props.height).toBeCloseTo(
    photo.y + photo.height,
  );
  view.rerender(scene('clear', true));
  const stars = view.UNSAFE_getAllByType(Circle);
  expect(stars).toHaveLength(84);
  for (const {
    props: { cx, cy, r },
  } of stars) {
    expect(
      cy - r < opening.hero.bottom && cx + r > 76 + 45 && cx - r < 76 + 198,
    ).toBe(false);
  }
  view.rerender(scene('clear'));
  expect(view.toJSON()).toBeNull();
  view.rerender(scene('clouds', false, 390, 0));
  expect(view.UNSAFE_queryAllByType(SkyImage)).toHaveLength(0);
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
              x: 16,
              width: 358,
              bottom: 295,
              textLeft: 45,
              textRight: 198,
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
      width: 374,
      height: visibleHeight,
      overflow: 'hidden',
    });
    expect(particles.findAllByType(Circle)).not.toHaveLength(0);
    expect(particles.findAllByType(SkyImage)).toHaveLength(0);
    if (railInset)
      expect(view.UNSAFE_getByType(SkyImage).props.width).toBe(width);
  },
);
