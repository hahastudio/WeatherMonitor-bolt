export default {
  "expo": {
    "name": "Weather Monitor NT",
    "slug": "weathermonitor-nt",
    "version": process.env.npm_package_version || "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "android": {
      "package": "com.hahastudio.weathermonitornt",
      "icon": "./assets/images/icon.png",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon-foreground.png",
        "backgroundImage": "./assets/images/adaptive-icon-background.png",
        "monochromeImage": "./assets/images/adaptive-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "googleServicesFile": process.env.ANDROID_GOOGLE_SERVICES_FILE_PATH,
    },
    "ios": {
      "bundleIdentifier": "com.hahastudio.weathermonitornt",
      "icon": "./assets/images/icon.png",
      "supportsTablet": true
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#2196f3",
          "image": "./assets/images/splash-icon.png",
          "dark": {
            "image": "./assets/images/splash-icon.png",
            "backgroundColor": "#0b3252"
          },
          "imageWidth": 192
        }
      ],
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-location",
        {
          "isIosBackgroundLocationEnabled": true,
          "isAndroidBackgroundLocationEnabled": true,
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff"
        }
      ],
      "react-native-background-fetch"
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "b954e4ba-aebb-432e-8c89-a5faec5e775d"
      }
    }
  }
}
