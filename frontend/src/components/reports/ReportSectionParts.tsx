import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

export function ReportSectionBanner({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.banner}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function ReportSummaryGrid({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <View style={styles.summaryGrid}>
      {items.map((item) => (
        <View key={item.label} style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{item.label}</Text>
          <Text style={styles.summaryValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: COLORS.selected,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    flexGrow: 1,
    minWidth: '47%',
    backgroundColor: COLORS.selected,
    borderRadius: 10,
    padding: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
