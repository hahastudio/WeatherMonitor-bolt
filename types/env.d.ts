declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ANDROID_GOOGLE_SERVICES_FILE_PATH: string;
    }
  }
}

// Ensure this file is treated as a module
export {};
