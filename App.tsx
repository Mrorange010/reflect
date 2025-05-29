import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './navigation';
import "./global.css";


export default function App() {
  return (
    <SafeAreaProvider>
      <Navigation />
    </SafeAreaProvider>
  );
}
