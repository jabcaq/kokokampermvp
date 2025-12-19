import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, FileText, User, Car, CreditCard, Edit2, Save, X, Link2, Loader2, Users, Truck, Package, MessageCircle, Search, FolderOpen, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useContract, useUpdateContract } from "@/hooks/useContracts";
import { supabase } from "@/integrations/supabase/client";
import { useVehicles } from "@/hooks/useVehicles";
import { useVehicleHandovers, useAddVehicleHandover } from "@/hooks/useVehicleHandovers";
import { useVehicleReturns, useAddVehicleReturn } from "@/hooks/useVehicleReturns";
import { useQuery } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { pl } from "date-fns/locale";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { DriversTab } from "@/components/contract-tabs/DriversTab";
import { HandoverTab } from "@/components/contract-tabs/HandoverTab";
import { ReturnTab } from "@/components/contract-tabs/ReturnTab";
import { InvoicesReceiptsTab } from "@/components/contract-tabs/InvoicesReceiptsTab";
import { ConversationTab } from "@/components/contract-tabs/ConversationTab";
import { DocumentsTab } from "@/components/contract-tabs/DocumentsTab";
import { ContractActionsPanel } from "@/components/contract-actions/ContractActionsPanel";
import { AccountingPanel } from "@/components/contract-actions/AccountingPanel";

