import { pdf } from '@react-pdf/renderer';
import { ProformaTemplate } from '@/components/documents/ProformaTemplate';
import { format, addDays } from 'date-fns';
import { pl } from 'date-fns/locale';

export type ProformaPaymentType = 'reservation' | 'main_payment' | 'final' | 'deposit';

interface ProformaGenerationParams {
  contractNumber: string;
  contractId: string;
  paymentType: ProformaPaymentType;
  amount: number;
  vehicleModel: string;
  startDate: string;
  endDate: string;
  client: {
    name: string;
    address?: string;
    nip?: string;
    email?: string;
  };
  paymentDueDays?: number;
}

export const generateProformaNumber = (contractNumber: string, paymentType: ProformaPaymentType): string => {
  const typeCode = {
    reservation: 'RZ',
    main_payment: 'PG',
    final: 'KN',
    deposit: 'KC'
  }[paymentType];
  
  const timestamp = Date.now().toString().slice(-6);
  return `PRO/${contractNumber}/${typeCode}/${timestamp}`;
};

export const generateProformaPDF = async (params: ProformaGenerationParams): Promise<Blob> => {
  const proformaNumber = generateProformaNumber(params.contractNumber, params.paymentType);
  const issueDate = new Date();
  const dueDate = addDays(issueDate, params.paymentDueDays || 7);

  const formatDateForDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd.MM.yyyy', { locale: pl });
    } catch {
      return dateString;
    }
  };

  const proformaData = {
    proformaNumber,
    contractNumber: params.contractNumber,
    issueDate,
    dueDate,
    paymentType: params.paymentType,
    amount: params.amount,
    vehicleModel: params.vehicleModel,
    rentalPeriod: {
      start: formatDateForDisplay(params.startDate),
      end: formatDateForDisplay(params.endDate),
    },
    client: params.client,
  };

  const doc = <ProformaTemplate data={proformaData} />;
  const blob = await pdf(doc).toBlob();
  return blob;
};

export const downloadProforma = async (params: ProformaGenerationParams): Promise<void> => {
  const blob = await generateProformaPDF(params);
  const url = URL.createObjectURL(blob);
  
  const typeLabel = {
    reservation: 'rezerwacja',
    main_payment: 'platnosc_glowna',
    final: 'koncowa',
    deposit: 'kaucja'
  }[params.paymentType];

  const fileName = `Proforma_${params.contractNumber.replace(/\//g, '-')}_${typeLabel}.pdf`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const getProformaBlob = async (params: ProformaGenerationParams): Promise<{ blob: Blob; fileName: string }> => {
  const blob = await generateProformaPDF(params);
  
  const typeLabel = {
    reservation: 'rezerwacja',
    main_payment: 'platnosc_glowna',
    final: 'koncowa',
    deposit: 'kaucja'
  }[params.paymentType];

  const fileName = `Proforma_${params.contractNumber.replace(/\//g, '-')}_${typeLabel}.pdf`;
  
  return { blob, fileName };
};
