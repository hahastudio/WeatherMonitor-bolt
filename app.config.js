export default {
  "expo": {
    "name": "WeatherMonitor NT",
    "slug": "weathermonitor-nt",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "expo-background-task"
    ],
    "experiments": {
      "typedRoutes": true
    },
    "android": {
      "package": "com.hahastudio.weathermonitornt",
      "googleServicesFile": process.env.ANDROID_GOOGLE_SERVICES_FILE_PATH
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "b954e4ba-aebb-432e-8c89-a5faec5e775d"
      }
    }
  }
}
