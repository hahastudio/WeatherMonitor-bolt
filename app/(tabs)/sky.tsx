import React, { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useWeather } from '../../contexts/WeatherContext';
import { useAstronomy } from '../../hooks/useAstronomy';
import { ScrollingScreen } from '../../components/ScrollingScreen';
import { CelestialSection } from '../../components/astronomy/CelestialSection';
import { DayNightGlobe } from '../../components/astronomy/DayNightGlobe';
import { useAdaptiveLayout } from '../../hooks/useAdaptiveLayout';
import { GlassSurface } from '../../components/GlassSurface';
import { TimeControl } from '../../components/astronomy/TimeControl';
import {
  skyColors,
  skyStyles as s,
} from '../../components/astronomy/skyStyles';

export default function SkyScreen() {
  const { theme, refreshLocation } = useWeather();
  const sky = useAstronomy();
  const { columns } = useAdaptiveLayout();
  const { height, fontScale } = useWindowDimensions();
  const fillViewport = columns && height >= 560 * Math.max(1, fontScale);
  const [recovering, setRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const { observer, day, instant } = sky;
  const recover = async () => {
    setRecovering(true);
    setRecoveryError(null);
    try {
      await refreshLocation();
    } catch (error) {
      setRecoveryError(
        error instanceof Error
          ? error.message
          : 'Location is unavailable. Try again in Settings.',
      );
    } finally {
      setRecovering(false);
    }
  };
  const leftStyle = { width: columns ? ('49%' as const) : ('100%' as const) };
  return (
    <ScrollingScreen
      theme={theme}
      title="Sun & Moon"
      fillViewport={fillViewport}
    >
      <View
        style={{
          width: '100%',
          alignSelf: 'center',
          flex: fillViewport ? 1 : undefined,
          minHeight: 0,
        }}
      >
        {!observer ? (
          <GlassSurface theme={theme} style={s.section}>
            <Text style={[s.heading, { color: theme.text }]}>
              Location unavailable
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: recovering }}
              disabled={recovering}
              onPress={recover}
              style={[
                s.button,
                { borderColor: skyColors(theme).line, marginTop: 12 },
              ]}
            >
              <Text style={{ color: theme.text }}>
                {recovering ? 'Finding location…' : 'Use current location'}
              </Text>
            </Pressable>
            {recoveryError && (
              <Text
                accessibilityRole="alert"
                style={[s.body, { color: theme.text, marginTop: 12 }]}
              >
                {recoveryError}
              </Text>
            )}
          </GlassSurface>
        ) : (
          <>
            <View
              testID="sky-workspace"
              style={{
                position: 'relative',
                flex: fillViewport ? 1 : undefined,
                minHeight: 0,
              }}
            >
              <View style={leftStyle}>
                {day && (
                  <TimeControl
                    day={day}
                    today={sky.today}
                    atUtcMs={sky.atUtcMs}
                    zone={observer.zone}
                    isLive={sky.isLive}
                    theme={theme}
                    onTime={sky.selectTime}
                    onDate={sky.selectDate}
                    onNow={sky.goLive}
                  />
                )}
                {sky.error && (
                  <GlassSurface theme={theme} style={s.section}>
                    <Text
                      accessibilityRole="alert"
                      style={[s.body, { color: theme.text }]}
                    >
                      {sky.error}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Now, resume live time"
                      onPress={sky.goLive}
                      style={[
                        s.button,
                        { borderColor: skyColors(theme).line, marginTop: 8 },
                      ]}
                    >
                      <Text style={{ color: theme.text }}>Now</Text>
                    </Pressable>
                  </GlassSurface>
                )}
              </View>
              {day && instant && (
                <>
                  <View
                    style={[
                      leftStyle,
                      fillViewport && {
                        flex: sky.moonFirst ? 1.22 : 1,
                        minHeight: 0,
                        marginBottom: 12,
                      },
                    ]}
                  >
                    {/* Stable slots keep the controls and globe mounted and preserve scroll/focus.
              Only these two read-only sections change contents at a solar-period boundary. */}
                    <CelestialSection
                      body={sky.moonFirst ? 'moon' : 'sun'}
                      day={day}
                      instant={instant}
                      zone={observer.zone}
                      theme={theme}
                      fitHeight={fillViewport}
                    />
                  </View>
                  <GlassSurface
                    theme={theme}
                    testID="sunlight-section"
                    style={[
                      s.section,
                      columns && {
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: '49%',
                        marginBottom: fillViewport ? 0 : 12,
                      },
                    ]}
                  >
                    <Text
                      accessibilityRole="header"
                      style={[s.heading, { color: theme.text }]}
                    >
                      Sunlight on Earth
                    </Text>
                    <DayNightGlobe
                      latitude={observer.latitude}
                      longitude={observer.longitude}
                      subsolar={instant.subsolar}
                      theme={theme}
                      expanded={columns}
                      fitHeight={fillViewport}
                    />
                  </GlassSurface>
                  <View
                    style={[
                      leftStyle,
                      fillViewport && {
                        flex: sky.moonFirst ? 1 : 1.22,
                        minHeight: 0,
                      },
                    ]}
                  >
                    <CelestialSection
                      body={sky.moonFirst ? 'sun' : 'moon'}
                      day={day}
                      instant={instant}
                      zone={observer.zone}
                      theme={theme}
                      fitHeight={fillViewport}
                    />
                  </View>
                </>
              )}
            </View>
          </>
        )}
      </View>
    </ScrollingScreen>
  );
}
