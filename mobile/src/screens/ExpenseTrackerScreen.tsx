import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Expense } from '../types/expense';
import { addExpense, deleteExpense, getExpenses } from '../services/api';

const CATEGORY_EMOJI: Record<string, string> = {
  'Food & Dining': '🍔',
  Transport: '🚗',
  Shopping: '🛒',
  Entertainment: '📺',
  'Bills & Utilities': '📄',
  Health: '💊',
  Travel: '✈️',
  Other: '📦',
};

function formatRupees(amount: number) {
  return `₹${Math.round(amount)}`;
}

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diffMs = Date.now() - t;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function ExpenseTrackerScreen() {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [lastAdded, setLastAdded] = useState<Expense | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(() => new Set());

  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await getExpenses();
      setExpenses(list);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load expenses');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, [load]);

  const canSubmit = input.trim().length > 0 && !submitting;

  const onAdd = useCallback(async () => {
    if (!canSubmit) return;
    const text = input.trim();
    setSubmitting(true);
    try {
      const created = await addExpense(text);
      setInput('');
      setLastAdded(created);
      setExpenses(prev => [created, ...prev]);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setLastAdded(null), 3000);
    } catch (e: any) {
      Alert.alert('Could not add expense', e?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, input]);

  const onDelete = useCallback(
    (expense: Expense) => {
      Alert.alert('Delete this expense?', undefined, [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            Alert.alert('No delete request sent');
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingIds(prev => new Set(prev).add(expense.id));
            const snapshot = expenses;
            setExpenses(prev => prev.filter(e => e.id !== expense.id));
            try {
              await deleteExpense(expense.id);
              Alert.alert('Delete success');
            } catch (e: any) {
              setExpenses(snapshot);
              Alert.alert('Error', e?.message ?? 'Failed to delete expense');
            } finally {
              setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(expense.id);
                return next;
              });
            }
          },
        },
      ]);
    },
    [expenses],
  );

  const header = useMemo(() => {
    return (
      <View style={styles.headerWrap}>
        <Text style={styles.title}>AI Expense Tracker</Text>
        <Text style={styles.subtitle}>Add expenses in plain English</Text>

        <View style={styles.inputCard}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="e.g., Spent 500 on groceries at BigBazaar"
            placeholderTextColor="#9CA3AF"
            style={styles.textInput}
            editable={!submitting}
            returnKeyType="done"
            onSubmitEditing={onAdd}
          />
          <Pressable
            onPress={onAdd}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.addButton,
              (!canSubmit || submitting) && styles.addButtonDisabled,
              pressed && canSubmit ? styles.addButtonPressed : null,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Add</Text>
            )}
          </Pressable>
        </View>

        {lastAdded ? (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>✅ Added Successfully!</Text>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Amount</Text>
              <Text style={styles.successValue}>{formatRupees(lastAdded.amount)}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Category</Text>
              <Text style={styles.successValue}>
                {(CATEGORY_EMOJI[lastAdded.category] ?? '📦') + ' ' + lastAdded.category}
              </Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Description</Text>
              <Text style={styles.successValue}>{lastAdded.description}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Merchant</Text>
              <Text style={styles.successValue}>{lastAdded.merchant ?? '—'}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Recent Expenses</Text>
      </View>
    );
  }, [canSubmit, input, lastAdded, onAdd, submitting]);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={expenses}
        keyExtractor={item => String(item.id)}
        refreshing={refreshing}
        onRefresh={load}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const emoji = CATEGORY_EMOJI[item.category] ?? '📦';
          const isDeleting = deletingIds.has(item.id);
          return (
            <View style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemCategory}>
                    {emoji} {item.category}
                  </Text>
                </View>
                <Text style={styles.itemAmount}>{formatRupees(item.amount)}</Text>
              </View>

              <Text style={styles.itemDesc}>{item.description}</Text>

              <View style={styles.itemBottomRow}>
                <Text style={styles.itemTime}>{timeAgo(item.created_at)}</Text>
                <Pressable
                  onPress={() => onDelete(item)}
                  disabled={isDeleting}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    isDeleting && styles.deleteButtonDisabled,
                    pressed && !isDeleting ? styles.deleteButtonPressed : null,
                  ]}
                >
                  {isDeleting ? (
                    <ActivityIndicator color="#991B1B" />
                  ) : (
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  )}
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No expenses yet. Add your first one!</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width:'100%',
    paddingHorizontal:16,
    
  },
  listContent: {
    paddingBottom: 24,
  },
  headerWrap: {
    paddingHorizontal:16,
    paddingTop: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
  },
  inputCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  textInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#111827',
  },
  addButton: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  addButtonPressed: {
    opacity: 0.9,
  },
  addButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  successCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successTitle: {
    fontWeight: '800',
    color: '#065F46',
    fontSize: 15,
    marginBottom: 10,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  successLabel: {
    color: '#065F46',
    fontWeight: '700',
  },
  successValue: {
    color: '#064E3B',
    fontWeight: '600',
    maxWidth: '68%',
    textAlign: 'right',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 10,
    fontWeight: '800',
    color: '#0F172A',
    fontSize: 16,
  },
  itemCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  itemCategory: {
    fontWeight: '800',
    color: '#0F172A',
    fontSize: 15,
  },
  itemAmount: {
    fontWeight: '900',
    color: '#0F172A',
    fontSize: 16,
  },
  itemDesc: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  itemBottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTime: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteButtonPressed: {
    opacity: 0.9,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#991B1B',
    fontWeight: '800',
  },
  emptyWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyText: {
    color: '#64748B',
    fontWeight: '600',
  },
});

