import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserLists } from '../services/listService';
import { subscribeToUserDocument } from '../services/userService';

export default function MyListsScreen({ navigation }) {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      setDisplayName('');
      return;
    }

    const unsubscribe = subscribeToUserDocument(user.uid, (userDoc) => {
      const username = userDoc?.username?.trim();
      if (username) {
        setDisplayName(username);
      } else {
        setDisplayName(user?.email || 'User');
      }
    });

    return () => unsubscribe();
  }, [user?.uid, user?.email]);

  useEffect(() => {
    if (!user?.uid) {
      setLists([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToUserLists(user.uid, (userLists) => {
      setLists(userLists);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('./logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>
              Kitchen<Text style={styles.headerTitleAccent}>Sync</Text>
            </Text>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={styles.profileIcon}>
              <Text style={styles.profileInitial}>
                {(displayName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateList')}
        >
          <Text style={styles.createButtonIcon}>＋</Text>
          <Text style={styles.createButtonText}>Create List</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>My Lists</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#3CC47C" style={{ marginTop: 24 }} />
        ) : lists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No lists yet. Create your first one.</Text>
          </View>
        ) : (
          <FlatList
            data={lists}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => navigation.navigate('ListDetail', { list: item })}
              >
                <Text style={styles.listItemTitle}>{item.title}</Text>
                <Text style={styles.listItemArrow}>›</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111111',
  },
  container: {
    flex: 1,
    backgroundColor: '#111111',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerTitleAccent: {
    color: '#3CC47C',
  },
  profileIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3CC47C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: '#3CC47C',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  createButtonIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#555555',
    fontSize: 15,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listItem: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  listItemTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  listItemArrow: {
    color: '#555555',
    fontSize: 22,
  },
});