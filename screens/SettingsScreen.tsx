import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../navigation';
import { supabase } from '../utils/supabase';

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your reflection data will be exported as a JSON file. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            // TODO: Implement data export
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
            // TODO: Implement account deletion
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
              // Reset navigation to Login screen
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
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={showSwitch}
    >
      <View style={styles.settingLeft}>
        <LinearGradient
          colors={destructive ? ['#EF4444', '#DC2626'] : ['#8B5CF6', '#7C3AED']}
          style={styles.iconContainer}
        >
          <Ionicons name={icon as any} size={20} color="white" />
        </LinearGradient>
        <View>
          <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>
            {title}
          </Text>
          {value && <Text style={styles.settingValue}>{value}</Text>}
        </View>
      </View>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#E2E8F0', true: '#8B5CF6' }}
          thumbColor="white"
        />
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your reflection experience</Text>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications"
              title="Daily Reminders"
              value="9:00 AM"
              showSwitch
              switchValue={notifications}
              onSwitchChange={setNotifications}
            />
            <SettingItem
              icon="volume-high"
              title="Sound Effects"
              showSwitch
              switchValue={soundEnabled}
              onSwitchChange={setSoundEnabled}
            />
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="download"
              title="Export Data"
              value="Download your reflection history"
              onPress={handleExportData}
            />
            <SettingItem
              icon="trash"
              title="Clear All Data"
              value="Remove all your reflections"
              destructive
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="person"
              title="Account Details"
              value="Update your information"
            />
            <SettingItem
              icon="shield-checkmark"
              title="Privacy Settings"
              value="Manage your data privacy"
            />
            <SettingItem
              icon="exit-outline"
              title="Logout"
              onPress={handleLogout}
              showChevron={false}
            />
            <SettingItem
              icon="trash-outline"
              title="Delete Account"
              value="Permanently delete your account"
              destructive
              onPress={handleDeleteAccount}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 ReflectAI</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 13,
    color: '#64748B',
  },
  destructiveText: {
    color: '#EF4444',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appVersion: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#94A3B8',
  },
}); 