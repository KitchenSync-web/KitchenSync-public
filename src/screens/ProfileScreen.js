import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  deleteCurrentUserAccount,
  logoutUser,
  sendCurrentUserPasswordReset,
  updateCurrentUserEmail,
} from '../services/authService';
import { hasAnyListsForUser } from '../services/listService';
import {
  deleteUserDocument,
  subscribeToUserDocument,
  updateUserEmailInDocument,
  updateUsername,
} from '../services/userService';

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [username, setUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showEmailSection, setShowEmailSection] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  const displayEmail = user?.email?.toLowerCase() || '';
  const displayName = savedUsername || displayEmail || 'User';

  const avatarLetter = useMemo(() => {
    return displayName.trim().charAt(0).toUpperCase() || 'U';
  }, [displayName]);

  useEffect(() => {
    if (!user?.uid) {
      setLoadingProfile(false);
      setUsername('');
      setSavedUsername('');
      return;
    }

    const unsubscribe = subscribeToUserDocument(user.uid, (userDoc) => {
      const existingUsername = userDoc?.username?.trim() || '';
      setUsername(existingUsername);
      setSavedUsername(existingUsername);
      setLoadingProfile(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  async function handleSaveUsername() {
    try {
      await updateUsername(user.uid, username);
      Alert.alert('Success', 'Username updated.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  async function handleChangeEmail() {
    try {
      const updatedEmail = await updateCurrentUserEmail(emailPassword, newEmail);
      await updateUserEmailInDocument(user.uid, updatedEmail);
      setNewEmail('');
      setEmailPassword('');
      Alert.alert('Success', `Your email was updated to ${updatedEmail}.`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  async function handleSendPasswordReset() {
    try {
      await sendCurrentUserPasswordReset();
      Alert.alert('Password Reset Sent', `A password reset email was sent to ${displayEmail}.`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  async function handleDeleteAccount() {
    if (!deletePassword.trim()) {
      Alert.alert('Password Required', 'Please enter your password before deleting your account.');
      return;
    }

    Alert.alert(
      'Delete Account',
      'This will permanently delete your account. Before deleting, you must leave or delete every list you belong to. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              const userStillHasLists = await hasAnyListsForUser(user.uid);

              if (userStillHasLists) {
                throw new Error('Please leave or delete all lists before deleting your account.');
              }

              await deleteCurrentUserAccount(deletePassword);
              await deleteUserDocument(user.uid);
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  }

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#111111" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>My Lists</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.screenTitle}>Edit Profile</Text>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.fieldInput}
                placeholder="Enter a username"
                placeholderTextColor="#555"
                value={username}
                onChangeText={setUsername}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveUsername}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>Account Settings</Text>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => setShowEmailSection(!showEmailSection)}
          >
            <Text style={styles.settingsRowText}>Change Email</Text>
            <Text style={styles.settingsRowArrow}>{showEmailSection ? '∧' : '›'}</Text>
          </TouchableOpacity>

          {showEmailSection && (
            <View style={styles.expandedSection}>
              <Text style={styles.helperText}>Current: {displayEmail}</Text>

              <TextInput
                style={styles.expandedInput}
                placeholder="New email"
                placeholderTextColor="#555"
                value={newEmail}
                onChangeText={setNewEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TextInput
                style={styles.expandedInput}
                placeholder="Current password"
                placeholderTextColor="#555"
                value={emailPassword}
                onChangeText={setEmailPassword}
                secureTextEntry
              />

              <TouchableOpacity style={styles.expandedButton} onPress={handleChangeEmail}>
                <Text style={styles.expandedButtonText}>Update Email</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.settingsRow} onPress={handleSendPasswordReset}>
            <Text style={styles.settingsRowText}>Send Password Reset Email</Text>
            <Text style={styles.settingsRowArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsRow} onPress={handleLogout}>
            <Text style={styles.settingsRowText}>Log Out</Text>
            <Text style={styles.settingsRowArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsRow, styles.dangerRow]}
            onPress={() => setShowDeleteSection(!showDeleteSection)}
          >
            <Text style={styles.dangerRowText}>Delete Account</Text>
            <Text style={styles.settingsRowArrow}>{showDeleteSection ? '∧' : '›'}</Text>
          </TouchableOpacity>

          {showDeleteSection && (
            <View style={styles.deleteExpandedSection}>
              <Text style={styles.helperText}>
                Enter your password before deleting your account.
              </Text>

              <TextInput
                style={styles.expandedInput}
                placeholder="Current password"
                placeholderTextColor="#555"
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
              />

              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                <Text style={styles.deleteButtonText}>Confirm Delete Account</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111111',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backArrow: {
    color: '#ffffff',
    fontSize: 18,
  },
  backText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 15,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#3a8fc7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 38,
    fontWeight: '700',
    color: '#ffffff',
  },
  fieldGroup: {
    gap: 14,
    marginBottom: 22,
  },
  fieldWrapper: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#3CC47C',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  settingsSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  settingsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  settingsRowText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
  },
  settingsRowArrow: {
    fontSize: 18,
    color: '#555555',
  },
  dangerRow: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  dangerRowText: {
    fontSize: 15,
    color: '#e74c3c',
    fontWeight: '500',
  },
  expandedSection: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    backgroundColor: '#161616',
  },
  deleteExpandedSection: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: '#161616',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  helperText: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 10,
  },
  expandedInput: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 10,
  },
  expandedButton: {
    backgroundColor: '#3CC47C',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  expandedButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});