import React from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';
import {
  GlassSurface,
  SurfacePreferences,
} from '../../components/GlassSurface';
import { defaultTheme, getTheme } from '../../utils/weatherTheme';

it('uses an opaque surface when reduced transparency is requested, keeping text opaque', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
    .mockResolvedValue(true);
  render(
    <SurfacePreferences>
      <GlassSurface theme={defaultTheme}>
        <Text>Forecast values</Text>
      </GlassSurface>
    </SurfacePreferences>,
  );
  await waitFor(() =>
    expect(screen.getByTestId('glass-fill')).toHaveStyle({
      backgroundColor: defaultTheme.surface,
    }),
  );
  expect(screen.queryByTestId('glass-blur')).toBeNull();
  expect(screen.getByText('Forecast values')).not.toHaveStyle({
    opacity: 0.72,
  });
  jest.restoreAllMocks();
});
it('provides an opaque dense-chart surface in both appearances', () => {
  const view = render(
    <GlassSurface theme={defaultTheme} opaque>
      <Text>Chart</Text>
    </GlassSurface>,
  );
  expect(screen.getByTestId('glass-fill')).toHaveStyle({
    backgroundColor: '#E7F3FF',
  });
  view.rerender(
    <GlassSurface theme={getTheme('clear', true)} opaque>
      <Text>Chart</Text>
    </GlassSurface>,
  );
  expect(screen.getByTestId('glass-fill')).toHaveStyle({
    backgroundColor: '#112C52',
  });
});
