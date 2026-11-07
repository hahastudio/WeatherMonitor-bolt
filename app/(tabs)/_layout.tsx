import { unstable_createStandardRouterNavigator, TabRouter } from 'expo-router';
import { AdaptiveNavigation } from '../../components/AdaptiveNavigation';

// SDK 57 exposes the documented standard navigator under its unstable export.
const AdaptiveTabs = unstable_createStandardRouterNavigator(
  AdaptiveNavigation,
  TabRouter,
);
export default function TabLayout() {
  // Keep only Weather and the active destination in the tab back history.
  return <AdaptiveTabs initialRouteName="index" backBehavior="initialRoute" />;
}
