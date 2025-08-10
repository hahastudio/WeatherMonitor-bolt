import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { 
  Map as MapIcon, 
  Layers, 
  CloudSunRain,
  Wind, 
  CloudRain, 
  Thermometer, 
  Eye,
  RefreshCw,
  Maximize2,
  ExternalLink
} from 'lucide-react-native';
import { useWeather } from '../../contexts/WeatherContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';

type WeatherLayer = 'weather' | 'wind' | 'rain' | 'temp' | 'clouds';

interface MapSettings {
  layer: WeatherLayer;
  zoom: number;
}

export default function MapScreen() {
  const { 
    location, 
    theme,
    loading: weatherLoading 
  } = useWeather();

  const webViewRef = useRef<WebView>(null);
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    layer: 'weather', // Weather is already the default
    zoom: 8
  });
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0); // For forcing WebView reload
  const [loadingTimeout, setLoadingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const layerOptions = [
    { key: 'weather', label: 'Weather', icon: CloudSunRain, color: '#F5B120', overlay: 'radar' },
    { key: 'wind', label: 'Wind', icon: Wind, color: '#50C878', overlay: 'wind' },
    { key: 'rain', label: 'Rain', icon: CloudRain, color: '#4A90E2', overlay: 'rain' },
    { key: 'temp', label: 'Temperature', icon: Thermometer, color: '#FF6B6B', overlay: 'temp' },
    { key: 'clouds', label: 'Clouds', icon: Eye, color: '#9370DB', overlay: 'clouds' },
  ] as const;

  // Generate Windy embed URL with correct parameters
  const generateWindyUrl = () => {
    if (!location) return '';

    const { latitude, longitude } = location;
    const { layer, zoom } = mapSettings;
    
    // Get the correct overlay name
    const selectedLayer = layerOptions.find(l => l.key === layer);
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
      marker: 'true'
    });

    return `https://embed.windy.com/embed.html?${params.toString()}`;
  };

  const handleLayerChange = (newLayer: WeatherLayer) => {
    setMapSettings(prev => ({ ...prev, layer: newLayer }));
    setWebViewError(null);
    
    // Force WebView reload with new layer
    setMapKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setWebViewError(null);
    setWebViewLoading(true);
    setMapKey(prev => prev + 1);
    
    // Clear any existing timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    
    // Also try to reload the WebView directly
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleFullscreen = async () => {
    const url = generateWindyUrl();
    
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot open the map in browser');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open the map');
      }
    }
  };

  // Simplified JavaScript injection for better compatibility
  const injectedJavaScript = `
    (function() {
      try {
        // Set a timeout to detect if the page loads
        setTimeout(function() {
          if (document.readyState === 'complete') {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'loaded',
              message: 'Map loaded'
            }));
          } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'timeout',
              message: 'Loading timeout'
            }));
          }
        }, 8000);
        
        // Disable context menu for better mobile experience
        document.addEventListener('contextmenu', function(e) {
          e.preventDefault();
        });
        
        // Signal that injection is complete
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ready',
          message: 'JavaScript injected'
        }));
        
      } catch (error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: error.message || 'JavaScript error'
        }));
      }
      
      true;
    })();
  `;

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'ready':
          console.log('📱 WebView JavaScript ready');
          break;
        case 'loaded':
          console.log('✅ Windy map loaded successfully');
          setWebViewLoading(false);
          setWebViewError(null);
          if (loadingTimeout) {
            clearTimeout(loadingTimeout);
          }
          break;
        case 'error':
          console.error('❌ Windy map error:', data.message);
          setWebViewError(data.message);
          setWebViewLoading(false);
          break;
        case 'timeout':
          console.warn('⏰ Windy map loading timeout');
          setWebViewError('Map is taking longer than expected to load. This may be due to network conditions.');
          setWebViewLoading(false);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Set up loading timeout
  useEffect(() => {
    if (webViewLoading) {
      const timeout = setTimeout(() => {
        if (webViewLoading) {
          setWebViewError('Map loading timeout. Please check your internet connection and try again.');
          setWebViewLoading(false);
        }
      }, 15000); // 15 second timeout
      
      setLoadingTimeout(timeout);
      
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [webViewLoading, mapKey]);

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
    layerSelector: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
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
      backgroundColor: theme.background + 'E6',
      zIndex: 1000,
    },
    loadingText: {
      color: theme.text,
      fontSize: 16,
      marginTop: 12,
      textAlign: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.background,
    },
    errorIcon: {
      marginBottom: 16,
    },
    errorText: {
      color: theme.accent,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 22,
    },
    errorActions: {
      flexDirection: 'row',
      gap: 12,
    },
    retryButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    openBrowserButton: {
      backgroundColor: theme.surface,
      borderRadius: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.primary,
    },
    openBrowserButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    statusIndicator: {
      position: 'absolute',
      top: 16,
      right: 16,
      backgroundColor: theme.surface + 'CC',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 100,
    },
    statusText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 6,
    },
  });

  if (weatherLoading || !location) {
    return <LoadingSpinner message="Loading map location..." />;
  }

  const windyUrl = generateWindyUrl();
  const selectedLayerOption = layerOptions.find(l => l.key === mapSettings.layer);

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
              <TouchableOpacity style={styles.actionButton} onPress={handleFullscreen}>
                <Maximize2 size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.layerSelector}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
            >
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
            </ScrollView>
          </View>
        </View>

        <View style={styles.mapContainer}>
          {webViewError ? (
            <View style={styles.errorContainer}>
              <View style={styles.errorIcon}>
                <MapIcon size={48} color={theme.textSecondary} />
              </View>
              <Text style={styles.errorText}>
                {webViewError}
                {'\n\n'}
                The interactive map may not be available due to network conditions or browser restrictions.
              </Text>
              <View style={styles.errorActions}>
                <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                  <RefreshCw size={16} color="#FFFFFF" />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.openBrowserButton} onPress={handleFullscreen}>
                  <ExternalLink size={16} color={theme.primary} />
                  <Text style={styles.openBrowserButtonText}>Open in Browser</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <WebView
                key={mapKey}
                ref={webViewRef}
                source={{ uri: windyUrl }}
                style={styles.webView}
                onLoadStart={() => {
                  console.log('🔄 Starting to load Windy map...');
                  setWebViewLoading(true);
                  setWebViewError(null);
                }}
                onLoadEnd={() => {
                  console.log('✅ WebView load end');
                  // Set a fallback timeout in case injected JS doesn't work
                  setTimeout(() => {
                    if (webViewLoading) {
                      setWebViewLoading(false);
                    }
                  }, 3000);
                }}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('❌ WebView error:', nativeEvent);
                  setWebViewError(nativeEvent.description || 'Failed to load weather map');
                  setWebViewLoading(false);
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('🌐 HTTP error:', nativeEvent.statusCode);
                  setWebViewError(`HTTP Error: ${nativeEvent.statusCode}. Please check your internet connection.`);
                  setWebViewLoading(false);
                }}
                onMessage={handleWebViewMessage}
                injectedJavaScript={injectedJavaScript}
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
              
              {webViewLoading && (
                <View style={styles.loadingContainer}>
                  <LoadingSpinner message="Loading interactive weather map..." />
                  <Text style={styles.loadingText}>
                    Powered by Windy • {selectedLayerOption?.label} Layer
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}