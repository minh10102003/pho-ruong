import { StyleSheet } from 'react-native';
import { COLORS } from '../constants';

/** Khoảng cách form: vừa đủ, không sát cũng không quá thưa */
export const FORM_SPACING = {
  titleBottom: 14,
  sectionHeaderBottom: 14,
  labelTop: 12,
  labelTopFirst: 6,
  labelBottom: 8,
  fieldGap: 12,
  modalTitleBottom: 14,
  formActionTop: 16,
} as const;

export const formStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: FORM_SPACING.titleBottom,
  },
  sectionTitleInline: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: FORM_SPACING.modalTitleBottom,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: FORM_SPACING.labelTop,
    marginBottom: FORM_SPACING.labelBottom,
  },
  labelFirst: {
    marginTop: FORM_SPACING.labelTopFirst,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  fieldGroup: {
    gap: FORM_SPACING.fieldGap,
  },
  formAction: {
    marginTop: FORM_SPACING.formActionTop,
  },
  formActionTight: {
    marginTop: 4,
  },
});
