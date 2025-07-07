# Weather Monitor bolt

A beautiful, production-ready weather monitoring app built with React Native, Expo, and TypeScript. Features real-time weather data, forecasts, interactive charts, weather alerts, AI-powered weather summaries, and interactive weather maps with a responsive design that adapts to weather conditions.

It's mainly built with [Bolt](https://bolt.new/)

## ✨ Features

- **Real-time Weather Data**: Current conditions, temperature, humidity, wind speed, and more
- **AI Weather Summaries**: Intelligent weather analysis powered by Google Gemini AI
- **Interactive Weather Maps**: Powered by Windy with multiple weather layers
- **5-Day Forecast**: Detailed weather predictions with hourly breakdowns
- **Interactive Charts**: Visual representations of temperature, precipitation, wind, pressure, and humidity trends
- **Weather Alerts**: Real-time weather warnings and advisories with severity levels
- **Adaptive Themes**: Dynamic color schemes that change based on weather conditions and time of day
- **Location Services**: Automatic location detection with manual refresh options
- **API Request Monitoring**: Comprehensive logging and analytics for API usage
- **Cross-Platform**: Works on iOS, Android, and Web
- **Offline-Ready**: Graceful handling of network issues with cached data

## 🏗️ Architecture

### Key Architectural Decisions

#### 1. **Tab-Based Navigation**
- Primary navigation uses Expo Router's tab system
- Each major feature (Weather, Forecast, Charts, Map, Settings) has its own tab
- Clean separation of concerns with dedicated screens

#### 2. **Context-Based State Management**
- `WeatherContext` provides global state for weather data
- Centralized API calls and error handling
- Automatic refresh intervals with user-configurable rates

#### 3. **Service Layer Architecture**
- Separate services for different APIs and functionalities
- Comprehensive error handling and retry logic
- API request logging for monitoring and debugging

#### 4. **AI-Powered Weather Analysis**
- Google Gemini AI integration for intelligent weather summaries
- Contextual analysis of current conditions, alerts, and future forecasts
- Personalized recommendations based on weather patterns

#### 5. **Interactive Map Integration**
- Windy map embedding for visual weather data
- Multiple weather layer support (wind, rain, temperature, clouds)
- Real-time meteorological visualization

#### 6. **Adaptive Theming System**
- Dynamic themes based on weather conditions and time of day
- Consistent color schemes across all components
- Accessibility-compliant contrast ratios

