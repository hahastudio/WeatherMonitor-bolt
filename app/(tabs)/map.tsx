import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useSceneOpening } from '../../components/WeatherScenery';
import { heroLetterShadow, type WeatherTheme } from '../../utils/weatherTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
  CloudSunRain,
  Wind,
  CloudRain,
  Thermometer,
  Eye,
  RefreshCw,
  Maximize2,
} from 'lucide-react-native';
import { useWeather } from '../../contexts/WeatherContext';
import { useAdaptiveLayout } from '../../hooks/useAdaptiveLayout';
import { GlassSurface } from '../../components/GlassSurface';
import { FadingHorizontalScroll } from '../../components/FadingHorizontalScroll';

type WeatherLayer = 'weather' | 'wind' | 'rain' | 'temp' | 'clouds';

interface MapSettings {
  layer: WeatherLayer;
  zoom: number;
}

export default function MapScreen() {
  const { location, theme } = useWeather();
  const insets = useSafeAreaInsets();
  const adaptive = useAdaptiveLayout();

  const [mapSettings, setMapSettings] = useState<MapSettings>({
    layer: 'weather', // Weather is already the default
    zoom: 8,
  });
  const [mapKey, setMapKey] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const top = insets.top + (adaptive.rail ? 12 : 4);
  useSceneOpening({ headerBottom: headerHeight, insetTop: top });

  const layerOptions = [
    {
      key: 'weather',
      label: 'Weather',
      icon: CloudSunRain,
      color: '#F5B120',
      overlay: 'radar',
    },
    {
      key: 'wind',
      label: 'Wind',
      icon: Wind,
      color: '#50C878',
      overlay: 'wind',
    },
    {
      key: 'rain',
      label: 'Rain',
      icon: CloudRain,
      color: '#4A90E2',
      overlay: 'rain',
    },
    {
      key: 'temp',
      label: 'Temperature',
      icon: Thermometer,
      color: '#FF6B6B',
      overlay: 'temp',
    },
    {
      key: 'clouds',
      label: 'Clouds',
      icon: Eye,
      color: '#9370DB',
      overlay: 'clouds',
    },
  ] as const;

  // Generate Windy embed URL with correct parameters
  const generateWindyUrl = () => {
    if (!location) return '';

    const { latitude, longitude } = location;
    const { layer, zoom } = mapSettings;

    // Get the correct overlay name
    const selectedLayer = layerOptions.find((l) => l.key === layer);
    const overlay = selectedLayer?.overlay || 'weather';

    // Use the exact Windy embed URL format you specified
    const params = new URLSearchParams({
      type: 'map',
      location: 'coordinates',
      metricRain: 'mm',
      metricTemp: '°C',
      metricWind: 'km/h',
      zoom: zoom.toString(),
      overlay: overlay,
      product: 'ecmwf',
      level: 'surface',
      lat: latitude.toFixed(2),
      lon: longitude.toFixed(2),
      marker: 'true',
    });

    return `https://embed.windy.com/embed.html?${params.toString()}`;
  };

  const handleLayerChange = (newLayer: WeatherLayer) => {
    setMapSettings((prev) => ({ ...prev, layer: newLayer }));
    setMapKey((prev) => prev + 1);
  };

  const handleRefresh = () => {
    setMapKey((prev) => prev + 1);
  };

  const windyUrl = generateWindyUrl();
  const handleFullscreen = async () => {
    if (Platform.OS === 'web') {
      window.open(windyUrl, '_blank', 'noopener,noreferrer');
    } else {
      try {
        const supported = await Linking.canOpenURL(windyUrl);
        if (supported) {
          await Linking.openURL(windyUrl);
        } else {
          Alert.alert('Error', 'Cannot open the map in browser');
        }
      } catch (error) {
        console.log(error);
        Alert.alert('Error', 'Failed to open the map');
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingTop: top,
      paddingBottom: adaptive.rail
        ? insets.bottom
        : Math.max(insets.bottom, 8) + adaptive.navigationHeight + 12,
      paddingLeft: adaptive.rail ? 0 : insets.left,
      paddingRight: insets.right,
    },
    header: {
      paddingHorizontal: adaptive.rail ? 16 : 20,
      marginBottom: 8,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 48,
      marginBottom: 4,
      gap: 12,
    },
    title: {
      ...heroLetterShadow,
      color: theme.heroText,
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 4,
    },
    actionButton: {
      backgroundColor: theme.surface,
      borderRadius: 22,
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    layerSelector: {
      paddingVertical: 4,
      // Keep the outer fade gutters inside the rounded surface.
      paddingHorizontal: 20,
    },
    layerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 44,
    },
    layerButtonActive: {
      backgroundColor: theme.selection,
    },
    layerIcon: {
      marginRight: 6,
    },
    layerText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '500',
    },
    layerTextActive: {
      color: theme.text,
      fontWeight: '600',
    },
    mapContainer: {
      flex: 1,
      marginHorizontal: adaptive.rail ? 16 : 20,
      marginBottom: 20,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.glassBorder,
    },
  });

  if (!location) {
    return (
      <ActivityIndicator
        style={styles.container}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Finding map location"
        size="small"
        color={theme.primary}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View
            style={styles.headerTop}
            onLayout={({ nativeEvent }) =>
              setHeaderHeight(nativeEvent.layout.height)
            }
          >
            <Text
              style={styles.title}
              numberOfLines={1}
              accessibilityRole="header"
            >
              Weather Map
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel="Refresh map"
                onPress={handleRefresh}
              >
                <RefreshCw size={20} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel="Open map in browser"
                onPress={handleFullscreen}
              >
                <Maximize2 size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          <GlassSurface theme={theme} navigation style={styles.layerSelector}>
            <FadingHorizontalScroll
              testID="map-layers"
              contentContainerStyle={{ gap: 4 }}
            >
              {layerOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  accessibilityRole="button"
                  aria-pressed={mapSettings.layer === option.key}
                  accessibilityState={{
                    selected: mapSettings.layer === option.key,
                  }}
                  style={[
                    styles.layerButton,
                    mapSettings.layer === option.key &&
                      styles.layerButtonActive,
                  ]}
                  onPress={() => handleLayerChange(option.key)}
                >
                  <View style={styles.layerIcon}>
                    <option.icon
                      size={16}
                      color={
                        mapSettings.layer === option.key
                          ? theme.text
                          : theme.textSecondary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.layerText,
                      mapSettings.layer === option.key &&
                        styles.layerTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </FadingHorizontalScroll>
          </GlassSurface>
        </View>

        <View style={styles.mapContainer}>
          <WindyMap
            key={`${mapKey}:${windyUrl}`}
            url={windyUrl}
            theme={theme}
          />
        </View>
      </View>
    </View>
  );
}

function WindyMap({ url, theme }: { url: string; theme: WeatherTheme }) {
  const source = useMemo(() => ({ uri: url }), [url]);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>(
    'loading',
  );
  const handleError = () => setStatus('failed');

  return (
    <>
      {status === 'failed' && (
        <Text
          accessibilityRole="alert"
          style={[
            embedStyles.errorText,
            { color: theme.text, backgroundColor: theme.background },
          ]}
        >
          Map couldn’t load. Refresh or open it in your browser.
        </Text>
      )}
      {Platform.OS === 'web' ? (
        <iframe
          title="Interactive weather map"
          src={url}
          style={{ width: '100%', height: '100%', border: 0, flex: 1 }}
          onLoad={() => setStatus('loaded')}
          onError={handleError}
        />
      ) : (
        <WebView
          source={source}
          style={{ flex: 1, backgroundColor: theme.background }}
          onLoad={() => {
            // Native can finish loading an HTTP error response.
            setStatus((current) => (current === 'failed' ? current : 'loaded'));
          }}
          onError={handleError}
          onHttpError={handleError}
          renderError={() => <View />}
          injectedJavaScriptBeforeContentLoaded={`
            document.addEventListener('contextmenu', (event) => event.preventDefault());
            true;
          `}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={Platform.OS !== 'ios'}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="compatibility"
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          allowsBackForwardNavigationGestures={false}
          bounces={false}
          scrollEnabled={true}
          userAgent="Mozilla/5.0 (compatible; WeatherApp/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          originWhitelist={['https://*', 'http://*']}
          allowsLinkPreview={false}
          dataDetectorTypes={['none']}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          cacheEnabled={true}
          incognito={false}
        />
      )}
      {status === 'loading' && (
        <ActivityIndicator
          style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Loading weather map"
          size="small"
          color={theme.primary}
        />
      )}
    </>
  );
}

const embedStyles = StyleSheet.create({
  errorText: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center',
  },
});
