import React, { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SunMoon } from 'lucide-react-native';
import { useWeather } from '../../contexts/WeatherContext';
import { useAstronomy } from '../../hooks/useAstronomy';
import { ScrollingScreen } from '../../components/ScrollingScreen';
import { CelestialSection } from '../../components/astronomy/CelestialSection';
import { SunlightAngle } from '../../components/astronomy/SunlightAngle';
import { DayNightGlobe } from '../../components/astronomy/DayNightGlobe';
import { TimeControl } from '../../components/astronomy/TimeControl';
import {
  skyColors,
  skyStyles as s,
} from '../../components/astronomy/skyStyles';

export default function SkyScreen() {
  const { theme, cityName, refreshLocation } = useWeather();
  const sky = useAstronomy();
  const { fontScale } = useWindowDimensions();
  const [contentWidth, setContentWidth] = useState(0);
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
  const sideBySide = contentWidth >= 350 && fontScale <= 1.3;
  return (
    <ScrollingScreen
      theme={theme}
      title="Sun & Moon"
      titleIcon={<SunMoon size={26} color={theme.text} />}
      showSettings
    >
      <View style={{ width: '100%', maxWidth: 900, alignSelf: 'center' }}>
        {!observer ? (
          <View style={[s.section, { backgroundColor: theme.surface }]}>
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
          </View>
        ) : (
          <>
            <Text style={[s.body, { color: theme.text, marginBottom: 12 }]}>
              {cityName || 'Current location'}
            </Text>
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
              <View style={{ marginBottom: 12 }}>
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
              </View>
            )}
            {day && instant && (
              <>
                {/* Stable slots keep the controls and globe mounted and preserve scroll/focus.
              Only these two read-only sections change contents at a solar-period boundary. */}
                <CelestialSection
                  body={sky.moonFirst ? 'moon' : 'sun'}
                  day={day}
                  instant={instant}
                  zone={observer.zone}
                  theme={theme}
                />
                <View
                  testID="sunlight-section"
                  style={[s.section, { backgroundColor: theme.surface }]}
                >
                  <Text
                    accessibilityRole="header"
                    style={[s.heading, { color: theme.text }]}
                  >
                    Sunlight on Earth
                  </Text>
                  <View
                    onLayout={(e) =>
                      setContentWidth(e.nativeEvent.layout.width)
                    }
                    style={{
                      flexDirection: sideBySide ? 'row' : 'column',
                      gap: 20,
                      marginTop: 14,
                    }}
                  >
                    <View style={sideBySide ? { flex: 1 } : undefined}>
                      <DayNightGlobe
                        latitude={observer.latitude}
                        longitude={observer.longitude}
                        subsolar={instant.subsolar}
                        theme={theme}
                      />
                    </View>
                  </View>
                </View>
                <CelestialSection
                  body={sky.moonFirst ? 'sun' : 'moon'}
                  day={day}
                  instant={instant}
                  zone={observer.zone}
                  theme={theme}
                />
              </>
            )}
          </>
        )}
      </View>
    </ScrollingScreen>
  );
}
