import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { COMPANY_DATA, PROFORMA_PAYMENT_LABELS } from '@/config/companyData';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

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
    fontSize: 9,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  issueDate: {
    fontSize: 9,
    textAlign: 'right',
  },
  partiesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    marginTop: 10,
  },
  partyColumn: {
    width: '48%',
  },
  partyTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  partyText: {
    fontSize: 9,
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderTop: '1px solid #000',
    borderBottom: '1px solid #000',
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #ccc',
    paddingVertical: 4,
  },
  colLp: { width: '4%', textAlign: 'center' },
  colName: { width: '30%', paddingLeft: 4 },
  colQty: { width: '6%', textAlign: 'center' },
  colUnit: { width: '6%', textAlign: 'center' },
  colNetPrice: { width: '12%', textAlign: 'right', paddingRight: 4 },
  colVat: { width: '8%', textAlign: 'center' },
  colNetAmount: { width: '12%', textAlign: 'right', paddingRight: 4 },
  colVatAmount: { width: '10%', textAlign: 'right', paddingRight: 4 },
  colGross: { width: '12%', textAlign: 'right', paddingRight: 4 },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginBottom: 15,
  },
  summaryTable: {
    width: '50%',
  },
  summaryHeader: {
    flexDirection: 'row',
    borderTop: '1px solid #000',
    borderBottom: '1px solid #000',
    paddingVertical: 3,
    backgroundColor: '#f5f5f5',
  },
  summaryRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #ccc',
    paddingVertical: 3,
  },
  summaryColLabel: { width: '25%', textAlign: 'center' },
  summaryColValue: { width: '25%', textAlign: 'right', paddingRight: 6 },
  paymentInfo: {
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  paymentText: {
    fontSize: 9,
    marginBottom: 3,
  },
  totalSection: {
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalWords: {
    fontSize: 9,
    marginTop: 4,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 60,
    paddingTop: 20,
  },
  signatureBox: {
    width: '40%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: '1px dashed #666',
    marginBottom: 5,
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
    borderTop: '1px solid #eee',
    paddingTop: 8,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    fontSize: 8,
    color: '#666',
  },
  disclaimer: {
    marginTop: 20,
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
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

const numberToWords = (num: number): string => {
  const ones = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
  const teens = ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
  const tens = ['', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
  const hundreds = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset', 'dziewięćset'];
  const thousands = ['', 'tysiąc', 'tysiące', 'tysięcy'];
  
  if (num === 0) return 'zero';
  
  const getThousandForm = (n: number): string => {
    if (n === 1) return thousands[1];
    if (n >= 2 && n <= 4) return thousands[2];
    return thousands[3];
  };
  
  const convertHundreds = (n: number): string => {
    const parts: string[] = [];
    if (n >= 100) {
      parts.push(hundreds[Math.floor(n / 100)]);
      n = n % 100;
    }
    if (n >= 20) {
      parts.push(tens[Math.floor(n / 10)]);
      n = n % 10;
    } else if (n >= 10) {
      parts.push(teens[n - 10]);
      return parts.join(' ');
    }
    if (n > 0) {
      parts.push(ones[n]);
    }
    return parts.join(' ');
  };
  
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);
  
  let result = '';
  
  if (intPart >= 1000) {
    const th = Math.floor(intPart / 1000);
    result += (th === 1 ? '' : convertHundreds(th) + ' ') + getThousandForm(th) + ' ';
  }
  
  const remainder = intPart % 1000;
  if (remainder > 0 || intPart === 0) {
    result += convertHundreds(remainder);
  }
  
  result = result.trim();
  result += ` PLN ${decPart.toString().padStart(2, '0')}/100`;
  
  return result;
};

export const ProformaTemplate = ({ data }: ProformaTemplateProps) => {
  const formatCurrency = (amount: number) => {
    return amount.toFixed(2).replace('.', ',');
  };

  const serviceDescription = `Wynajem kampera ${data.vehicleModel} - ${PROFORMA_PAYMENT_LABELS[data.paymentType]} (${data.rentalPeriod.start} - ${data.rentalPeriod.end})`;
  const vatRate = 23;
  const netAmount = data.amount / (1 + vatRate / 100);
  const vatAmount = data.amount - netAmount;
  const daysUntilDue = Math.ceil((data.dueDate.getTime() - data.issueDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Proforma nr: {data.proformaNumber}</Text>
          <Text style={styles.issueDate}>Data wystawienia: {format(data.issueDate, 'yyyy-MM-dd')}</Text>
        </View>

        {/* Seller / Buyer */}
        <View style={styles.partiesSection}>
          <View style={styles.partyColumn}>
            <Text style={styles.partyTitle}>Sprzedawca</Text>
            <Text style={styles.partyText}>{COMPANY_DATA.shortName}</Text>
            <Text style={styles.partyText}>{COMPANY_DATA.address.street}</Text>
            <Text style={styles.partyText}>{COMPANY_DATA.address.postalCode} {COMPANY_DATA.address.city}</Text>
            <Text style={styles.partyText}>NIP: {COMPANY_DATA.nip}</Text>
            <Text style={styles.partyText}>e-mail: {COMPANY_DATA.email}</Text>
            <Text style={styles.partyText}>bank: {COMPANY_DATA.bank.name}</Text>
            <Text style={styles.partyText}>Nr konta: {COMPANY_DATA.bank.accountNumber}</Text>
          </View>
          <View style={styles.partyColumn}>
            <Text style={styles.partyTitle}>Nabywca</Text>
            <Text style={styles.partyText}>{data.client.name}</Text>
            {data.client.address && <Text style={styles.partyText}>{data.client.address}</Text>}
            {data.client.nip && <Text style={styles.partyText}>NIP: {data.client.nip}</Text>}
            {data.client.email && <Text style={styles.partyText}>e-mail: {data.client.email}</Text>}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colLp}>Lp.</Text>
            <Text style={styles.colName}>Nazwa towaru/usługi</Text>
            <Text style={styles.colQty}>Ilość</Text>
            <Text style={styles.colUnit}>Jm</Text>
            <Text style={styles.colNetPrice}>Cena netto</Text>
            <Text style={styles.colVat}>VAT</Text>
            <Text style={styles.colNetAmount}>Kwota netto</Text>
            <Text style={styles.colVatAmount}>Kwota VAT</Text>
            <Text style={styles.colGross}>Kwota brutto</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colLp}>1.</Text>
            <Text style={styles.colName}>{serviceDescription}</Text>
            <Text style={styles.colQty}>1,00</Text>
            <Text style={styles.colUnit}>szt.</Text>
            <Text style={styles.colNetPrice}>{formatCurrency(netAmount)}</Text>
            <Text style={styles.colVat}>{vatRate}%</Text>
            <Text style={styles.colNetAmount}>{formatCurrency(netAmount)}</Text>
            <Text style={styles.colVatAmount}>{formatCurrency(vatAmount)}</Text>
            <Text style={styles.colGross}>{formatCurrency(data.amount)}</Text>
          </View>
        </View>

        {/* VAT Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryTable}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryColLabel}>Stawka VAT</Text>
              <Text style={styles.summaryColValue}>Netto</Text>
              <Text style={styles.summaryColValue}>VAT</Text>
              <Text style={styles.summaryColValue}>Brutto</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryColLabel}>{vatRate}%</Text>
              <Text style={styles.summaryColValue}>{formatCurrency(netAmount)}</Text>
              <Text style={styles.summaryColValue}>{formatCurrency(vatAmount)}</Text>
              <Text style={styles.summaryColValue}>{formatCurrency(data.amount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryColLabel}>Razem</Text>
              <Text style={styles.summaryColValue}>{formatCurrency(netAmount)}</Text>
              <Text style={styles.summaryColValue}>{formatCurrency(vatAmount)}</Text>
              <Text style={styles.summaryColValue}>{formatCurrency(data.amount)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentText}>Sposób zapłaty: przelew</Text>
          <Text style={styles.paymentText}>Termin zapłaty: {daysUntilDue} dni</Text>
          <Text style={styles.paymentText}>{format(data.dueDate, 'yyyy-MM-dd')}</Text>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalText}>Razem do zapłaty: {formatCurrency(data.amount)} PLN</Text>
          <Text style={styles.totalWords}>Kwota słownie: {numberToWords(data.amount)}</Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text>Proforma nie jest dokumentem księgowym. Faktura VAT zostanie wystawiona po zaksięgowaniu płatności.</Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Osoba upoważniona do odbioru</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Osoba upoważniona do wystawienia</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Utworzone w systemie {COMPANY_DATA.shortName} | {COMPANY_DATA.website}
        </Text>
        <Text style={styles.pageNumber}>1/1</Text>
      </Page>
    </Document>
  );
};
