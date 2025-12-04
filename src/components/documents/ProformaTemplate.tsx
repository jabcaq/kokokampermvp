import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { COMPANY_DATA, PROFORMA_PAYMENT_LABELS } from '@/config/companyData';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

// Register fonts (using default sans-serif for now)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '2px solid #2563eb',
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 'auto',
  },
  companyInfo: {
    textAlign: 'right',
    fontSize: 9,
    color: '#666666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 20,
  },
  proformaNumber: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    color: '#333333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e40af',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#666666',
    width: '40%',
  },
  value: {
    fontWeight: 'bold',
    width: '60%',
    textAlign: 'right',
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    padding: 8,
  },
  tableCell: {
    flex: 1,
  },
  tableCellWide: {
    flex: 2,
  },
  tableCellRight: {
    flex: 1,
    textAlign: 'right',
  },
  totalSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f9ff',
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  bankSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    border: '1px solid #f59e0b',
  },
  bankTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#92400e',
  },
  bankRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bankLabel: {
    width: '35%',
    color: '#92400e',
  },
  bankValue: {
    width: '65%',
    fontWeight: 'bold',
    color: '#78350f',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1px solid #e5e7eb',
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
  },
  disclaimer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fee2e2',
    borderRadius: 4,
    fontSize: 9,
    color: '#991b1b',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    fontSize: 9,
    color: '#666666',
  },
});

interface ProformaData {
  proformaNumber: string;
  contractNumber: string;
  issueDate: Date;
  dueDate: Date;
  paymentType: 'reservation' | 'main_payment' | 'final' | 'deposit';
  amount: number;
  vehicleModel: string;
  rentalPeriod: {
    start: string;
    end: string;
  };
  client: {
    name: string;
    address?: string;
    nip?: string;
    email?: string;
  };
}

interface ProformaTemplateProps {
  data: ProformaData;
}

export const ProformaTemplate = ({ data }: ProformaTemplateProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const serviceDescription = `Wynajem kampera ${data.vehicleModel} - ${PROFORMA_PAYMENT_LABELS[data.paymentType]}`;
  const transferTitle = `Proforma ${data.proformaNumber} - ${data.client.name}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563eb' }}>
              {COMPANY_DATA.shortName}
            </Text>
            <Text style={{ fontSize: 8, color: '#666666', marginTop: 4 }}>
              {COMPANY_DATA.name}
            </Text>
          </View>
          <View style={styles.companyInfo}>
            <Text>{COMPANY_DATA.address.full}</Text>
            <Text>NIP: {COMPANY_DATA.nip}</Text>
            <Text>{COMPANY_DATA.email}</Text>
            <Text>{COMPANY_DATA.website}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>PROFORMA</Text>
        <Text style={styles.proformaNumber}>Nr {data.proformaNumber}</Text>

        {/* Dates */}
        <View style={styles.dates}>
          <Text>Data wystawienia: {format(data.issueDate, 'dd.MM.yyyy', { locale: pl })}</Text>
          <Text>Termin płatności: {format(data.dueDate, 'dd.MM.yyyy', { locale: pl })}</Text>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nabywca</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nazwa:</Text>
            <Text style={styles.value}>{data.client.name}</Text>
          </View>
          {data.client.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Adres:</Text>
              <Text style={styles.value}>{data.client.address}</Text>
            </View>
          )}
          {data.client.nip && (
            <View style={styles.row}>
              <Text style={styles.label}>NIP:</Text>
              <Text style={styles.value}>{data.client.nip}</Text>
            </View>
          )}
          {data.client.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{data.client.email}</Text>
            </View>
          )}
        </View>

        {/* Contract Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Szczegóły rezerwacji</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nr umowy:</Text>
            <Text style={styles.value}>{data.contractNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pojazd:</Text>
            <Text style={styles.value}>{data.vehicleModel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Okres najmu:</Text>
            <Text style={styles.value}>{data.rentalPeriod.start} - {data.rentalPeriod.end}</Text>
          </View>
        </View>

        {/* Services Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCellWide}>Opis usługi</Text>
            <Text style={styles.tableCellRight}>Kwota brutto</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellWide}>{serviceDescription}</Text>
            <Text style={styles.tableCellRight}>{formatCurrency(data.amount)}</Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>DO ZAPŁATY:</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.amount)}</Text>
          </View>
        </View>

        {/* Bank Details */}
        <View style={styles.bankSection}>
          <Text style={styles.bankTitle}>DANE DO PRZELEWU</Text>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Odbiorca:</Text>
            <Text style={styles.bankValue}>{COMPANY_DATA.name}</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Bank:</Text>
            <Text style={styles.bankValue}>{COMPANY_DATA.bank.name}</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Nr konta:</Text>
            <Text style={styles.bankValue}>{COMPANY_DATA.bank.accountNumberFormatted}</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Tytuł przelewu:</Text>
            <Text style={styles.bankValue}>{transferTitle}</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text>UWAGA: Proforma nie jest dokumentem księgowym (fakturą VAT).</Text>
          <Text>Faktura zostanie wystawiona po zaksięgowaniu płatności.</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Dokument wygenerowany automatycznie przez system {COMPANY_DATA.shortName}</Text>
          <Text>{COMPANY_DATA.website} | {COMPANY_DATA.email} | {COMPANY_DATA.phone}</Text>
        </View>
      </Page>
    </Document>
  );
};
