import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { 
  Map as MapIcon, 
  Layers, 
  Wind, 
  CloudRain, 
  Thermometer, 
  Eye,
  RefreshCw,
  Maximize2,
  Settings as SettingsIcon
} from 'lucide-react-native';
import { useWeather } from '../../contexts/WeatherContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';

type WeatherLayer = 'wind' | 'rain' | 'temp' | 'clouds' | 'pressure';

interface MapSettings {
  layer: WeatherLayer;
  zoom: number;
  overlay: string;
}

export default function MapScreen() {
  const { 
    location, 
    theme, 
    cityName,
    loading: weatherLoading 
  } = useWeather();

  const [mapSettings, setMapSettings] = useState<MapSettings>({
    layer: 'wind',
    zoom: 8,
    overlay: 'wind'
  });
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [showLayerSelector, setShowLayerSelector] = useState(false);

  const layerOptions = [
    { key: 'wind', label: 'Wind', icon: Wind, color: '#50C878' },
    { key: 'rain', label: 'Rain', icon: CloudRain, color: '#4A90E2' },
    { key: 'temp', label: 'Temperature', icon: Thermometer, color: '#FF6B6B' },
    { key: 'clouds', label: 'Clouds', icon: Eye, color: '#9370DB' },
  ] as const;

  // Generate Windy embed URL
  const generateWindyUrl = () => {
    if (!location) return '';

    const { latitude, longitude } = location;
    const { layer, zoom } = mapSettings;
    
    // Map our layer names to Windy's overlay names
    const overlayMap: Record<WeatherLayer, string> = {
      wind: 'wind',
      rain: 'rain',
      temp: 'temp',
      clouds: 'clouds',
      pressure: 'pressure'
    };

    const overlay = overlayMap[layer];
    
    // Build Windy embed URL with configuration
    const baseUrl = 'https://embed.windy.com/embed.html';
    const params = new URLSearchParams({
      type: 'map',
      location: 'coordinates',
      metricWind: 'km/h',
      metricTemp: '°C',
      metricRain: 'mm',
      metricPressure: 'hPa',
      zoom: zoom.toString(),
      overlay: overlay,
      product: 'ecmwf',
      level: 'surface',
      lat: latitude.toString(),
      lon: longitude.toString(),
      detailLat: latitude.toString(),
      detailLon: longitude.toString(),
      marker: 'true',
      message: 'true',
      calendar: 'now',
      pressure: 'true',
      type: 'map',
      actualGrid: 'true',
      menu: 'true'
    });

    return `${baseUrl}?${params.toString()}`;
  };

  const handleLayerChange = (newLayer: WeatherLayer) => {
    setMapSettings(prev => ({ ...prev, layer: newLayer }));
    setShowLayerSelector(false);
  };

  const handleRefresh = () => {
    setWebViewError(null);
    setWebViewLoading(true);
    // Force WebView to reload by updating a key or reloading
  };

  const handleFullscreen = () => {
    if (Platform.OS === 'web') {
      const url = generateWindyUrl();
      window.open(url, '_blank');
    } else {
      Alert.alert(
        'Open in Browser',
        'Would you like to open the full Windy map in your browser?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open', 
            onPress: () => {
              // On mobile, you could use Linking.openURL(generateWindyUrl())
              console.log('Open in browser:', generateWindyUrl());
            }
          }
        ]
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
      paddingTop: 60,
    },
    header: {
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      color: theme.text,
      fontSize: 28,
      fontWeight: '700',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      backgroundColor: theme.surface + '80',
      borderRadius: 20,
      padding: 8,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 16,
      marginBottom: 12,
    },
    layerSelector: {
      flexDirection: 'row',
      gap: 8,
    },
    layerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface + '60',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    layerButtonActive: {
      backgroundColor: theme.primary + '20',
      borderColor: theme.primary,
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
      color: theme.primary,
      fontWeight: '600',
    },
    mapContainer: {
      flex: 1,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: theme.surface,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    webView: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    loadingText: {
      color: theme.text,
      fontSize: 16,
      marginTop: 12,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.background,
    },
    errorText: {
      color: theme.accent,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 22,
    },
    retryButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    infoCard: {
      backgroundColor: theme.surface + '90',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 20,
      marginBottom: 16,
    },
    infoTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    infoText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    layerSelectorModal: {
      position: 'absolute',
      top: 120,
      left: 20,
      right: 20,
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      zIndex: 1000,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        },
      }),
    },
    modalTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
    },
    modalLayerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 8,
    },
    modalLayerButtonActive: {
      backgroundColor: theme.primary + '20',
    },
    modalLayerText: {
      color: theme.text,
      fontSize: 16,
      marginLeft: 12,
    },
    modalLayerTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
  });

  if (weatherLoading || !location) {
    return <LoadingSpinner message="Loading map location..." />;
  }

  const windyUrl = generateWindyUrl();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Weather Map</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleRefresh}>
                <RefreshCw size={20} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => setShowLayerSelector(!showLayerSelector)}>
                <Layers size={20} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleFullscreen}>
                <Maximize2 size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.subtitle}>{cityName}</Text>
          
          <View style={styles.layerSelector}>
            {layerOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.layerButton,
                  mapSettings.layer === option.key && styles.layerButtonActive,
                ]}
                onPress={() => handleLayerChange(option.key)}
              >
                <View style={styles.layerIcon}>
                  <option.icon 
                    size={16} 
                    color={mapSettings.layer === option.key ? theme.primary : option.color} 
                  />
                </View>
                <Text 
                  style={[
                    styles.layerText,
                    mapSettings.layer === option.key && styles.layerTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {showLayerSelector && (
          <View style={styles.layerSelectorModal}>
            <Text style={styles.modalTitle}>Select Weather Layer</Text>
            {layerOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.modalLayerButton,
                  mapSettings.layer === option.key && styles.modalLayerButtonActive,
                ]}
                onPress={() => handleLayerChange(option.key)}
              >
                <option.icon 
                  size={20} 
                  color={mapSettings.layer === option.key ? theme.primary : option.color} 
                />
                <Text 
                  style={[
                    styles.modalLayerText,
                    mapSettings.layer === option.key && styles.modalLayerTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.mapContainer}>
          {webViewError ? (
            <View style={styles.errorContainer}>
              <MapIcon size={48} color={theme.textSecondary} />
              <Text style={styles.errorText}>
                Failed to load weather map.{'\n'}
                Please check your internet connection and try again.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <WebView
                source={{ uri: windyUrl }}
                style={styles.webView}
                onLoadStart={() => setWebViewLoading(true)}
                onLoadEnd={() => setWebViewLoading(false)}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  setWebViewError(nativeEvent.description || 'Failed to load map');
                  setWebViewLoading(false);
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                mixedContentMode="compatibility"
                thirdPartyCookiesEnabled={true}
                sharedCookiesEnabled={true}
                userAgent="Mozilla/5.0 (compatible; WeatherApp/1.0)"
              />
              
              {webViewLoading && (
                <View style={styles.loadingContainer}>
                  <LoadingSpinner message="Loading interactive weather map..." />
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Interactive Weather Map</Text>
          <Text style={styles.infoText}>
            Explore real-time weather data with Windy's interactive map. 
            Switch between different weather layers, zoom in/out, and tap on the map for detailed forecasts at any location.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}