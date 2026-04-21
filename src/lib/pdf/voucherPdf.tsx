import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import React from 'react';

const RED = '#860A15';
const RED_LIGHT = '#F5E6E8';
const TEXT = '#1A0E0E';
const MUTED = '#7A5C5C';
const BG_ALT = '#F5F0F0';
const BORDER = '#C4AEAE';

const s = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF', fontFamily: 'Helvetica' },

  // Header
  header: { backgroundColor: RED, paddingVertical: 36, paddingHorizontal: 40, alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 26, fontFamily: 'Helvetica-Bold', letterSpacing: 3 },
  headerSub: { color: '#F5C6CA', fontSize: 11, marginTop: 6, letterSpacing: 1 },

  // Body
  body: { paddingHorizontal: 40, paddingVertical: 32, flex: 1 },

  giftBadge: {
    backgroundColor: RED_LIGHT,
    color: RED,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },

  voucherType: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: TEXT, marginBottom: 24 },

  // Code box
  codeBox: {
    backgroundColor: BG_ALT,
    borderRadius: 8,
    paddingVertical: 22,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: RED,
    borderLeftStyle: 'solid',
  },
  codeLabel: { fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 10, fontFamily: 'Helvetica-Bold' },
  code: { fontSize: 30, fontFamily: 'Helvetica-Bold', color: RED, letterSpacing: 5 },
  validUntil: { fontSize: 10, color: MUTED, marginTop: 8 },

  // Recipient
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 20 },
  sectionLabel: { fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  recipientName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: TEXT },

  // Message
  messageBubble: {
    backgroundColor: RED_LIGHT,
    borderRadius: 6,
    padding: 14,
    marginTop: 14,
  },
  messageText: { fontSize: 12, color: TEXT, fontStyle: 'italic', lineHeight: 1.6 },

  // Amount row
  amountRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  amountText: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: RED },

  // Footer
  footer: { paddingHorizontal: 40, paddingVertical: 20, borderTopWidth: 1, borderTopColor: BORDER, borderTopStyle: 'solid' },
  footerText: { fontSize: 10, color: MUTED, textAlign: 'center', lineHeight: 1.7 },
});

interface VoucherPdfProps {
  code: string;
  voucherTypeName: string;
  amount: number;
  currency: string;
  buyerName: string;
  recipientName?: string;
  recipientMessage?: string;
  validUntil: string;
}

function VoucherDocument({
  code,
  voucherTypeName,
  amount,
  currency,
  buyerName,
  recipientName,
  recipientMessage,
  validUntil,
}: VoucherPdfProps) {
  const displayName = recipientName || buyerName;
  const currencySymbol = currency.toUpperCase() === 'EUR' ? '€' : currency.toUpperCase();

  return (
    <Document title="Escuela de Wok — Gift Voucher" author="Escuela de Wok">
      <Page size="A5" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>ESCUELA DE WOK</Text>
          <Text style={s.headerSub}>Chinese Cooking Classes · Madrid</Text>
        </View>

        {/* Body */}
        <View style={s.body}>
          <Text style={s.giftBadge}>GIFT VOUCHER</Text>
          <Text style={s.voucherType}>{voucherTypeName}</Text>

          {/* Code */}
          <View style={s.codeBox}>
            <Text style={s.codeLabel}>VOUCHER CODE</Text>
            <Text style={s.code}>{code}</Text>
            <Text style={s.validUntil}>Valid until {validUntil}</Text>
          </View>

          {/* Recipient */}
          <View style={s.divider} />
          <Text style={s.sectionLabel}>FOR</Text>
          <Text style={s.recipientName}>{displayName}</Text>

          {/* Personal message */}
          {recipientMessage ? (
            <View style={s.messageBubble}>
              <Text style={s.messageText}>"{recipientMessage}"</Text>
            </View>
          ) : null}

          {/* Amount */}
          <View style={s.amountRow}>
            <Text style={s.amountText}>{amount} {currencySymbol}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Enter this code at checkout on escueladewok.com to redeem your voucher.{'\n'}
            Questions? hola@escueladewok.com
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateVoucherPdf(props: VoucherPdfProps): Promise<Buffer> {
  const arrayBuffer = await renderToBuffer(<VoucherDocument {...props} />);
  return Buffer.from(arrayBuffer);
}

export function formatVoucherTypeName(voucherKey: string): string {
  switch (voucherKey) {
    case 'classVoucher': return 'Cooking Class';
    case 'giftCard25':   return 'Gift Card — 25 €';
    case 'giftCard50':   return 'Gift Card — 50 €';
    default:             return 'Gift Voucher';
  }
}
