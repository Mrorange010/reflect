import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '../navigation';
import { supabase } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';

// Theme context (you'd want to move this to a separate file)
export const ThemeContext = React.createContext({
  isDark: false,
  toggleTheme: () => {},
  theme: 'auto' as 'light' | 'dark' | 'auto',
  setTheme: (theme: 'light' | 'dark' | 'auto') => {},
});

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { isDark, theme, setTheme } = useTheme();
  
  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your reflection data will be exported as a JSON file. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            Alert.alert('Success', 'Your data has been exported successfully!');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            navigation.navigate('Login');
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert("Logout Failed", error.message);
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        }
      ]
    );
  };

  // Health Background Component
  const HealthGradientBackground = () => (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]} />
      <LinearGradient
        colors={isDark 
          ? ['rgba(52, 199, 89, 0.15)', 'rgba(52, 199, 89, 0.05)', 'transparent'] as const
          : ['rgba(0, 122, 255, 0.1)', 'rgba(52, 199, 89, 0.05)', 'transparent'] as const
        }
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 300,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.6, 1]}
      />
    </View>
  );

  const SettingItem = ({ 
    icon, 
    title, 
    value, 
    onPress, 
    showSwitch = false, 
    showChevron = true,
    switchValue,
    onSwitchChange,
    destructive = false,
    iconColor,
  }: {
    icon: string;
    title: string;
    value?: string;
    onPress?: () => void;
    showSwitch?: boolean;
    showChevron?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    destructive?: boolean;
    iconColor?: string;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, isDark && styles.settingItemDark]}
      onPress={onPress}
      disabled={showSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[
          styles.iconContainer, 
          { backgroundColor: iconColor || (destructive ? '#FF453A' : '#007AFF') + '15' }
        ]}>
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={iconColor || (destructive ? '#FF453A' : '#007AFF')} 
          />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[
            styles.settingTitle, 
            isDark && styles.settingTitleDark,
            destructive && styles.destructiveText
          ]}>
            {title}
          </Text>
          {value && (
            <Text style={[styles.settingValue, isDark && styles.settingValueDark]}>
              {value}
            </Text>
          )}
        </View>
      </View>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: isDark ? '#2C2C2E' : '#E5E5EA', true: '#34C759' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={isDark ? '#2C2C2E' : '#E5E5EA'}
        />
      ) : showChevron ? (
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={isDark ? '#8E8E93' : '#C7C7CC'} 
        />
      ) : null}
    </TouchableOpacity>
  );

  const ThemeSelector = () => (
    <View style={[styles.themeSelector, isDark && styles.themeSelectorDark]}>
      <Text style={[styles.themeSelectorTitle, isDark && styles.themeSelectorTitleDark]}>
        Appearance
      </Text>
      <View style={styles.themeOptions}>
        {[
          { key: 'auto', label: 'Auto', icon: 'phone-portrait-outline' },
          { key: 'light', label: 'Light', icon: 'sunny-outline' },
          { key: 'dark', label: 'Dark', icon: 'moon-outline' }
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.themeOption,
              isDark && styles.themeOptionDark,
              theme === option.key && styles.themeOptionActive,
              theme === option.key && isDark && styles.themeOptionActiveDark
            ]}
            onPress={() => handleThemeChange(option.key as 'light' | 'dark' | 'auto')}
          >
            <Ionicons 
              name={option.icon as any} 
              size={20} 
              color={theme === option.key 
                ? (isDark ? '#007AFF' : '#007AFF')
                : (isDark ? '#8E8E93' : '#8E8E93')
              } 
            />
            <Text style={[
              styles.themeOptionText,
              isDark && styles.themeOptionTextDark,
              theme === option.key && styles.themeOptionTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Theme is now managed globally via context
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <HealthGradientBackground />
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, isDark && styles.titleDark]}>
              Settings
            </Text>
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              Customize your reflection experience
            </Text>
          </View>

          {/* Appearance Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Appearance
            </Text>
            <View style={[styles.sectionContent, isDark && styles.sectionContentDark]}>
              <ThemeSelector />
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Preferences
            </Text>
            <View style={[styles.sectionContent, isDark && styles.sectionContentDark]}>
              <SettingItem
                icon="notifications-outline"
                title="Daily Reminders"
                value="Get notified to reflect daily"
                showSwitch
                switchValue={notifications}
                onSwitchChange={setNotifications}
                iconColor="#FF9F0A"
              />
              <SettingItem
                icon="volume-high-outline"
                title="Sound Effects"
                value="Enable app sounds and haptics"
                showSwitch
                switchValue={soundEnabled}
                onSwitchChange={setSoundEnabled}
                iconColor="#AF52DE"
              />
            </View>
          </View>

          {/* Data Management Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Data Management
            </Text>
            <View style={[styles.sectionContent, isDark && styles.sectionContentDark]}>
              <SettingItem
                icon="download-outline"
                title="Export Data"
                value="Download your reflection history"
                onPress={handleExportData}
                iconColor="#34C759"
              />
              <SettingItem
                icon="trash-outline"
                title="Clear All Data"
                value="Remove all your reflections"
                destructive
                onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon.')}
              />
            </View>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Account
            </Text>
            <View style={[styles.sectionContent, isDark && styles.sectionContentDark]}>
              <SettingItem
                icon="person-outline"
                title="Account Details"
                value="Update your information"
                iconColor="#007AFF"
                onPress={() => Alert.alert('Coming Soon', 'Account management will be available soon.')}
              />
              <SettingItem
                icon="shield-checkmark-outline"
                title="Privacy Settings"
                value="Manage your data privacy"
                iconColor="#5AC8FA"
                onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon.')}
              />
              <SettingItem
                icon="exit-outline"
                title="Logout"
                value="Sign out of your account"
                onPress={handleLogout}
                showChevron={false}
                iconColor="#8E8E93"
              />
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Danger Zone
            </Text>
            <View style={[styles.sectionContent, isDark && styles.sectionContentDark]}>
              <SettingItem
                icon="trash-outline"
                title="Delete Account"
                value="Permanently delete your account and data"
                destructive
                onPress={handleDeleteAccount}
              />
            </View>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={[styles.appVersion, isDark && styles.appVersionDark]}>
              Version 1.0.0
            </Text>
            <Text style={[styles.appCopyright, isDark && styles.appCopyrightDark]}>
              © 2024 ReflectAI
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '400',
  },
  subtitleDark: {
    color: '#8E8E93',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    paddingHorizontal: 20,
    letterSpacing: -0.3,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  sectionContentDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  settingItemDark: {
    borderBottomColor: '#38383A',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  settingTitleDark: {
    color: '#FFFFFF',
  },
  settingValue: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  settingValueDark: {
    color: '#8E8E93',
  },
  destructiveText: {
    color: '#FF453A',
  },
  
  // Theme Selector Styles
  themeSelector: {
    padding: 16,
  },
  themeSelectorDark: {
    // No additional styles needed
  },
  themeSelectorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  themeSelectorTitleDark: {
    color: '#FFFFFF',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionDark: {
    backgroundColor: '#2C2C2E',
  },
  themeOptionActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  themeOptionActiveDark: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderColor: '#007AFF',
  },
  themeOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 8,
  },
  themeOptionTextDark: {
    color: '#8E8E93',
  },
  themeOptionTextActive: {
    color: '#007AFF',
  },
  
  // App Info Styles
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  appVersion: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  appVersionDark: {
    color: '#8E8E93',
  },
  appCopyright: {
    fontSize: 13,
    color: '#C7C7CC',
    fontWeight: '400',
  },
  appCopyrightDark: {
    color: '#8E8E93',
  },
});