const statusConfig = {
  active: { label: "Aktywna", className: "bg-primary/10 text-primary border-primary/20" },
  pending: { label: "Oczekująca", className: "bg-secondary/10 text-secondary border-secondary/20" },
  completed: { label: "Zakończona", className: "bg-muted text-muted-foreground border-muted" },
  cancelled: { label: "Anulowana", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const WARSAW_TZ = "Europe/Warsaw";

const ContractDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [activeTab, setActiveTab] = useState("contract");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
  
  const { data: contract, isLoading } = useContract(id);
  const { data: vehicles } = useVehicles();
  const { data: handovers } = useVehicleHandovers(id);
  const { data: returns } = useVehicleReturns(id, true); // Include incomplete returns for contract details
  
  // Check if user has accounting role
  const { data: userRoles } = useQuery({
    queryKey: ["user_roles_accounting"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isAccounting: false };
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      const roles = data?.map(r => r.role) || [];
      return {
        isAccounting: roles.includes("accounting"),
      };
    },
  });
  
  // Set default tab based on role
  useEffect(() => {
    if (userRoles?.isAccounting) {
      setActiveTab("contract"); // Default to contract view for accounting
    }
  }, [userRoles]);
  
  // Fetch scheduled return booking (not completed)
  const { data: scheduledReturn } = useQuery({
    queryKey: ["scheduled_return", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("vehicle_returns")
        .select("*")
        .eq("contract_id", id)
        .eq("return_completed", false)
        .not("scheduled_return_date", "is", null)
        .order("scheduled_return_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
  
  const updateContractMutation = useUpdateContract();

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    
    const activeVehicles = vehicles.filter(v => v.status !== 'archived');
    
    if (!vehicleFilter.trim()) return activeVehicles;
    
    const searchLower = vehicleFilter.toLowerCase();
    return activeVehicles.filter(vehicle => 
      (vehicle.type?.toLowerCase().includes(searchLower)) ||
      (vehicle.model?.toLowerCase().includes(searchLower)) ||
      (vehicle.registration_number?.toLowerCase().includes(searchLower))
    );
  }, [vehicles, vehicleFilter]);

  // Helper function to parse old vehicle_additional_info for legacy contracts
  const parseVehicleOptions = (additionalInfo: string | null | undefined) => {
    if (!additionalInfo) return { cleaning: null, animals: null, extra_equipment: null };
    
    const cleaningMatch = additionalInfo.match(/Sprzątanie dodatkowo:\s*(Tak|Nie)/i);
    const animalsMatch = additionalInfo.match(/Zwierzę:\s*(Tak|Nie)/i);
    const equipmentMatch = additionalInfo.match(/Wyposażenie dodatkowo:\s*(Tak|Nie)/i);
    
    return {
      cleaning: cleaningMatch ? cleaningMatch[1] : null,
      animals: animalsMatch ? animalsMatch[1] : null,
      extra_equipment: equipmentMatch ? equipmentMatch[1] : null,
    };
  };

  const sanitizeContractUpdates = (data: any) => {
    const sanitized: any = { ...data };

    // Remove fields that are not actual columns in the contracts table
    delete sanitized.client;
    delete sanitized.created_at;
    delete sanitized.updated_at;

    const normalizeDate = (key: string) => {
      if (sanitized[key] === '') sanitized[key] = null;
      else if (typeof sanitized[key] === 'string' && sanitized[key].includes('T')) {
        sanitized[key] = sanitized[key].split('T')[0];
      }
    };

    // Normalize date-only fields stored as DATE in DB (not start_date/end_date - they are timestamps)
    normalizeDate('tenant_license_date');
    normalizeDate('vehicle_next_inspection');
    normalizeDate('vehicle_insurance_valid_until');

    // Ensure numeric column types
    if (sanitized.value !== undefined) {
      sanitized.value = sanitized.value === '' || sanitized.value === null ? null : Number(sanitized.value);
      if (Number.isNaN(sanitized.value)) delete sanitized.value;
    }

    // Coerce numeric amounts inside payments JSON to numbers/null
    if (sanitized.payments) {
      const toNum = (val: any) => (val === '' || val === null || val === undefined ? null : Number(val));
      const p = { ...sanitized.payments };
      if (p.rezerwacyjna) p.rezerwacyjna = { ...p.rezerwacyjna, wysokosc: toNum(p.rezerwacyjna.wysokosc) };
      if (p.zasadnicza) p.zasadnicza = { ...p.zasadnicza, wysokosc: toNum(p.zasadnicza.wysokosc) };
      if (p.kaucja) p.kaucja = { ...p.kaucja, wysokosc: toNum(p.kaucja.wysokosc) };
      sanitized.payments = p;
    }

    return sanitized;
  };

  const handleEdit = () => {
    const initialData = { ...contract };
    console.log('Starting edit with data:', initialData);
    setEditedData(initialData);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const selectedVehicle = vehicles?.find(v => v.id === vehicleId);
    if (selectedVehicle) {
      const updates = {
        vehicle_model: selectedVehicle.model,
        registration_number: selectedVehicle.registration_number,
        vehicle_vin: selectedVehicle.vin,
        vehicle_next_inspection: selectedVehicle.next_inspection_date,
        vehicle_insurance_number: selectedVehicle.insurance_policy_number,
        vehicle_insurance_valid_until: selectedVehicle.insurance_valid_until,
        vehicle_additional_info: selectedVehicle.additional_info,
      };
      setEditedData({ ...editedData, ...updates });
    }
  };

  const handleSave = async () => {
    if (!id) return;
    
    const updates = sanitizeContractUpdates(editedData);
    console.log('Saving data (sanitized):', updates);
    
    // Check if status is being changed to cancelled, active, or completed
    const statusChangedToCancelled = updates.status === 'cancelled' && contract?.status !== 'cancelled';
    const statusChangedToActive = updates.status === 'active' && contract?.status !== 'active';
    const statusChangedToCompleted = updates.status === 'completed' && contract?.status !== 'completed';
    
    if (statusChangedToCancelled || statusChangedToActive || statusChangedToCompleted) {
      setPendingStatusChange(updates.status);
      setShowStatusDialog(true);
      return;
    }
    
    try {
      await updateContractMutation.mutateAsync({
        id,
        updates,
      });
      
      // Synchronizuj wszystkie dane najemcy z profilem klienta
      if (contract?.client_id) {
        try {
          const clientUpdates: any = {};
          
          // Podstawowe dane kontaktowe
          if (updates.tenant_name !== undefined) clientUpdates.name = updates.tenant_name;
          if (updates.tenant_email !== undefined) clientUpdates.email = updates.tenant_email;
          if (updates.tenant_phone !== undefined) clientUpdates.phone = updates.tenant_phone;
          if (updates.tenant_address !== undefined) clientUpdates.address = updates.tenant_address;
          
          // Dokumenty tożsamości
          if (updates.tenant_id_type !== undefined) clientUpdates.id_type = updates.tenant_id_type;
          if (updates.tenant_id_number !== undefined) clientUpdates.id_number = updates.tenant_id_number;
          if (updates.tenant_id_issuer !== undefined) clientUpdates.id_issuer = updates.tenant_id_issuer;
          if (updates.tenant_pesel !== undefined) clientUpdates.pesel = updates.tenant_pesel;
          if (updates.tenant_nip !== undefined) clientUpdates.nip = updates.tenant_nip;
          
          // Prawo jazdy
          if (updates.tenant_license_number !== undefined) clientUpdates.license_number = updates.tenant_license_number;
          if (updates.tenant_license_category !== undefined) clientUpdates.license_category = updates.tenant_license_category;
          if (updates.tenant_license_date !== undefined) clientUpdates.license_date = updates.tenant_license_date;
          if (updates.tenant_trailer_license_category !== undefined) clientUpdates.trailer_license_category = updates.tenant_trailer_license_category;
          
          // Dane firmowe
          if (updates.tenant_company_name !== undefined) clientUpdates.company_name = updates.tenant_company_name;
          
          // Aktualizuj tylko jeśli są jakieś zmiany
          if (Object.keys(clientUpdates).length > 0) {
            const { error: clientError } = await supabase
              .from('clients')
              .update(clientUpdates)
              .eq('id', contract.client_id);
            
            if (clientError) {
              console.error('Error updating client info:', clientError);
            } else {
              console.log('Client profile updated with:', clientUpdates);
            }
          }
        } catch (clientErr) {
          console.error('Failed to update client:', clientErr);
        }
      }
      
      toast({
        title: "Umowa zaktualizowana",
        description: "Zmiany zostały pomyślnie zapisane.",
      });
      setIsEditing(false);
      setEditedData({});
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować umowy.",
        variant: "destructive",
      });
    }
  };

  const confirmStatusChange = async () => {
    if (!id) return;
    
    const updates = sanitizeContractUpdates(editedData);
    
    try {
      await updateContractMutation.mutateAsync({
        id,
        updates,
      });

      // Wyślij webhook jeśli status zmienił się na 'active'
      if (pendingStatusChange === 'active' && contract) {
        try {
          console.log('Sending webhook notification for contract becoming active');
          await supabase.functions.invoke('notify-contract-active', {
            body: {
              contractId: contract.id,
              contractNumber: contract.contract_number,
            },
          });
        } catch (webhookErr) {
          console.error('Failed to send webhook:', webhookErr);
        }
      }

      // Handle cancellation
      if (pendingStatusChange === 'cancelled' && contract) {
        try {
          await supabase.functions.invoke('notify-contract-cancelled', {
            body: {
              contractId: contract.id,
              contractNumber: contract.contract_number,
              tenantName: contract.tenant_name,
              cancelledAt: new Date().toISOString(),
              previousStatus: contract.status
            }
          });

          await supabase.functions.invoke('update-contract-folder-name', {
            body: {
              contract_id: contract.id,
              suffix: ' [ANULOWANA]'
            }
          });
        } catch (funcError) {
          console.error('Error calling edge functions:', funcError);
        }
      }

      // Synchronizuj dane klienta
      if (contract?.client_id) {
        try {
          const clientUpdates: any = {};
          
          if (updates.tenant_name !== undefined) clientUpdates.name = updates.tenant_name;
          if (updates.tenant_email !== undefined) clientUpdates.email = updates.tenant_email;
          if (updates.tenant_phone !== undefined) clientUpdates.phone = updates.tenant_phone;
          if (updates.tenant_address !== undefined) clientUpdates.address = updates.tenant_address;
          if (updates.tenant_id_type !== undefined) clientUpdates.id_type = updates.tenant_id_type;
          if (updates.tenant_id_number !== undefined) clientUpdates.id_number = updates.tenant_id_number;
          if (updates.tenant_id_issuer !== undefined) clientUpdates.id_issuer = updates.tenant_id_issuer;
          if (updates.tenant_pesel !== undefined) clientUpdates.pesel = updates.tenant_pesel;
          if (updates.tenant_nip !== undefined) clientUpdates.nip = updates.tenant_nip;
          if (updates.tenant_license_number !== undefined) clientUpdates.license_number = updates.tenant_license_number;
          if (updates.tenant_license_category !== undefined) clientUpdates.license_category = updates.tenant_license_category;
          if (updates.tenant_license_date !== undefined) clientUpdates.license_date = updates.tenant_license_date;
          if (updates.tenant_trailer_license_category !== undefined) clientUpdates.trailer_license_category = updates.tenant_trailer_license_category;
          if (updates.tenant_company_name !== undefined) clientUpdates.company_name = updates.tenant_company_name;
          
          if (Object.keys(clientUpdates).length > 0) {
            await supabase.from('clients').update(clientUpdates).eq('id', contract.client_id);
          }
        } catch (clientErr) {
          console.error('Failed to update client:', clientErr);
        }
      }
      
      setIsEditing(false);
      setEditedData({});
      setPreviousStatus(null);
      setShowStatusDialog(false);
      setPendingStatusChange(null);
      
      toast({
        title: "Sukces",
        description: "Status umowy został zmieniony",
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zmienić statusu umowy",
        variant: "destructive",
      });
      setShowStatusDialog(false);
      setPendingStatusChange(null);
    }
  };

  const updateField = (field: string, value: any) => {
    console.log('Updating field:', field, 'with value:', value);
    setEditedData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-update payment dates when start_date changes
      if (field === 'start_date' && value) {
        const startDateWarsaw = toZonedTime(new Date(value), WARSAW_TZ);
        const mainPaymentDate = addDays(startDateWarsaw, -14);
        
        const newPayments: any = {
          ...prev.payments,
          kaucja: {
            ...prev.payments?.kaucja,
            data: startDateWarsaw.toISOString().split('T')[0],
          },
        };
        
        // Only update zasadnicza if not full payment as reservation
        if (!prev.is_full_payment_as_reservation) {
          newPayments.zasadnicza = {
            ...prev.payments?.zasadnicza,
            data: mainPaymentDate.toISOString().split('T')[0],
          };
        }
        
        updated.payments = newPayments;
      }
      
      // Auto-update payment amounts when value changes
      if (field === 'value') {
        const numValue = parseFloat(value) || 0;
        const isFullPayment = prev.is_full_payment_as_reservation;
        
        if (isFullPayment) {
          // Full payment as reservation - no zasadnicza field
          updated.payments = {
            rezerwacyjna: {
              ...prev.payments?.rezerwacyjna,
              wysokosc: numValue > 0 ? numValue : null,
            },
            kaucja: {
              ...prev.payments?.kaucja,
            },
          };
        } else {
          // Standard split: 30% reservation, 70% main
          const reservationAmount = numValue * 0.30;
          const mainAmount = numValue * 0.70;
          
          updated.payments = {
            ...prev.payments,
            rezerwacyjna: {
              ...prev.payments?.rezerwacyjna,
              wysokosc: reservationAmount > 0 ? reservationAmount : null,
            },
            zasadnicza: {
              ...prev.payments?.zasadnicza,
              wysokosc: mainAmount > 0 ? mainAmount : null,
            },
            kaucja: {
              ...prev.payments?.kaucja,
            },
          };
        }
      }
      
      // Auto-update payment amounts when is_full_payment_as_reservation changes
      if (field === 'is_full_payment_as_reservation') {
        const numValue = parseFloat(prev.value) || 0;
        
        if (value) {
          // Full payment as reservation - remove zasadnicza field completely
          updated.payments = {
            rezerwacyjna: {
              ...prev.payments?.rezerwacyjna,
              wysokosc: numValue > 0 ? numValue : null,
            },
            kaucja: {
              ...prev.payments?.kaucja,
            },
          };
        } else {
          // Standard split: 30% reservation, 70% main
          const reservationAmount = numValue * 0.30;
          const mainAmount = numValue * 0.70;
          
          updated.payments = {
            ...prev.payments,
            rezerwacyjna: {
              ...prev.payments?.rezerwacyjna,
              wysokosc: reservationAmount > 0 ? reservationAmount : null,
            },
            zasadnicza: {
              ...prev.payments?.zasadnicza,
              wysokosc: mainAmount > 0 ? mainAmount : null,
            },
            kaucja: {
              ...prev.payments?.kaucja,
            },
          };
        }
      }
      
      console.log('Updated editedData:', updated);
      return updated;
    });
  };

  // Merge display data with parsed legacy values
  const displayData = useMemo(() => {
    const data = isEditing ? editedData : contract;
    if (!data) return null;
    
    // Parse legacy vehicle options if new columns are empty
    const legacyOptions = parseVehicleOptions(data.vehicle_additional_info);
    
    return {
      ...data,
      vehicle_cleaning: data.vehicle_cleaning || legacyOptions.cleaning,
      vehicle_animals: data.vehicle_animals || legacyOptions.animals,
      vehicle_extra_equipment: data.vehicle_extra_equipment || legacyOptions.extra_equipment,
    };
  }, [isEditing, editedData, contract]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Button variant="outline" onClick={() => navigate("/contracts")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do listy umów
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Nie znaleziono umowy</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="outline" onClick={() => navigate("/contracts")} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Powrót do listy umów
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl font-bold text-foreground">Umowa {displayData?.contract_number}</h1>
            {isEditing ? (
              <Select value={displayData?.status} onValueChange={(value) => updateField('status', value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Wybierz status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Oczekująca</SelectItem>
                  <SelectItem value="active">Aktywna</SelectItem>
                  <SelectItem value="completed">Zakończona</SelectItem>
                  <SelectItem value="cancelled">Anulowana</SelectItem>
                </SelectContent>
              </Select>
            ) : (
          <>
                <Badge variant="outline" className={statusConfig[displayData?.status as keyof typeof statusConfig]?.className}>
                  {statusConfig[displayData?.status as keyof typeof statusConfig]?.label}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={displayData?.invoice_type === 'invoice' 
                    ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                    : "bg-green-500/10 text-green-500 border-green-500/20"
                  }
                >
                  {displayData?.invoice_type === 'invoice' ? 'Faktura' : 'Paragon'}
                </Badge>
              </>
            )}
          </div>
          <p className="text-muted-foreground mt-2">Szczegóły umowy najmu</p>
        </div>
        <div className="flex gap-2">
          {!userRoles?.isAccounting && (
            <>
              {!isEditing ? (
                <Button onClick={handleEdit} className="gap-2">
                  <Edit2 className="h-4 w-4" />
                  Edytuj umowę
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCancel} className="gap-2">
                    <X className="h-4 w-4" />
                    Anuluj
                  </Button>
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Zapisz zmiany
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Panels - Hidden for accounting role */}
      {!userRoles?.isAccounting && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          <ContractActionsPanel 
            contractId={contract.id}
            contractNumber={contract.contract_number}
            clientEmail={contract.tenant_email}
          />
          <AccountingPanel 
            contractId={contract.id}
            contractNumber={contract.contract_number}
            payments={contract.payments}
            tenantName={contract.tenant_name}
            depositReceived={contract.deposit_received}
            tenantNip={contract.tenant_nip}
          />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {userRoles?.isAccounting ? (
          // Accounting role sees Umowa (read-only) and Faktury tabs
          <TabsList className="grid w-full mb-8 grid-cols-2">
            <TabsTrigger value="contract" className="gap-2">
              <FileText className="h-4 w-4" />
              Umowa
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <CreditCard className="h-4 w-4" />
              {displayData?.invoice_type === 'invoice' ? 'Faktury' : 'Paragony'}
            </TabsTrigger>
          </TabsList>
        ) : (
          // Other roles see all tabs
          <TabsList className={`grid w-full mb-8 ${contract.inquiry_id ? 'grid-cols-7' : 'grid-cols-6'}`}>
            <TabsTrigger value="contract" className="gap-2">
              <FileText className="h-4 w-4" />
              Umowa
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Dokumenty
            </TabsTrigger>
            <TabsTrigger value="drivers" className="gap-2">
              <Users className="h-4 w-4" />
              Kierowcy
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <CreditCard className="h-4 w-4" />
              {displayData?.invoice_type === 'invoice' ? 'Faktury' : 'Paragony'}
            </TabsTrigger>
            <TabsTrigger value="handover" className="gap-2">
              <Truck className="h-4 w-4" />
              Wydanie
            </TabsTrigger>
            <TabsTrigger value="return" className="gap-2">
              <Package className="h-4 w-4" />
              Zdanie
            </TabsTrigger>
            {contract.inquiry_id && (
              <TabsTrigger value="conversation" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Konwersacja
              </TabsTrigger>
            )}
          </TabsList>
        )}

        <TabsContent value="contract" className="space-y-8">

      {/* Wynajmujący - hidden but data still passed to API */}
      <Card className="shadow-md hidden">
        <CardHeader className="pb-3">
          <CardTitle>Wynajmujący</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nazwa</Label>
              {isEditing ? (
                <Input value={displayData?.lessor_name || ''} onChange={(e) => updateField('lessor_name', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.lessor_name || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Adres</Label>
              {isEditing ? (
                <Input value={displayData?.lessor_address || ''} onChange={(e) => updateField('lessor_address', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.lessor_address || 'Nie podano'}</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Telefon</Label>
              {isEditing ? (
                <Input value={displayData?.lessor_phone || ''} onChange={(e) => updateField('lessor_phone', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.lessor_phone || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">WWW</Label>
              {isEditing ? (
                <Input value={displayData?.lessor_website || ''} onChange={(e) => updateField('lessor_website', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.lessor_website || 'Nie podano'}</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
            {isEditing ? (
              <Input type="email" value={displayData?.lessor_email || ''} onChange={(e) => updateField('lessor_email', e.target.value)} />
            ) : (
              <p className="text-base font-semibold text-foreground pt-1">{displayData?.lessor_email || 'Nie podano'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informacje podstawowe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Typ dokumentu rozliczeniowego</Label>
            {isEditing ? (
              <Select 
                value={displayData?.invoice_type || 'receipt'} 
                onValueChange={(value) => updateField('invoice_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz typ dokumentu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receipt">Paragon</SelectItem>
                  <SelectItem value="invoice">Faktura</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge 
                variant="outline" 
                className={displayData?.invoice_type === 'invoice' 
                  ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                  : "bg-green-500/10 text-green-500 border-green-500/20"
                }
              >
                {displayData?.invoice_type === 'invoice' ? 'Faktura' : 'Paragon'}
              </Badge>
            )}
          </div>

          {(displayData?.tenant_company_name || displayData?.tenant_nip || isEditing) && (
            <>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Nazwa firmy {displayData?.invoice_type === 'invoice' && '(wymagane dla faktury)'}
                  </Label>
                  {isEditing ? (
                    <Input value={displayData?.tenant_company_name || ''} onChange={(e) => updateField('tenant_company_name', e.target.value)} placeholder="Jeśli firma wynajmuje" />
                  ) : (
                    <p className="text-base font-semibold text-foreground pt-1">{displayData?.tenant_company_name || 'Nie podano'}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    NIP {displayData?.invoice_type === 'invoice' && '(wymagane dla faktury)'}
                  </Label>
                  {isEditing ? (
                    <Input value={displayData?.tenant_nip || ''} onChange={(e) => updateField('tenant_nip', e.target.value)} placeholder="NIP firmy" />
                  ) : (
                    <p className="text-base font-semibold text-foreground pt-1">{displayData?.tenant_nip || 'Nie podano'}</p>
                  )}
                </div>
              </div>
              
              <Separator />
            </>
          )}
          
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Numer umowy (stary system)</Label>
            {isEditing ? (
              <Input value={displayData?.umowa_text || ''} onChange={(e) => updateField('umowa_text', e.target.value)} placeholder="np. 60/2024" />
            ) : (
              <p className="text-base font-semibold text-foreground pt-1">{displayData?.umowa_text || 'Nie podano'}</p>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Informacje o kliencie */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Klient
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Imię i nazwisko</Label>
              <p className="text-base font-semibold text-foreground pt-1">{contract.client?.name || 'N/A'}</p>
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
              <p className="text-base font-semibold text-foreground pt-1">{contract.client?.email || 'N/A'}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Telefon</Label>
            <p className="text-base font-semibold text-foreground pt-1">{contract.client?.phone || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Okres najmu */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Okres najmu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Data rozpoczęcia</Label>
              {isEditing ? (
                <DateTimePicker
                  date={displayData?.start_date ? new Date(displayData.start_date) : undefined}
                  setDate={(date) => updateField('start_date', date?.toISOString())}
                  placeholder="Wybierz datę i godzinę rozpoczęcia"
                />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">
                  {displayData?.start_date ? format(toZonedTime(new Date(displayData.start_date), WARSAW_TZ), "dd.MM.yyyy, HH:mm", { locale: pl }) : 'Nie podano'}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Data zakończenia</Label>
              {isEditing ? (
                <DateTimePicker
                  date={displayData?.end_date ? new Date(displayData.end_date) : undefined}
                  setDate={(date) => updateField('end_date', date?.toISOString())}
                  placeholder="Wybierz datę i godzinę zakończenia"
                />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">
                  {displayData?.end_date ? format(toZonedTime(new Date(displayData.end_date), WARSAW_TZ), "dd.MM.yyyy, HH:mm", { locale: pl }) : 'Nie podano'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Najemca (Główny kierowca) */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Najemca (Główny kierowca)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Imię i nazwisko</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_name || ''} onChange={(e) => updateField('tenant_name', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.tenant_name || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
              {isEditing ? (
                <Input type="email" value={displayData?.tenant_email || ''} onChange={(e) => updateField('tenant_email', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.tenant_email || 'Nie podano'}</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Telefon</Label>
            {isEditing ? (
              <Input value={displayData?.tenant_phone || ''} onChange={(e) => updateField('tenant_phone', e.target.value)} />
            ) : (
              <p className="text-base font-semibold text-foreground pt-1">{displayData?.tenant_phone || 'Nie podano'}</p>
            )}
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Adres zamieszkania</Label>
            {isEditing ? (
              <Input value={displayData?.tenant_address || ''} onChange={(e) => updateField('tenant_address', e.target.value)} />
            ) : (
              <p className="text-base font-semibold text-foreground pt-1">{displayData?.tenant_address || 'Nie podano'}</p>
            )}
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Rodzaj dokumentu tożsamości</Label>
              {isEditing ? (
                <Select value={displayData?.tenant_id_type || ''} onValueChange={(value) => updateField('tenant_id_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz dokument" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dowod">Dowód osobisty</SelectItem>
                    <SelectItem value="paszport">Paszport</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.tenant_id_type || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Numer dokumentu</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_id_number || ''} onChange={(e) => updateField('tenant_id_number', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.tenant_id_number || 'Nie podano'}</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Organ wydający</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_id_issuer || ''} onChange={(e) => updateField('tenant_id_issuer', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.tenant_id_issuer || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">PESEL</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_pesel || ''} onChange={(e) => updateField('tenant_pesel', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.tenant_pesel || 'Nie podano'}</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">NIP</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_nip || ''} onChange={(e) => updateField('tenant_nip', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.tenant_nip || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Numer prawa jazdy</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_license_number || ''} onChange={(e) => updateField('tenant_license_number', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.tenant_license_number || 'Nie podano'}</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Data wydania prawa jazdy</Label>
              {isEditing ? (
                <Input type="date" value={displayData?.tenant_license_date || ''} onChange={(e) => updateField('tenant_license_date', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.tenant_license_date || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Kategoria prawa jazdy</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_license_category || ''} onChange={(e) => updateField('tenant_license_category', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.tenant_license_category || 'Nie podano'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dodatkowi kierowcy */}
      {displayData?.additional_drivers && displayData.additional_drivers.length > 1 && (
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Dodatkowi kierowcy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {displayData.additional_drivers.slice(1).map((driver: any, idx: number) => (
              <div key={idx}>
                {idx > 0 && <Separator className="my-6" />}
                <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Dodatkowy kierowca {idx + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Imię i nazwisko</Label>
                    <p className="text-base font-semibold text-foreground pt-1">{driver.imie_nazwisko || 'Nie podano'}</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                    <p className="text-base font-semibold text-foreground pt-1">{driver.email || 'Nie podano'}</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Telefon</Label>
                    <p className="text-base font-semibold text-foreground pt-1">{driver.tel || 'Nie podano'}</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Numer prawa jazdy</Label>
                    <p className="text-base font-semibold text-foreground pt-1">{driver.prawo_jazdy_numer || 'Nie podano'}</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Data wydania prawa jazdy</Label>
                    <p className="text-base font-semibold text-foreground pt-1">{driver.prawo_jazdy_data || 'Nie podano'}</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Rodzaj dokumentu</Label>
                    <p className="text-base font-semibold text-foreground pt-1">{driver.dokument_rodzaj || 'Nie podano'}</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Numer dokumentu</Label>
                    <p className="text-base font-semibold text-foreground pt-1">{driver.dokument_numer || 'Nie podano'}</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Organ wydający</Label>
                    <p className="text-base font-semibold text-foreground pt-1">{driver.dokument_organ || 'Nie podano'}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Przedmiot najmu */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Przedmiot najmu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <Label>Wybierz pojazd z bazy</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtruj po typie, modelu lub numerze rejestracyjnym..."
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
              <Select onValueChange={handleVehicleSelect}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Wybierz pojazd aby automatycznie wypełnić dane" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {filteredVehicles.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nie znaleziono pojazdów
                    </div>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{vehicle.type}</span>
                          <span>{vehicle.model}</span>
                          <span className="text-xs">-</span>
                          <span className="font-mono">{vehicle.registration_number}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Model</Label>
              {isEditing ? (
                <Input value={displayData?.vehicle_model || ''} onChange={(e) => updateField('vehicle_model', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.vehicle_model || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nr rejestracyjny</Label>
              {isEditing ? (
                <Input value={displayData?.registration_number || ''} onChange={(e) => updateField('registration_number', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.registration_number || 'Nie podano'}</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">VIN</Label>
              {isEditing ? (
                <Input value={displayData?.vehicle_vin || ''} onChange={(e) => updateField('vehicle_vin', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.vehicle_vin || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Następne badanie</Label>
              {isEditing ? (
                <Input type="date" value={displayData?.vehicle_next_inspection || ''} onChange={(e) => updateField('vehicle_next_inspection', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.vehicle_next_inspection || 'Nie podano'}</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Numer polisy</Label>
              {isEditing ? (
                <Input value={displayData?.vehicle_insurance_number || ''} onChange={(e) => updateField('vehicle_insurance_number', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.vehicle_insurance_number || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Polisa ważna do</Label>
              {isEditing ? (
                <Input type="date" value={displayData?.vehicle_insurance_valid_until || ''} onChange={(e) => updateField('vehicle_insurance_valid_until', e.target.value)} />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.vehicle_insurance_valid_until || 'Nie podano'}</p>
              )}
            </div>
          </div>
          
          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Liczba podróżujących</Label>
              {isEditing ? (
                <Input 
                  type="number" 
                  min="1"
                  value={displayData?.number_of_travelers || ''} 
                  onChange={(e) => updateField('number_of_travelers', e.target.value ? Number(e.target.value) : null)} 
                />
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">
                  {displayData?.number_of_travelers ? `${displayData.number_of_travelers} ${displayData.number_of_travelers === 1 ? 'osoba' : 'osoby'}` : 'Nie podano'}
                </p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Sprzątanie dodatkowo</Label>
              {isEditing ? (
                <Select 
                  value={displayData?.vehicle_cleaning || ''} 
                  onValueChange={(value) => updateField('vehicle_cleaning', value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Wybierz opcję" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="Tak">Tak</SelectItem>
                    <SelectItem value="Nie">Nie</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">
                  {displayData?.vehicle_cleaning ? (
                    <Badge variant={displayData.vehicle_cleaning === 'Tak' ? 'default' : 'outline'}>
                      {displayData.vehicle_cleaning}
                    </Badge>
                  ) : 'Nie podano'}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Zwierzę</Label>
              {isEditing ? (
                <Select 
                  value={displayData?.vehicle_animals || ''} 
                  onValueChange={(value) => updateField('vehicle_animals', value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Wybierz opcję" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="Tak">Tak</SelectItem>
                    <SelectItem value="Nie">Nie</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">
                  {displayData?.vehicle_animals ? (
                    <Badge variant={displayData.vehicle_animals === 'Tak' ? 'default' : 'outline'}>
                      {displayData.vehicle_animals}
                    </Badge>
                  ) : 'Nie podano'}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Wyposażenie dodatkowo</Label>
              {isEditing ? (
                <Select 
                  value={displayData?.vehicle_extra_equipment || ''} 
                  onValueChange={(value) => updateField('vehicle_extra_equipment', value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Wybierz opcję" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="Tak">Tak</SelectItem>
                    <SelectItem value="Nie">Nie</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-base font-semibold text-foreground pt-1">
                  {displayData?.vehicle_extra_equipment ? (
                    <Badge variant={displayData.vehicle_extra_equipment === 'Tak' ? 'default' : 'outline'}>
                      {displayData.vehicle_extra_equipment}
                    </Badge>
                  ) : 'Nie podano'}
                </p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Dodatkowe informacje</Label>
            {isEditing ? (
              <Textarea value={displayData?.vehicle_additional_info || ''} onChange={(e) => updateField('vehicle_additional_info', e.target.value)} />
            ) : (
              <p className="text-base font-semibold text-foreground pt-1">{displayData?.vehicle_additional_info || 'Nie podano'}</p>
            )}
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Wartość umowy</Label>
            {isEditing ? (
              <div className="space-y-4">
                <Input type="number" step="0.01" value={displayData?.value ?? ''} onChange={(e) => updateField('value', e.target.value)} className="max-w-xs" />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_full_payment"
                    checked={displayData?.is_full_payment_as_reservation || false}
                    onChange={(e) => updateField('is_full_payment_as_reservation', e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="is_full_payment" className="text-sm font-normal cursor-pointer">
                    Pełna płatność jako rezerwacja
                  </Label>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-base font-semibold text-foreground pt-1">{displayData?.value ? `${displayData.value} PLN` : 'Nie podano'}</p>
                {displayData?.is_full_payment_as_reservation && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    Pełna płatność jako rezerwacja
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dodatkowe pojazdy (jeśli umowa na wiele pojazdów) */}
      {displayData?.additional_vehicles && Array.isArray(displayData.additional_vehicles) && displayData.additional_vehicles.length > 0 && (
        <Card className="shadow-md border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Dodatkowe pojazdy ({displayData.additional_vehicles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {displayData.additional_vehicles.map((vehicle: any, index: number) => (
              <div key={index} className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">
                    Pojazd #{index + 2}: {vehicle.model}
                  </h4>
                  <Badge variant="outline">{vehicle.registration_number}</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">VIN:</span>
                    <span className="ml-2 font-medium">{vehicle.vin || 'Nie podano'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Typ:</span>
                    <span className="ml-2 font-medium">{vehicle.type || 'Nie podano'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Badanie:</span>
                    <span className="ml-2 font-medium">{vehicle.next_inspection_date || 'Nie podano'}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sprzątanie:</span>
                    <span className="ml-2">
                      {vehicle.cleaning ? (
                        <Badge variant={vehicle.cleaning === 'Tak' ? 'default' : 'outline'} className="text-xs">
                          {vehicle.cleaning}
                        </Badge>
                      ) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Zwierzęta:</span>
                    <span className="ml-2">
                      {vehicle.animals ? (
                        <Badge variant={vehicle.animals === 'Tak' ? 'default' : 'outline'} className="text-xs">
                          {vehicle.animals}
                        </Badge>
                      ) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dodatkowy sprzęt:</span>
                    <span className="ml-2 font-medium">{vehicle.extra_equipment || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Płatności */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Płatności
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
              Opłata rezerwacyjna
              {displayData?.is_full_payment_as_reservation && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">(Pełna płatność)</span>
              )}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Data</Label>
                {isEditing ? (
                  <Input type="date" value={displayData?.payments?.rezerwacyjna?.data || displayData?.payments?.rezerwacyjna?.termin || ''} onChange={(e) => {
                    const newPayments = { ...displayData.payments, rezerwacyjna: { ...displayData.payments?.rezerwacyjna, data: e.target.value, termin: e.target.value } };
                    updateField('payments', newPayments);
                  }} />
                ) : (
                  <p className="text-base font-semibold text-foreground pt-1">{displayData?.payments?.rezerwacyjna?.data || displayData?.payments?.rezerwacyjna?.termin || 'Nie podano'}</p>
                )}
              </div>
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Wysokość</Label>
                {isEditing ? (
                  <Input type="number" step="0.01" value={displayData?.payments?.rezerwacyjna?.wysokosc ?? ''} onChange={(e) => {
                    const newPayments = { ...displayData.payments, rezerwacyjna: { ...displayData.payments?.rezerwacyjna, wysokosc: e.target.value } };
                    updateField('payments', newPayments);
                  }} />
                ) : (
                  <p className="text-base font-semibold text-foreground pt-1">
                    {displayData?.payments?.rezerwacyjna?.wysokosc ? `${displayData.payments.rezerwacyjna.wysokosc} PLN` : 'Nie podano'}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {!displayData?.is_full_payment_as_reservation && (
            <>
              <Separator />
              
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Opłata zasadnicza</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Data</Label>
                    {isEditing ? (
                      <Input type="date" value={displayData?.payments?.zasadnicza?.data || displayData?.payments?.zasadnicza?.termin || ''} onChange={(e) => {
                        const newPayments = { ...displayData.payments, zasadnicza: { ...displayData.payments?.zasadnicza, data: e.target.value, termin: e.target.value } };
                        updateField('payments', newPayments);
                      }} />
                    ) : (
                      <p className="text-base font-semibold text-foreground pt-1">{displayData?.payments?.zasadnicza?.data || displayData?.payments?.zasadnicza?.termin || 'Nie podano'}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Wysokość</Label>
                    {isEditing ? (
                      <Input type="number" step="0.01" value={displayData?.payments?.zasadnicza?.wysokosc ?? ''} onChange={(e) => {
                        const newPayments = { ...displayData.payments, zasadnicza: { ...displayData.payments?.zasadnicza, wysokosc: e.target.value } };
                        updateField('payments', newPayments);
                      }} />
                    ) : (
                      <p className="text-base font-semibold text-foreground pt-1">
                        {displayData?.payments?.zasadnicza?.wysokosc ? `${displayData.payments.zasadnicza.wysokosc} PLN` : 'Nie podano'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <Separator />
            </>
          )}
          
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Kaucja</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Data</Label>
                {isEditing ? (
                  <Input type="date" value={displayData?.payments?.kaucja?.data || ''} onChange={(e) => {
                    const newPayments = { ...displayData.payments, kaucja: { ...displayData.payments?.kaucja, data: e.target.value } };
                    updateField('payments', newPayments);
                  }} />
                ) : (
                  <p className="text-base font-semibold text-foreground pt-1">{displayData?.payments?.kaucja?.data || 'Nie podano'}</p>
                )}
              </div>
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Wysokość</Label>
                {isEditing ? (
                  <Input type="number" step="0.01" value={displayData?.payments?.kaucja?.wysokosc ?? ''} onChange={(e) => {
                    const newPayments = { ...displayData.payments, kaucja: { ...displayData.payments?.kaucja, wysokosc: e.target.value } };
                    updateField('payments', newPayments);
                  }} />
                ) : (
                  <p className="text-base font-semibold text-foreground pt-1">
                    {displayData?.payments?.kaucja?.wysokosc ? `${displayData.payments.kaucja.wysokosc} PLN` : 'Nie podano'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uwagi */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle>Uwagi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Notatki</Label>
          {isEditing ? (
            <Textarea value={displayData?.notes || ''} onChange={(e) => updateField('notes', e.target.value)} rows={4} className="resize-none" />
          ) : (
            <p className="text-base font-semibold text-foreground whitespace-pre-wrap pt-1">{displayData?.notes || 'Brak uwag'}</p>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab contractId={id!} />
        </TabsContent>

        <TabsContent value="drivers">
          <DriversTab additionalDrivers={(contract?.additional_drivers as any[] | null) || []} />
        </TabsContent>

        <TabsContent value="handover">
          <HandoverTab
            contractId={id!}
            contractNumber={contract.contract_number}
            tenantName={contract.tenant_name || contract.client?.name || 'Brak danych'}
            startDate={contract.start_date}
            endDate={contract.end_date}
            vehicleModel={contract.vehicle_model}
            handovers={handovers}
          />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesReceiptsTab
            contractId={id!}
            invoiceType={contract.invoice_type as 'receipt' | 'invoice'}
            contractNumber={contract.contract_number}
            tenantName={contract.tenant_name || contract.client?.name || 'Brak danych'}
            startDate={contract.start_date}
            endDate={contract.end_date}
            payments={contract.payments}
            tenantNip={contract.tenant_nip}
          />
        </TabsContent>

        <TabsContent value="return">
          <ReturnTab
            contractId={id!}
            contractNumber={contract.contract_number}
            tenantName={contract.tenant_name || contract.client?.name || 'Brak danych'}
            startDate={contract.start_date}
            endDate={contract.end_date}
            vehicleModel={contract.vehicle_model}
            returns={returns}
            scheduledReturn={scheduledReturn}
          />
        </TabsContent>

        {contract.inquiry_id && (
          <TabsContent value="conversation">
            <ConversationTab inquiryId={contract.inquiry_id} />
          </TabsContent>
        )}
      </Tabs>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {pendingStatusChange === 'active' && 'Aktywacja umowy'}
              {pendingStatusChange === 'cancelled' && 'Anulowanie umowy'}
              {pendingStatusChange === 'completed' && 'Zakończenie umowy'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusChange === 'active' && 
                'Umowa zostanie aktywowana. Rozpoczną się automatyczne powiadomienia (wydanie, zwrot, kaucja).'}
              {pendingStatusChange === 'cancelled' && 
                'Umowa zostanie anulowana. Powiadomienia zostaną wyłączone, a folder w Google Drive otrzyma oznaczenie [ANULOWANA].'}
              {pendingStatusChange === 'completed' && 
                'Umowa zostanie oznaczona jako zakończona. Wszystkie automatyczne powiadomienia zostaną wyłączone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowStatusDialog(false);
              setPendingStatusChange(null);
            }}>
              Anuluj
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Potwierdź zmianę statusu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContractDetails;
