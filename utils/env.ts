import Constants from 'expo-constants';

type EnvConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  openaiApiKey: string;
  elevenlabsApiKey: string;
};

const ENV = {
  development: {
    ...Constants.expoConfig?.extra?.development
  } as EnvConfig,
  production: {
    ...Constants.expoConfig?.extra?.production
  } as EnvConfig
};

const getEnvVars = (): EnvConfig => {
  if (__DEV__) {
    return ENV.development;
  }
  return ENV.production;
};

export default Constants.expoConfig?.extra || Constants.manifest.extra; 