#### 7. **Component-Based UI**
- Reusable components with consistent styling
- Platform-specific optimizations for iOS, Android, and Web
- Responsive design with proper breakpoints

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- API keys (see Environment Setup below)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WeatherMonitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweathermap_api_key_here
   EXPO_PUBLIC_CAIYUN_API_KEY=your_caiyun_api_key_here
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ANDROID_GOOGLE_SERVICES_FILE_PATH=your_firebase_json_file_here
   ```

   **Getting API Keys:**
   
   - **OpenWeatherMap API**: 
     1. Visit [openweathermap.org](https://openweathermap.org/api)
     2. Sign up for a free account
     3. Generate an API key from your dashboard
     4. Free tier includes 1,000 calls/day
   
   - **Caiyun API** (for weather alerts):
     1. Visit [caiyunapp.com](https://caiyunapp.com/api)
     2. Register for an account
     3. Get your API token
     4. Used for weather alerts and warnings

   - **Google Gemini AI** (for weather summaries):
     1. Visit [Google AI Studio](https://aistudio.google.com/)
     2. Create a new project or use existing one
     3. Generate an API key for Gemini
     4. Used for intelligent weather analysis and recommendations
   
   - **Firebase** (for `expo-notifications` build):
     1. Follow steps in [Obtain Google Service Account Keys using FCM V1](https://docs.expo.dev/push-notifications/fcm-credentials/)

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   - **Web**: Open the provided localhost URL in your browser
   - **Mobile**: Scan the QR code with Expo Go app
   - **Simulator**: Press `i` for iOS or `a` for Android

### Building for Production

#### Web Deployment
```bash
npm run build:web
```
The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

#### Mobile App Builds
For mobile app builds, you'll need to use EAS Build:

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**
   ```bash
   eas build:configure
   ```

3. **Build for iOS/Android**
   ```bash
   eas build --platform all
   ```

## 📊 Data Sources

### Primary Weather Data: OpenWeatherMap API

**Endpoints Used:**
- `GET /weather` - Current weather conditions
- `GET /forecast` - 5-day weather forecast with 3-hour intervals

**Data Includes:**
- Temperature (current, feels-like, min/max)
- Weather conditions and descriptions
- Humidity, pressure, visibility
- Wind speed and direction
- Sunrise/sunset times
- Geographic coordinates

**Rate Limits:**
- Free tier: 1,000 calls/day, 60 calls/minute
- Paid tiers available for higher usage

### Weather Alerts: Caiyun API

**Endpoints Used:**
- `GET /weather?alert=true` - Weather alerts and warnings

**Alert Data Includes:**
- Alert severity levels (red, orange, yellow, blue)
- Alert types (thunderstorm, heavy rain, snow, etc.)
- Geographic coverage areas
- Start and end times
- Detailed descriptions in multiple languages

**Coverage:**
- Primarily covers China and surrounding regions
- Real-time government weather warnings
- Multiple severity classifications

### AI Weather Analysis: Google Gemini

**Model Used:**
- `gemini-2.5-flash` - Fast, efficient model for text generation

**AI Features:**
- **Today's Overview**: Comprehensive analysis of current weather conditions
- **Alert Analysis**: Intelligent interpretation of weather warnings
- **Future Predictions**: Analysis of upcoming weather patterns in next 5 days
- **Personalized Recommendations**: Practical advice based on weather conditions
- **Mood Assessment**: Weather impact categorization (positive, neutral, warning, severe)

**Analysis Includes:**
- Temperature comfort assessment
- Precipitation likelihood and timing
- Wind and visibility conditions
- Practical daily activity recommendations
- Weather change notifications
- Safety considerations for severe weather

### Interactive Weather Maps: Windy

**Integration:**
- Embedded Windy maps with custom configuration
- Real-time meteorological data visualization
- Multiple weather layer support

**Available Layers:**
- **Wind**: Wind speed and direction patterns
- **Rain**: Precipitation intensity and movement
- **Temperature**: Temperature distribution and gradients
- **Clouds**: Cloud cover and satellite imagery
- **Pressure**: Atmospheric pressure systems

**Features:**
- Interactive zoom and pan
- Location-specific forecasts
- Time-based weather animation
- Professional meteorological data from ECMWF

### Location Services

**Data Sources:**
- **Mobile**: Native GPS via Expo Location
- **Web**: HTML5 Geolocation API
- **Fallback**: Default to major cities if location unavailable

**Reverse Geocoding:**
- City name resolution from coordinates
- Country and region information
- Timezone detection

## 🔧 Configuration

### App Settings

Users can configure:
- **Auto-refresh rate**: 15 minutes to 1 hours
- **Dark/Light mode**: Manual toggle or automatic based on time
- **Notification preferences**: Enable/disable weather alerts
- **Location settings**: Manual refresh or automatic detection
- **Map layers**: Choose preferred weather visualization

### API Request Monitoring

The app includes comprehensive API monitoring:
- **Request logging**: All API calls are logged with timestamps
- **Performance metrics**: Response times and success rates
- **Usage analytics**: Requests by trigger type and provider
- **Error tracking**: Failed requests with detailed error messages
- **48-hour retention**: Automatic cleanup of old logs

### AI Summary Configuration

The AI weather summaries can be:
- **Auto-generated**: Automatically created when weather data updates
- **Manually refreshed**: User can request new summaries anytime
- **Expandable**: Detailed view with recommendations and future warnings
- **Contextual**: Adapts to current weather conditions and alerts

### Theme Customization

Themes automatically adapt based on:
- **Weather conditions**: Different color schemes for sunny, rainy, cloudy, etc.
- **Time of day**: Darker themes during nighttime hours
- **User preference**: Manual dark/light mode override
- **Seasonal adjustments**: Subtle variations based on weather patterns

## 🛠️ Development

### Adding New Features

1. **New Screens**: Add files to `app/(tabs)/` directory
2. **Components**: Create reusable components in `components/`
3. **API Services**: Extend services in `services/` directory
4. **Types**: Update TypeScript interfaces in `types/`

### AI Integration

The Gemini AI service provides:
- **Structured responses**: JSON format for consistent parsing
- **Error handling**: Graceful fallbacks when AI is unavailable
- **Rate limiting**: Efficient API usage with caching
- **Contextual analysis**: Weather-specific prompts for relevant insights

### Map Integration

The Windy map integration includes:
- **Dynamic URL generation**: Based on user location and preferences
- **Layer switching**: Real-time weather layer changes
- **Error handling**: Fallback UI when map fails to load
- **Platform optimization**: Web and mobile-specific implementations

### Testing

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Platform-Specific Code

Use Platform.select() for platform-specific implementations:

```typescript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: { shadowColor: '#000' },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    }),
  },
});
```

## 📱 Supported Platforms

- **iOS**: iPhone and iPad (iOS 13+)
- **Android**: Android 6.0+ (API level 23+)
- **Web**: Modern browsers (Chrome, Firefox, Safari, Edge)

## 🔒 Privacy & Security

- **Location Data**: Only used for weather data, not stored or transmitted
- **API Keys**: Securely managed through environment variables
- **No Personal Data**: App doesn't collect or store personal information
- **Local Storage**: Only app preferences and API logs stored locally
- **AI Processing**: Weather data sent to Gemini for analysis, no personal information included

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation for common solutions
- Review the API logs in the Settings tab for debugging

---

Built with ❤️ using React Native, Expo, TypeScript, and Google Gemini AI