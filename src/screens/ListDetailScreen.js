import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useAuth } from '../context/AuthContext';
import {
  createItem,
  deleteItem,
  subscribeToItems,
  toggleItemCompletion,
  updateItem,
} from '../services/itemService';
import {
  deleteList,
  leaveList,
  removeMemberFromList,
  shareListWithEmail,
  subscribeToList,
  updateListTitle,
} from '../services/listService';
import { getUsersByUids } from '../services/userService';

export default function ListDetailScreen({ route, navigation }) {
  const { list: initialList } = route.params;
  const { user } = useAuth();

  const [list, setList] = useState(initialList);
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedItemName, setEditedItemName] = useState('');
  const [editedItemQuantity, setEditedItemQuantity] = useState('1');
  const [shareEmail, setShareEmail] = useState('');
  const [sharing, setSharing] = useState(false);
  const [memberUsers, setMemberUsers] = useState([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedListTitle, setEditedListTitle] = useState('');

  const swipeableRefs = useRef({});
  const isOwner = user?.uid === list?.ownerId;

  useEffect(() => {
    const unsubscribe = subscribeToList(initialList.id, (updatedList) => {
      if (!updatedList) {
        Alert.alert('List Deleted', 'This list is no longer available.');
        navigation.goBack();
        return;
      }

      setList(updatedList);
      setEditedListTitle(updatedList.title);
    });

    return () => unsubscribe();
  }, [initialList.id, navigation]);

  useEffect(() => {
    const unsubscribe = subscribeToItems(initialList.id, (fetchedItems) => {
      setItems(fetchedItems);
    });

    return () => unsubscribe();
  }, [initialList.id]);

  useEffect(() => {
    async function loadMemberUsers() {
      try {
        if (!list?.members || list.members.length === 0) {
          setMemberUsers([]);
          return;
        }

        const users = await getUsersByUids(list.members);

        const sortedUsers = [...users].sort((a, b) => {
          if (a.uid === list.ownerId) return -1;
          if (b.uid === list.ownerId) return 1;
          return a.email.localeCompare(b.email);
        });

        setMemberUsers(sortedUsers);
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    }

    loadMemberUsers();
  }, [list]);

  function getRelativeTime(lastEditedAt) {
    if (!lastEditedAt) return '';

    let jsDate = null;

    if (typeof lastEditedAt?.toDate === 'function') {
      jsDate = lastEditedAt.toDate();
    } else {
      jsDate = new Date(lastEditedAt);
    }

    if (Number.isNaN(jsDate?.getTime?.())) return '';

    const now = new Date();
    const diffMs = now - jsDate;
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    return jsDate.toLocaleDateString();
  }

  function getEditorDisplayName(item) {
    const matchingUser = memberUsers.find((m) => m.uid === item.lastEditedByUid);

    if (matchingUser?.username?.trim()) return matchingUser.username.trim();
    if (matchingUser?.email?.trim()) return matchingUser.email.trim();
    if (item.lastEditedByEmail?.trim()) return item.lastEditedByEmail.trim();

    return '';
  }

  function closeSwipeable(itemId) {
    const row = swipeableRefs.current[itemId];

    if (row) {
      row.close();
    }
  }

  async function handleSaveListTitle() {
    if (!editedListTitle.trim()) {
      Alert.alert('Error', 'List title cannot be empty.');
      return;
    }

    try {
      await updateListTitle(list.id, editedListTitle, user?.uid, list.ownerId);
      setEditingTitle(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  function handleCancelEditTitle() {
    setEditedListTitle(list.title);
    setEditingTitle(false);
  }

  async function handleAddItem() {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name.');
      return;
    }

    try {
      await createItem(list.id, newItemName.trim(), newItemQuantity.trim() || '1', user);
      setNewItemName('');
      setNewItemQuantity('1');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  async function handleToggleItem(item) {
    try {
      await toggleItemCompletion(item.id, item.completed, user);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  function startEditingItem(item) {
    closeSwipeable(item.id);
    setEditingItemId(item.id);
    setEditedItemName(item.name);
    setEditedItemQuantity(item.quantity || '1');
  }

  function cancelEditingItem() {
    setEditingItemId(null);
    setEditedItemName('');
    setEditedItemQuantity('1');
  }

  async function handleSaveEditedItem(itemId) {
    if (!editedItemName.trim()) {
      Alert.alert('Error', 'Item name cannot be empty.');
      return;
    }

    try {
      await updateItem(itemId, editedItemName.trim(), editedItemQuantity.trim() || '1', user);
      setEditingItemId(null);
      setEditedItemName('');
      setEditedItemQuantity('1');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  async function handleDeleteItem(itemId) {
    closeSwipeable(itemId);

    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(itemId);
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  }

  async function handleShareList() {
    if (!shareEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address.');
      return;
    }

    try {
      setSharing(true);
      const sharedUser = await shareListWithEmail(list.id, shareEmail, user?.uid, list.ownerId);
      setShareEmail('');
      Alert.alert('Success', `List shared with ${sharedUser.email}`);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSharing(false);
    }
  }

  async function handleRemoveMember(memberUid, email) {
    Alert.alert('Remove Member', `Remove ${email} from this list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMemberFromList(list.id, memberUid, user?.uid, list.ownerId);
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  }

  async function handleLeaveList() {
    Alert.alert('Leave List', 'Are you sure you want to leave this shared list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveList(list.id, user?.uid, list.ownerId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  }

  async function handleDeleteList() {
    Alert.alert('Delete List', 'Are you sure you want to delete this entire list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteList(list.id, user?.uid, list.ownerId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  }

  function renderRightActions(item) {
    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity
          style={[styles.swipeActionButton, styles.editSwipeButton]}
          onPress={() => startEditingItem(item)}
        >
          <Text style={styles.swipeActionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeActionButton, styles.deleteSwipeButton]}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Text style={styles.swipeActionText}>🗑</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderItem({ item }) {
    const displayQuantity = item.quantity?.trim() || '1';
    const relativeTime = getRelativeTime(item.lastEditedAt);
    const editorDisplayName = getEditorDisplayName(item);
    const hasEditInfo = editorDisplayName && relativeTime;

    return (
      <View style={styles.swipeRowWrapper}>
        <Swipeable
          ref={(ref) => {
            if (ref) swipeableRefs.current[item.id] = ref;
          }}
          renderRightActions={() => renderRightActions(item)}
          overshootRight={false}
          enabled={editingItemId !== item.id}
        >
          <View style={styles.itemRow}>
            {editingItemId === item.id ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.input}
                  value={editedItemName}
                  onChangeText={setEditedItemName}
                  placeholder="Edit item name"
                  placeholderTextColor="#555"
                />

                <TextInput
                  style={styles.input}
                  value={editedItemQuantity}
                  onChangeText={setEditedItemQuantity}
                  placeholder="Edit quantity"
                  placeholderTextColor="#555"
                />

                <View style={styles.editButtonsRow}>
                  <TouchableOpacity
                    style={styles.saveItemButton}
                    onPress={() => handleSaveEditedItem(item.id)}
                  >
                    <Text style={styles.saveItemButtonText}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelItemButton} onPress={cancelEditingItem}>
                    <Text style={styles.cancelItemButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.itemTextContainer}
                onPress={() => handleToggleItem(item)}
              >
                <View style={styles.itemRowInner}>
                  <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                    {item.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>

                  <View style={styles.itemTextBlock}>
                    <Text style={[styles.itemText, item.completed && styles.completedItemText]}>
                      {item.name}
                      {displayQuantity !== '1' ? (
                        <Text style={styles.quantityText}> ×{displayQuantity}</Text>
                      ) : null}
                    </Text>

                    {hasEditInfo ? (
                      <Text style={styles.lastEditedText}>
                        {editorDisplayName} · {relativeTime}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </Swipeable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backText}>My Lists</Text>
            </TouchableOpacity>

            <Text style={styles.headerLabel}>List Details</Text>
          </View>

          {editingTitle && isOwner ? (
            <View style={styles.titleEditRow}>
              <TextInput
                style={[styles.input, styles.titleInput]}
                value={editedListTitle}
                onChangeText={setEditedListTitle}
                placeholder="List title"
                placeholderTextColor="#555"
                autoFocus
              />

              <TouchableOpacity style={styles.saveTitleBtn} onPress={handleSaveListTitle}>
                <Text style={styles.saveTitleBtnText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelTitleBtn} onPress={handleCancelEditTitle}>
                <Text style={styles.cancelTitleBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.titleRow}
              onPress={() => isOwner && setEditingTitle(true)}
              activeOpacity={isOwner ? 0.7 : 1}
            >
              <Text style={styles.listTitle}>{list.title}</Text>
              {isOwner && <Text style={styles.editTitleIcon}>✎</Text>}
            </TouchableOpacity>
          )}

          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <>
                <View style={styles.addItemRow}>
                  <TextInput
                    style={styles.addItemInput}
                    placeholder="Enter grocery item..."
                    placeholderTextColor="#555"
                    value={newItemName}
                    onChangeText={setNewItemName}
                    onSubmitEditing={handleAddItem}
                    returnKeyType="done"
                  />

                  <TextInput
                    style={styles.quantityInput}
                    placeholder="Qty"
                    placeholderTextColor="#555"
                    value={newItemQuantity}
                    onChangeText={setNewItemQuantity}
                    keyboardType="numeric"
                  />

                  <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
                    <Text style={styles.addItemButtonText}>Add Item</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionBlockTitle}>People with Access</Text>

                  {memberUsers.length === 0 ? (
                    <Text style={styles.emptyMembersText}>No members found.</Text>
                  ) : (
                    memberUsers.map((member) => {
                      const isOwnerMember = member.uid === list.ownerId;

                      return (
                        <View key={member.uid} style={styles.memberRow}>
                          <View style={styles.memberInfo}>
                            <View style={styles.memberAvatar}>
                              <Text style={styles.memberAvatarText}>
                                {(member.username || member.email || '?').charAt(0).toUpperCase()}
                              </Text>
                            </View>

                            <Text style={styles.memberText}>
                              {member.username?.trim() || member.email}
                              {isOwnerMember ? (
                                <Text style={styles.ownerBadge}> (Owner)</Text>
                              ) : null}
                            </Text>
                          </View>

                          {isOwner && !isOwnerMember && (
                            <TouchableOpacity
                              style={styles.removeMemberButton}
                              onPress={() => handleRemoveMember(member.uid, member.email)}
                            >
                              <Text style={styles.removeMemberText}>Remove</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>

                {isOwner && (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionBlockTitle}>Share List</Text>

                    <View style={styles.shareRow}>
                      <TextInput
                        style={styles.shareInput}
                        placeholder="Enter user's email"
                        placeholderTextColor="#555"
                        value={shareEmail}
                        onChangeText={setShareEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />

                      <TouchableOpacity
                        style={[styles.shareButton, sharing && styles.shareButtonDisabled]}
                        onPress={handleShareList}
                        disabled={sharing}
                      >
                        <Text style={styles.shareButtonText}>{sharing ? '...' : 'Invite'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <Text style={styles.itemsHeader}>Items</Text>
              </>
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No items yet. Add your first item above.</Text>
            }
          />

          <View style={styles.bottomActions}>
            {isOwner ? (
              <TouchableOpacity style={styles.deleteListButton} onPress={handleDeleteList}>
                <Text style={styles.deleteIcon}>🗑</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.deleteListButton} onPress={handleLeaveList}>
                <Text style={styles.deleteIcon}>🚪</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111111',
  },
  keyboardContainer: {
    flex: 1,
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
    paddingBottom: 16,
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
  headerLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  titleEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  listTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  editTitleIcon: {
    fontSize: 16,
    color: '#555555',
  },
  titleInput: {
    flex: 1,
    marginBottom: 0,
  },
  saveTitleBtn: {
    backgroundColor: '#3CC47C',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  saveTitleBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  cancelTitleBtn: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelTitleBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  addItemRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#ffffff',
  },
  quantityInput: {
    width: 52,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 15,
    color: '#ffffff',
    textAlign: 'center',
  },
  addItemButton: {
    backgroundColor: '#3CC47C',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  addItemButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionBlock: {
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sectionBlockTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyMembersText: {
    color: '#555555',
    fontSize: 14,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3CC47C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  memberText: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
  ownerBadge: {
    color: '#3CC47C',
    fontSize: 13,
  },
  removeMemberButton: {
    backgroundColor: '#2a1a1a',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#c0392b',
  },
  removeMemberText: {
    color: '#c0392b',
    fontSize: 12,
    fontWeight: '600',
  },
  shareRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  shareInput: {
    flex: 1,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#ffffff',
  },
  shareButton: {
    backgroundColor: '#3CC47C',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  itemsHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 12,
  },
  emptyText: {
    color: '#555555',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 20,
  },
  swipeRowWrapper: {
    marginBottom: 8,
  },
  itemRow: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  itemRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#3CC47C',
    borderColor: '#3CC47C',
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTextBlock: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#ffffff',
  },
  quantityText: {
    color: '#888888',
    fontSize: 14,
  },
  completedItemText: {
    textDecorationLine: 'line-through',
    color: '#555555',
  },
  lastEditedText: {
    fontSize: 12,
    color: '#555555',
    marginTop: 3,
  },
  editContainer: {
    gap: 8,
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveItemButton: {
    flex: 1,
    backgroundColor: '#3CC47C',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveItemButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelItemButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelItemButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
    paddingLeft: 8,
  },
  swipeActionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    borderRadius: 12,
  },
  editSwipeButton: {
    backgroundColor: '#2a6496',
  },
  deleteSwipeButton: {
    backgroundColor: '#c0392b',
  },
  swipeActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    marginTop: 8,
  },
  deleteListButton: {
    backgroundColor: '#c0392b',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 18,
  },
});