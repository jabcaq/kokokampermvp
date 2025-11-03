import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVehicles } from "@/hooks/useVehicles";
import { useContracts } from "@/hooks/useContracts";
import { useReturnBookings } from "@/hooks/useReturnBookings";
import { useVehicleReturns } from "@/hooks/useVehicleReturns";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2, Unplug, Plug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const TestNotifications = () => {
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { data: contracts, isLoading: contractsLoading } = useContracts();
  const { data: returnBookings, isLoading: returnBookingsLoading } = useReturnBookings();
  const { data: vehicleReturns, isLoading: vehicleReturnsLoading } = useVehicleReturns();
  
  // Insurance notification state
  const [selectedVehicleInsurance, setSelectedVehicleInsurance] = useState<string>("");
  const [connectionStatusInsurance, setConnectionStatusInsurance] = useState<"disconnected" | "connected">("disconnected");
  const [isSendingInsurance, setIsSendingInsurance] = useState(false);
  
  // Inspection notification state
  const [selectedVehicleInspection, setSelectedVehicleInspection] = useState<string>("");
  const [connectionStatusInspection, setConnectionStatusInspection] = useState<"disconnected" | "connected">("disconnected");
  const [isSendingInspection, setIsSendingInspection] = useState(false);
  
  // Rental notification state (3 days)
  const [selectedDateRental, setSelectedDateRental] = useState<string>("");
  const [connectionStatusRental, setConnectionStatusRental] = useState<"disconnected" | "connected">("disconnected");
  const [isSendingRental, setIsSendingRental] = useState(false);
  
  // Rental notification state (2 days)
  const [selectedDateRental2Days, setSelectedDateRental2Days] = useState<string>("");
  const [connectionStatusRental2Days, setConnectionStatusRental2Days] = useState<"disconnected" | "connected">("disconnected");
  const [isSendingRental2Days, setIsSendingRental2Days] = useState(false);
  
  // Return notification state (2 days)
  const [selectedReturnDate, setSelectedReturnDate] = useState<string>("");
  const [connectionStatusReturn, setConnectionStatusReturn] = useState<"disconnected" | "connected">("disconnected");
  const [isSendingReturn, setIsSendingReturn] = useState(false);
  const [selectedReturnDayDate, setSelectedReturnDayDate] = useState("");
  const [isSendingReturnDay, setIsSendingReturnDay] = useState(false);
  
  // Handover day notification state
  const [selectedHandoverDayDate, setSelectedHandoverDayDate] = useState("");
  const [isSendingHandoverDay, setIsSendingHandoverDay] = useState(false);
  
  // Return 3 days prior notification state
  const [selectedReturn3DaysDate, setSelectedReturn3DaysDate] = useState("");
  const [isSendingReturn3Days, setIsSendingReturn3Days] = useState(false);
  
  // Review request notification state
  const [selectedReturnForReview, setSelectedReturnForReview] = useState("");
  const [isSendingReviewRequest, setIsSendingReviewRequest] = useState(false);
  
  // Deposit received notification state
  const [selectedContractForDeposit, setSelectedContractForDeposit] = useState("");
  const [isSendingDepositNotification, setIsSendingDepositNotification] = useState(false);
  
  // Receipt uploaded notification state
  const [selectedContractForReceipt, setSelectedContractForReceipt] = useState("");
  const [isSendingReceiptNotification, setIsSendingReceiptNotification] = useState(false);
  
  // Deposit check 3 days before start notification state
  const [selectedContractDeposit3Days, setSelectedContractDeposit3Days] = useState("");
  const [isSendingDepositCheck3Days, setIsSendingDepositCheck3Days] = useState(false);
  
  // Deposit check 5 days before start notification state
  const [selectedContractDeposit5Days, setSelectedContractDeposit5Days] = useState("");
  const [isSendingDepositCheck5Days, setIsSendingDepositCheck5Days] = useState(false);

  // Invoice/Receipt file notification state
  const [selectedContractForInvoiceFile, setSelectedContractForInvoiceFile] = useState("");
  const [selectedInvoiceFileType, setSelectedInvoiceFileType] = useState("reservation");
  const [isSendingInvoiceFileNotification, setIsSendingInvoiceFileNotification] = useState(false);

  // Deposit paid on rental day notification state
  const [selectedDepositRentalDayContract, setSelectedDepositRentalDayContract] = useState<string>('');
  const [isSendingDepositRentalDay, setIsSendingDepositRentalDay] = useState(false);

  // Folder rename notification state (for cancelled contracts)
  const [selectedContractForFolderRename, setSelectedContractForFolderRename] = useState<string>('');
  const [isSendingFolderRename, setIsSendingFolderRename] = useState(false);
  
  const { toast } = useToast();

  // Group contracts by start date
  const contractsByDate = useMemo(() => {
    if (!contracts) return {};
    
    return contracts.reduce((acc: Record<string, any[]>, contract: any) => {
      const startDate = contract.start_date ? new Date(contract.start_date).toISOString().split('T')[0] : '';
      if (startDate) {
        if (!acc[startDate]) {
          acc[startDate] = [];
        }
        acc[startDate].push(contract);
      }
      return acc;
    }, {});
  }, [contracts]);

  // Group return bookings by scheduled date
  const returnsByDate = useMemo(() => {
    if (!returnBookings) return {};
    
    console.log('returnBookings:', returnBookings);
    
    return returnBookings.reduce((acc: Record<string, any[]>, returnBooking: any) => {
      const returnDate = returnBooking.scheduled_return_date ? 
        new Date(returnBooking.scheduled_return_date).toISOString().split('T')[0] : '';
      
      console.log('Processing return:', returnBooking.id, 'date:', returnDate);
      
      if (returnDate) {
        if (!acc[returnDate]) {
          acc[returnDate] = [];
        }
        acc[returnDate].push(returnBooking);
      }
      return acc;
    }, {});
  }, [returnBookings]);

  // Group contracts by end (expected return) date
  const returnContractsByDate = useMemo(() => {
    if (!contracts) return {};

    return contracts.reduce((acc: Record<string, any[]>, contract: any) => {
      const endDate = contract.end_date ? new Date(contract.end_date).toISOString().split('T')[0] : '';
      if (endDate) {
        if (!acc[endDate]) {
          acc[endDate] = [];
        }
        acc[endDate].push(contract);
      }
      return acc;
    }, {});
  }, [contracts]);

  const handleSendInsuranceNotification = async () => {
    if (connectionStatusInsurance === "disconnected") {
      toast({
        title: "Błąd",
        description: "Najpierw połącz webhook (zmień status na 'Połączone')",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVehicleInsurance) {
      toast({
        title: "Błąd",
        description: "Wybierz pojazd",
        variant: "destructive",
      });
      return;
    }

    const vehicle = vehicles?.find(v => v.id === selectedVehicleInsurance);
    if (!vehicle) return;

    setIsSendingInsurance(true);
    try {
      const response = await fetch("https://hook.eu2.make.com/11vxcpks3jhhnqkjxbrx4mc6murktf45", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          vehicle_model: vehicle.model,
          registration_number: vehicle.registration_number,
          insurance_valid_until: vehicle.insurance_valid_until,
          notification_type: "insurance_expiring_30_days",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie o ubezpieczeniu wysłane dla pojazdu: ${vehicle.registration_number} (${vehicle.model})`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia",
        variant: "destructive",
      });
    } finally {
      setIsSendingInsurance(false);
    }
  };

  const handleSendInspectionNotification = async () => {
    if (connectionStatusInspection === "disconnected") {
      toast({
        title: "Błąd",
        description: "Najpierw połącz webhook (zmień status na 'Połączone')",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVehicleInspection) {
      toast({
        title: "Błąd",
        description: "Wybierz pojazd",
        variant: "destructive",
      });
      return;
    }

    const vehicle = vehicles?.find(v => v.id === selectedVehicleInspection);
    if (!vehicle) return;

    setIsSendingInspection(true);
    try {
      const response = await fetch("https://hook.eu2.make.com/ucs1ch4canx8daqlqrh903tqtb8q7bi5", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          vehicle_model: vehicle.model,
          registration_number: vehicle.registration_number,
          next_inspection_date: vehicle.next_inspection_date,
          notification_type: "inspection_expiring_30_days",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie o przeglądzie wysłane dla pojazdu: ${vehicle.registration_number} (${vehicle.model})`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia",
        variant: "destructive",
      });
    } finally {
      setIsSendingInspection(false);
    }
  };

  const handleSendRentalNotification = async () => {
    if (connectionStatusRental === "disconnected") {
      toast({
        title: "Błąd",
        description: "Najpierw połącz webhook (zmień status na 'Połączone')",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDateRental) {
      toast({
        title: "Błąd",
        description: "Wybierz datę",
        variant: "destructive",
      });
      return;
    }

    const contractsForDate = contractsByDate[selectedDateRental];
    if (!contractsForDate || contractsForDate.length === 0) return;

    setIsSendingRental(true);
    try {
      const response = await supabase.functions.invoke('send-rental-notification', {
        body: {
          notification_type: "rental_starting_3_days",
          rental_date: selectedDateRental,
          contracts_count: contractsForDate.length,
          contracts: contractsForDate,
          timestamp: new Date().toISOString(),
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send notification');
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie wysłane dla ${contractsForDate.length} umów z dnia ${new Date(selectedDateRental).toLocaleDateString("pl-PL")}`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia",
        variant: "destructive",
      });
    } finally {
      setIsSendingRental(false);
    }
  };

  const handleSendRental2DaysNotification = async () => {
    if (connectionStatusRental2Days === "disconnected") {
      toast({
        title: "Błąd",
        description: "Najpierw połącz webhook (zmień status na 'Połączone')",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDateRental2Days) {
      toast({
        title: "Błąd",
        description: "Wybierz datę",
        variant: "destructive",
      });
      return;
    }

    const contractsForDate = contractsByDate[selectedDateRental2Days];
    if (!contractsForDate || contractsForDate.length === 0) return;

    setIsSendingRental2Days(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('send-rental-notification', {
        body: {
          notification_type: "rental_starting_2_days",
          rental_date: selectedDateRental2Days,
          contracts_count: contractsForDate.length,
          contracts: contractsForDate,
          timestamp: new Date().toISOString(),
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send notification');
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie wysłane dla ${contractsForDate.length} umów z dnia ${new Date(selectedDateRental2Days).toLocaleDateString("pl-PL")}`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia",
        variant: "destructive",
      });
    } finally {
      setIsSendingRental2Days(false);
    }
  };

  const handleSendReturnNotification = async () => {
    if (connectionStatusReturn === "disconnected") {
      toast({
        title: "Błąd",
        description: "Najpierw połącz webhook (zmień status na 'Połączone')",
        variant: "destructive",
      });
      return;
    }

    if (!selectedReturnDate) {
      toast({
        title: "Błąd",
        description: "Wybierz datę",
        variant: "destructive",
      });
      return;
    }

    const contractsForDate = returnContractsByDate[selectedReturnDate];
    if (!contractsForDate || contractsForDate.length === 0) {
      toast({
        title: "Brak umów",
        description: "Brak umów z zakończeniem wynajmu w wybranym dniu.",
      });
      return;
    }

    setIsSendingReturn(true);
    try {
      for (const contract of contractsForDate) {
        const response = await fetch("https://hook.eu2.make.com/hk044wt625t33gs2qyvusatijdcrsa30", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contract_id: contract.id,
            contract_number: contract.contract_number,
            tenant_name: contract.tenant_name,
            tenant_email: contract.tenant_email,
            vehicle_model: contract.vehicle_model,
            registration_number: contract.registration_number,
            scheduled_return_date: contract.end_date,
            scheduled_return_time: null,
            employee_name: null,
            notification_type: "return_2days_prior",
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Webhook error: ${response.status}`);
        }
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie wysłane dla ${contractsForDate.length} ${contractsForDate.length === 1 ? 'umowy' : contractsForDate.length < 5 ? 'umów' : 'umów'} z datą zwrotu ${new Date(selectedReturnDate).toLocaleDateString("pl-PL")}`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia",
        variant: "destructive",
      });
    } finally {
      setIsSendingReturn(false);
    }
  };

  const handleSendReturnDayNotification = async () => {
    if (!selectedReturnDayDate) {
      toast({
        title: "Błąd",
        description: "Wybierz datę zwrotu.",
      });
      return;
    }

    const contractsForDate = returnContractsByDate[selectedReturnDayDate];
    if (!contractsForDate || contractsForDate.length === 0) {
      toast({
        title: "Brak umów",
        description: "Brak umów z zakończeniem wynajmu w wybranym dniu.",
      });
      return;
    }

    setIsSendingReturnDay(true);
    try {
      // Prepare bundles
      const bundles = contractsForDate.map((contract) => ({
        contract_id: contract.id,
        contract_number: contract.contract_number,
        tenant_name: contract.tenant_name,
        tenant_email: contract.tenant_email,
        tenant_phone: contract.tenant_phone,
        vehicle_model: contract.vehicle_model,
        registration_number: contract.registration_number,
        scheduled_return_date: contract.end_date,
        notification_type: "return_day",
      }));

      // Send single request with all bundles
      const response = await fetch("https://hook.eu2.make.com/rhqdyg51l54f3put8ssxxhy5s7u02ba9", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedReturnDayDate,
          bundles: bundles,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie wysłane dla ${contractsForDate.length} ${contractsForDate.length === 1 ? 'umowy' : contractsForDate.length < 5 ? 'umów' : 'umów'} z datą zwrotu ${new Date(selectedReturnDayDate).toLocaleDateString("pl-PL")}`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReturnDay(false);
    }
  };

  const handleSendHandoverDayNotification = async () => {
    setIsSendingHandoverDay(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-handover-day');
      
      if (error) throw error;
      
      toast({
        title: "Powiadomienie wysłane",
        description: `Wysłano powiadomienia dla ${data.count} kontraktów`,
      });
      
      console.log('Handover notification result:', data);
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
      console.error('Error:', error);
    } finally {
      setIsSendingHandoverDay(false);
    }
  };

  const handleSendHandoverDayNotificationOld = async () => {
    if (!selectedHandoverDayDate) {
      toast({
        title: "Błąd",
        description: "Wybierz datę wydania.",
      });
      return;
    }

    const contractsForDate = contractsByDate[selectedHandoverDayDate];
    if (!contractsForDate || contractsForDate.length === 0) {
      toast({
        title: "Brak umów",
        description: "Brak umów z rozpoczęciem wynajmu w wybranym dniu.",
      });
      return;
    }

    setIsSendingHandoverDay(true);
    try {
      // Prepare bundles
      const bundles = contractsForDate.map((contract) => ({
        contract_id: contract.id,
        contract_number: contract.contract_number,
        tenant_name: contract.tenant_name,
        tenant_email: contract.tenant_email,
        tenant_phone: contract.tenant_phone,
        vehicle_model: contract.vehicle_model,
        registration_number: contract.registration_number,
        scheduled_handover_date: contract.start_date,
        notification_type: "handover_day",
      }));

      // Send single request with all bundles
      const response = await fetch("https://hook.eu2.make.com/vofqrdp2wvda4hx1pohnflnqm5d6xbyg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedHandoverDayDate,
          bundles: bundles,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie wysłane dla ${contractsForDate.length} ${contractsForDate.length === 1 ? 'umowy' : contractsForDate.length < 5 ? 'umów' : 'umów'} z datą wydania ${new Date(selectedHandoverDayDate).toLocaleDateString("pl-PL")}`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia.",
        variant: "destructive",
      });
    } finally {
      setIsSendingHandoverDay(false);
    }
  };

  const handleSendReturn3DaysNotification = async () => {
    if (!selectedReturn3DaysDate) {
      toast({
        title: "Błąd",
        description: "Wybierz datę zwrotu.",
      });
      return;
    }

    const contractsForDate = returnContractsByDate[selectedReturn3DaysDate];
    if (!contractsForDate || contractsForDate.length === 0) {
      toast({
        title: "Brak umów",
        description: "Brak umów z zakończeniem wynajmu w wybranym dniu.",
      });
      return;
    }

    setIsSendingReturn3Days(true);
    try {
      // Prepare bundles
      const bundles = contractsForDate.map((contract) => ({
        contract_id: contract.id,
        contract_number: contract.contract_number,
        tenant_name: contract.tenant_name,
        tenant_email: contract.tenant_email,
        tenant_phone: contract.tenant_phone,
        vehicle_model: contract.vehicle_model,
        registration_number: contract.registration_number,
        scheduled_return_date: contract.end_date,
        notification_type: "return_2days_prior",
      }));

      // Send single request with all bundles
      const response = await fetch("https://hook.eu2.make.com/zc6xrwhlvuzpx1h1vqxc0ipzls6g8khm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedReturn3DaysDate,
          bundles: bundles,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie wysłane dla ${contractsForDate.length} ${contractsForDate.length === 1 ? 'umowy' : contractsForDate.length < 5 ? 'umów' : 'umów'} z datą zwrotu ${new Date(selectedReturn3DaysDate).toLocaleDateString("pl-PL")}`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReturn3Days(false);
    }
  };

  const handleSendDepositNotification = async () => {
    if (!selectedContractForDeposit) {
      toast({
        title: "Błąd",
        description: "Wybierz umowę.",
      });
      return;
    }

    const contract = contracts?.find(c => c.id === selectedContractForDeposit);
    if (!contract) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono umowy.",
      });
      return;
    }

    setIsSendingDepositNotification(true);
    try {
      const response = await fetch("https://hook.eu2.make.com/8lb97jeybom44bgvdx8c5jsf2976yeex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notification_type: "deposit_received",
          contract_id: contract.id,
          contract_number: contract.contract_number,
          tenant_name: contract.tenant_name || "",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie o przyjęciu kaucji wysłane dla umowy ${contract.contract_number}`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia.",
        variant: "destructive",
      });
    } finally {
      setIsSendingDepositNotification(false);
    }
  };

  const handleSendReceiptNotification = async () => {
    if (!selectedContractForReceipt) {
      toast({
        title: "Błąd",
        description: "Wybierz umowę.",
      });
      return;
    }

    const contract = contracts?.find(c => c.id === selectedContractForReceipt);
    if (!contract) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono umowy.",
      });
      return;
    }

    setIsSendingReceiptNotification(true);
    try {
      const response = await fetch("https://hook.eu2.make.com/vj28pea85sho49qrlhyv7vni16s7kmgg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notification_type: "receipt_uploaded",
          invoice_id: "test-invoice-id",
          contract_id: contract.id,
          contract_number: contract.contract_number,
          tenant_name: contract.tenant_name || "",
          invoice_type: "reservation",
          document_url: "https://example.com/test-receipt.pdf",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie o wgraniu paragonu wysłane dla umowy ${contract.contract_number}`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReceiptNotification(false);
    }
  };

  const handleSendReviewRequestNotification = async () => {
    if (!selectedReturnForReview) {
      toast({
        title: "Błąd",
        description: "Wybierz umowę.",
      });
      return;
    }

    const contract = contracts?.find(c => c.id === selectedReturnForReview);
    if (!contract) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono umowy.",
      });
      return;
    }

    setIsSendingReviewRequest(true);
    try {
      const response = await fetch("https://hook.eu2.make.com/sl64c2jcq2el9cdeiq6boszjd0upunow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notification_type: "review_request",
          contract_id: contract.id,
          contract_number: contract.contract_number,
          tenant_email: contract.tenant_email || "",
          tenant_name: contract.tenant_name || "",
          vehicle_model: contract.vehicle_model || "",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      toast({
        title: "Sukces",
        description: `Prośba o opinię wysłana dla umowy ${contract.contract_number}`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReviewRequest(false);
    }
  };

  const handleSendDepositCheck3Days = async () => {
    if (!selectedContractDeposit3Days) {
      toast({
        title: "Błąd",
        description: "Wybierz umowę.",
      });
      return;
    }

    const contract = contracts?.find(c => c.id === selectedContractDeposit3Days);
    if (!contract) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono umowy.",
      });
      return;
    }

    setIsSendingDepositCheck3Days(true);
    try {
      const payments = contract.payments as any;
      const depositAmount = payments?.kaucja?.wysokosc || 5000;

      const response = await fetch("https://hook.eu2.make.com/l85qhj1o29x7ie0kp4t83277i15l4f1b", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_id: contract.id,
          contract_number: contract.contract_number,
          tenant_name: contract.tenant_name || "",
          deposit_amount: depositAmount,
          start_date: contract.start_date,
          days_before: 3,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      toast({
        title: "Sukces",
        description: `Testowe powiadomienie wysłane dla umowy ${contract.contract_number}`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia.",
        variant: "destructive",
      });
    } finally {
      setIsSendingDepositCheck3Days(false);
    }
  };

  const handleSendDepositCheck5Days = async () => {
    if (!selectedContractDeposit5Days) {
      toast({
        title: "Błąd",
        description: "Wybierz umowę.",
      });
      return;
    }

    const contract = contracts?.find(c => c.id === selectedContractDeposit5Days);
    if (!contract) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono umowy.",
      });
      return;
    }

    setIsSendingDepositCheck5Days(true);
    try {
      const payments = contract.payments as any;
      const depositAmount = payments?.kaucja?.wysokosc || 5000;

      const response = await fetch("https://hook.eu2.make.com/l85qhj1o29x7ie0kp4t83277i15l4f1b", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_id: contract.id,
          contract_number: contract.contract_number,
          tenant_name: contract.tenant_name || "",
          deposit_amount: depositAmount,
          start_date: contract.start_date,
          days_before: 5,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      toast({
        title: "Sukces",
        description: `Testowe powiadomienie wysłane dla umowy ${contract.contract_number}`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia.",
        variant: "destructive",
      });
    } finally {
      setIsSendingDepositCheck5Days(false);
    }
  };

  const handleSendInvoiceFileNotification = async () => {
    if (!selectedContractForInvoiceFile) {
      toast({
        title: "Błąd",
        description: "Wybierz umowę.",
      });
      return;
    }

    const contract = contracts?.find(c => c.id === selectedContractForInvoiceFile);
    if (!contract) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono umowy.",
      });
      return;
    }

    setIsSendingInvoiceFileNotification(true);
    try {
      const invoiceTypeLabels = {
        reservation: "Rezerwacyjna",
        main_payment: "Zasadnicza",
        final: "Końcowa"
      } as const;

      const response = await supabase.functions.invoke('send-invoice-file-notification', {
        body: {
          invoice_id: "test-invoice-" + Date.now(),
          contract_id: contract.id,
          contract_number: contract.contract_number,
          tenant_name: contract.tenant_name || '',
          invoice_type: invoiceTypeLabels[selectedInvoiceFileType as keyof typeof invoiceTypeLabels] || selectedInvoiceFileType,
          amount: 5000,
          file_url: "https://qfnptknanxyfxvcuhgck.supabase.co/storage/v1/object/public/invoices/test-file.pdf",
          file_name: "test-invoice.pdf",
          file_type: "application/pdf",
          uploaded_at: new Date().toISOString(),
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send notification');
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie o ${invoiceTypeLabels[selectedInvoiceFileType as keyof typeof invoiceTypeLabels]} wysłane dla umowy ${contract.contract_number}`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia.",
        variant: "destructive",
      });
    } finally {
      setIsSendingInvoiceFileNotification(false);
    }
  };

  const handleSendDepositRentalDayNotification = async () => {
    if (!selectedDepositRentalDayContract) {
      toast({
        title: "Błąd",
        description: "Wybierz umowę",
        variant: "destructive",
      });
      return;
    }

    setIsSendingDepositRentalDay(true);
    try {
      const contract = contracts?.find(c => c.id === selectedDepositRentalDayContract);
      
      if (!contract?.deposit_received) {
        toast({
          title: "Uwaga",
          description: "Wybrana umowa nie ma oznaczonej wpłaconej kaucji",
          variant: "destructive",
        });
        setIsSendingDepositRentalDay(false);
        return;
      }

      const payments = contract.payments as any;
      const depositAmount = payments?.kaucja?.wysokosc || 0;
      const polandTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Warsaw' });

      const webhookResponse = await fetch('https://hook.eu2.make.com/8lb97jeybom44bgvdx8c5jsf2976yeex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_type: 'deposit_paid_rental_day',
          contract_id: contract.id,
          contract_number: contract.contract_number,
          tenant_name: contract.tenant_name,
          tenant_email: contract.tenant_email,
          tenant_phone: contract.tenant_phone,
          start_date: contract.start_date,
          end_date: contract.end_date,
          deposit_amount: depositAmount,
          deposit_received_at: contract.deposit_received_at,
          timestamp: new Date().toISOString(),
          poland_time: polandTime,
          test_mode: true
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
      }

      toast({
        title: "Sukces",
        description: `Wysłano powiadomienie o wpłaconej kaucji dla umowy ${contract.contract_number}`,
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingDepositRentalDay(false);
    }
  };

  const handleSendFolderRenameNotification = async () => {
    if (!selectedContractForFolderRename) {
      toast({
        title: "Błąd",
        description: "Wybierz umowę",
        variant: "destructive",
      });
      return;
    }

    setIsSendingFolderRename(true);
    try {
      // Get folder data from documents table
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('folder, folder_link')
        .eq('contract_id', selectedContractForFolderRename)
        .limit(1)
        .single();

      if (docError || !documents) {
        toast({
          title: "Błąd",
          description: "Nie znaleziono folderu dla wybranej umowy",
          variant: "destructive",
        });
        setIsSendingFolderRename(false);
        return;
      }

      const contract = contracts?.find(c => c.id === selectedContractForFolderRename);
      const oldName = documents.folder;
      const newName = documents.folder + ' [ANULOWANA]';

      const webhookResponse = await fetch('https://hook.eu2.make.com/gx5h00ers5p2pmfolfj8c6latm9iogvy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder_link: documents.folder_link,
          old_name: oldName,
          new_name: newName,
          contract_id: selectedContractForFolderRename,
          contract_number: contract?.contract_number,
          timestamp: new Date().toISOString(),
          test_mode: true
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
      }

      toast({
        title: "Sukces",
        description: `Wysłano żądanie zmiany nazwy folderu dla umowy ${contract?.contract_number}`,
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingFolderRename(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Panel testowania powiadomień webhook
          </CardTitle>
          <CardDescription>
            Testuj powiadomienia wysyłane na zewnętrzne webhooki
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Insurance Notification */}
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  30 dni do wygaśnięcia polisy ubezpieczeniowej pojazdu
                </h3>
                <Badge 
                  variant={connectionStatusInsurance === "connected" ? "default" : "secondary"}
                  className="gap-1"
                >
                  {connectionStatusInsurance === "connected" ? (
                    <>
                      <Plug className="h-3 w-3" />
                      Połączone
                    </>
                  ) : (
                    <>
                      <Unplug className="h-3 w-3" />
                      Niepołączone
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Wysyła powiadomienie o zbliżającym się terminie wygaśnięcia polisy ubezpieczeniowej pojazdu
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="connection-status-insurance">Status połączenia webhook</Label>
              <Select
                value={connectionStatusInsurance}
                onValueChange={(value) => setConnectionStatusInsurance(value as "disconnected" | "connected")}
                disabled={isSendingInsurance}
              >
                <SelectTrigger id="connection-status-insurance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disconnected">
                    <div className="flex items-center gap-2">
                      <Unplug className="h-4 w-4" />
                      Niepołączone
                    </div>
                  </SelectItem>
                  <SelectItem value="connected">
                    <div className="flex items-center gap-2">
                      <Plug className="h-4 w-4" />
                      Połączone
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-select-insurance">Wybierz pojazd</Label>
              <Select
                value={selectedVehicleInsurance}
                onValueChange={setSelectedVehicleInsurance}
                disabled={vehiclesLoading || isSendingInsurance}
              >
                <SelectTrigger id="vehicle-select-insurance">
                  <SelectValue placeholder="Wybierz pojazd..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.registration_number} - {vehicle.model}
                      {vehicle.insurance_valid_until && 
                        ` (polisa: ${new Date(vehicle.insurance_valid_until).toLocaleDateString("pl-PL")})`
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendInsuranceNotification} 
              disabled={!selectedVehicleInsurance || isSendingInsurance || connectionStatusInsurance === "disconnected"}
              className="w-full sm:w-auto"
            >
              {isSendingInsurance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie
            </Button>
            {connectionStatusInsurance === "disconnected" && (
              <p className="text-sm text-muted-foreground">
                Zmień status na "Połączone" aby wysłać powiadomienie
              </p>
            )}
          </div>

          {/* Inspection Notification */}
          <div className="space-y-4 pt-6 border-t">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  30 dni do wygaśnięcia przeglądu technicznego
                </h3>
                <Badge 
                  variant={connectionStatusInspection === "connected" ? "default" : "secondary"}
                  className="gap-1"
                >
                  {connectionStatusInspection === "connected" ? (
                    <>
                      <Plug className="h-3 w-3" />
                      Połączone
                    </>
                  ) : (
                    <>
                      <Unplug className="h-3 w-3" />
                      Niepołączone
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Wysyła powiadomienie o zbliżającym się terminie wygaśnięcia przeglądu technicznego pojazdu
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="connection-status-inspection">Status połączenia webhook</Label>
              <Select
                value={connectionStatusInspection}
                onValueChange={(value) => setConnectionStatusInspection(value as "disconnected" | "connected")}
                disabled={isSendingInspection}
              >
                <SelectTrigger id="connection-status-inspection">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disconnected">
                    <div className="flex items-center gap-2">
                      <Unplug className="h-4 w-4" />
                      Niepołączone
                    </div>
                  </SelectItem>
                  <SelectItem value="connected">
                    <div className="flex items-center gap-2">
                      <Plug className="h-4 w-4" />
                      Połączone
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-select-inspection">Wybierz pojazd</Label>
              <Select
                value={selectedVehicleInspection}
                onValueChange={setSelectedVehicleInspection}
                disabled={vehiclesLoading || isSendingInspection}
              >
                <SelectTrigger id="vehicle-select-inspection">
                  <SelectValue placeholder="Wybierz pojazd..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.registration_number} - {vehicle.model}
                      {vehicle.next_inspection_date && 
                        ` (przegląd: ${new Date(vehicle.next_inspection_date).toLocaleDateString("pl-PL")})`
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendInspectionNotification} 
              disabled={!selectedVehicleInspection || isSendingInspection || connectionStatusInspection === "disconnected"}
              className="w-full sm:w-auto"
            >
              {isSendingInspection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie
            </Button>
            {connectionStatusInspection === "disconnected" && (
              <p className="text-sm text-muted-foreground">
                Zmień status na "Połączone" aby wysłać powiadomienie
              </p>
            )}
          </div>

          {/* Rental Notification */}
          <div className="space-y-4 pt-6 border-t">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  3 dni przed zbliżającym się okresem wynajmu pojazdu
                </h3>
                <Badge 
                  variant={connectionStatusRental === "connected" ? "default" : "secondary"}
                  className="gap-1"
                >
                  {connectionStatusRental === "connected" ? (
                    <>
                      <Plug className="h-3 w-3" />
                      Połączone
                    </>
                  ) : (
                    <>
                      <Unplug className="h-3 w-3" />
                      Niepołączone
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Wysyła powiadomienie z danymi umowy 3 dni przed rozpoczęciem wynajmu
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="connection-status-rental">Status połączenia webhook</Label>
              <Select
                value={connectionStatusRental}
                onValueChange={(value) => setConnectionStatusRental(value as "disconnected" | "connected")}
                disabled={isSendingRental}
              >
                <SelectTrigger id="connection-status-rental">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disconnected">
                    <div className="flex items-center gap-2">
                      <Unplug className="h-4 w-4" />
                      Niepołączone
                    </div>
                  </SelectItem>
                  <SelectItem value="connected">
                    <div className="flex items-center gap-2">
                      <Plug className="h-4 w-4" />
                      Połączone
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-select-rental">Wybierz datę rozpoczęcia wynajmu</Label>
              <Select
                value={selectedDateRental}
                onValueChange={setSelectedDateRental}
                disabled={contractsLoading || isSendingRental}
              >
                <SelectTrigger id="date-select-rental">
                  <SelectValue placeholder="Wybierz datę..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(contractsByDate)
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, contracts]) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString("pl-PL")} - {contracts.length} {contracts.length === 1 ? 'umowa' : contracts.length < 5 ? 'umowy' : 'umów'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendRentalNotification} 
              disabled={!selectedDateRental || isSendingRental || connectionStatusRental === "disconnected"}
              className="w-full sm:w-auto"
            >
              {isSendingRental && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie
            </Button>
            {connectionStatusRental === "disconnected" && (
              <p className="text-sm text-muted-foreground">
                Zmień status na "Połączone" aby wysłać powiadomienie
              </p>
            )}
          </div>

          {/* Rental Notification 2 Days */}
          <div className="space-y-4 pt-6 border-t">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  2 dni przed zbliżającym się okresem wynajmu pojazdu
                </h3>
                <Badge 
                  variant={connectionStatusRental2Days === "connected" ? "default" : "secondary"}
                  className="gap-1"
                >
                  {connectionStatusRental2Days === "connected" ? (
                    <>
                      <Plug className="h-3 w-3" />
                      Połączone
                    </>
                  ) : (
                    <>
                      <Unplug className="h-3 w-3" />
                      Niepołączone
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Wysyła powiadomienie z danymi umowy 2 dni przed rozpoczęciem wynajmu
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="connection-status-rental-2days">Status połączenia webhook</Label>
              <Select
                value={connectionStatusRental2Days}
                onValueChange={(value) => setConnectionStatusRental2Days(value as "disconnected" | "connected")}
                disabled={isSendingRental2Days}
              >
                <SelectTrigger id="connection-status-rental-2days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disconnected">
                    <div className="flex items-center gap-2">
                      <Unplug className="h-4 w-4" />
                      Niepołączone
                    </div>
                  </SelectItem>
                  <SelectItem value="connected">
                    <div className="flex items-center gap-2">
                      <Plug className="h-4 w-4" />
                      Połączone
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-select-rental-2days">Wybierz datę</Label>
              <Select
                value={selectedDateRental2Days}
                onValueChange={setSelectedDateRental2Days}
                disabled={contractsLoading || isSendingRental2Days}
              >
                <SelectTrigger id="date-select-rental-2days">
                  <SelectValue placeholder="Wybierz datę..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(contractsByDate)
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, contracts]) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString("pl-PL")} - {contracts.length} {contracts.length === 1 ? 'umowa' : contracts.length < 5 ? 'umowy' : 'umów'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendRental2DaysNotification} 
              disabled={!selectedDateRental2Days || isSendingRental2Days || connectionStatusRental2Days === "disconnected"}
              className="w-full sm:w-auto"
            >
              {isSendingRental2Days && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie
            </Button>
            {connectionStatusRental2Days === "disconnected" && (
              <p className="text-sm text-muted-foreground">
              Zmień status na "Połączone" aby wysłać powiadomienie
            </p>
          )}
        </div>

          {/* Return Notification 2 Days */}
          <div className="space-y-4 pt-6 border-t">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  2 dni przed spodziewanym zwrotem kampera
                </h3>
                <Badge 
                  variant={connectionStatusReturn === "connected" ? "default" : "secondary"}
                  className="gap-1"
                >
                  {connectionStatusReturn === "connected" ? (
                    <>
                      <Plug className="h-3 w-3" />
                      Połączone
                    </>
                  ) : (
                    <>
                      <Unplug className="h-3 w-3" />
                      Niepołączone
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Wysyła powiadomienie z danymi zwrotu 2 dni przed spodziewanym zwrotem kampera
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="connection-status-return">Status połączenia webhook</Label>
              <Select
                value={connectionStatusReturn}
                onValueChange={(value) => setConnectionStatusReturn(value as "disconnected" | "connected")}
                disabled={isSendingReturn}
              >
                <SelectTrigger id="connection-status-return">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disconnected">
                    <div className="flex items-center gap-2">
                      <Unplug className="h-4 w-4" />
                      Niepołączone
                    </div>
                  </SelectItem>
                  <SelectItem value="connected">
                    <div className="flex items-center gap-2">
                      <Plug className="h-4 w-4" />
                      Połączone
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-select-return">Wybierz datę zwrotu</Label>
              <Select
                value={selectedReturnDate}
                onValueChange={setSelectedReturnDate}
                disabled={contractsLoading || isSendingReturn}
              >
                <SelectTrigger id="date-select-return">
                  <SelectValue placeholder="Wybierz datę..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(returnContractsByDate)
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, contracts]) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString("pl-PL")} - {contracts.length} {contracts.length === 1 ? 'umowa' : contracts.length < 5 ? 'umowy' : 'umów'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendReturnNotification} 
              disabled={!selectedReturnDate || isSendingReturn || connectionStatusReturn === "disconnected"}
              className="w-full sm:w-auto"
            >
              {isSendingReturn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie
            </Button>
            {connectionStatusReturn === "disconnected" && (
              <p className="text-sm text-muted-foreground">
                Zmień status na "Połączone" aby wysłać powiadomienie
              </p>
            )}
          </div>

          {/* Return Day Notification Test */}
          <div className="space-y-4 pt-8 border-t">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Powiadomienie w dniu zwrotu (7:00 rano)
              </h3>
              <p className="text-sm text-muted-foreground">
                Test powiadomienia wysyłanego automatycznie w dniu zwrotu o 7 rano ze wszystkimi oddaniami jako bundel
              </p>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  Webhook: https://hook.eu2.make.com/rhqdyg51l54f3put8ssxxhy5s7u02ba9
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-select-return-day">Wybierz datę zwrotu</Label>
              <Select
                value={selectedReturnDayDate}
                onValueChange={setSelectedReturnDayDate}
                disabled={contractsLoading || isSendingReturnDay}
              >
                <SelectTrigger id="date-select-return-day">
                  <SelectValue placeholder="Wybierz datę..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(returnContractsByDate)
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, contracts]) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString("pl-PL")} - {contracts.length} {contracts.length === 1 ? 'umowa' : contracts.length < 5 ? 'umowy' : 'umów'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSendReturnDayNotification}
              disabled={!selectedReturnDayDate || isSendingReturnDay}
              className="w-full sm:w-auto"
            >
              {isSendingReturnDay && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie (bundel)
            </Button>
          </div>

          {/* Handover Day Notification Test */}
          <div className="space-y-4 pt-8 border-t">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Powiadomienie w dniu wydania (7:15 rano)
              </h3>
              <p className="text-sm text-muted-foreground">
                Test powiadomienia wysyłanego automatycznie w dniu wydania o 7:15 rano ze wszystkimi wydaniami jako bundel
              </p>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  Webhook: https://hook.eu2.make.com/vofqrdp2wvda4hx1pohnflnqm5d6xbyg
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-select-handover-day">Wybierz datę wydania</Label>
              <Select
                value={selectedHandoverDayDate}
                onValueChange={setSelectedHandoverDayDate}
                disabled={contractsLoading || isSendingHandoverDay}
              >
                <SelectTrigger id="date-select-handover-day">
                  <SelectValue placeholder="Wybierz datę..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(contractsByDate)
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, contracts]) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString("pl-PL")} - {contracts.length} {contracts.length === 1 ? 'umowa' : contracts.length < 5 ? 'umowy' : 'umów'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSendHandoverDayNotification}
              disabled={!selectedHandoverDayDate || isSendingHandoverDay}
              className="w-full sm:w-auto"
            >
              {isSendingHandoverDay && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie (bundel)
            </Button>
          </div>

          {/* Return 3 Days Prior Notification Test */}
          <div className="space-y-4 pt-8 border-t">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Powiadomienie 3 dni przed zwrotem (8:00 rano)
              </h3>
              <p className="text-sm text-muted-foreground">
                Test powiadomienia wysyłanego automatycznie 3 dni przed zwrotem o 8 rano ze wszystkimi zwrotami jako bundel
              </p>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  Webhook: https://hook.eu2.make.com/zc6xrwhlvuzpx1h1vqxc0ipzls6g8khm
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-select-return-3days">Wybierz datę zwrotu</Label>
              <Select
                value={selectedReturn3DaysDate}
                onValueChange={setSelectedReturn3DaysDate}
                disabled={contractsLoading || isSendingReturn3Days}
              >
                <SelectTrigger id="date-select-return-3days">
                  <SelectValue placeholder="Wybierz datę..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(returnContractsByDate)
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, contracts]) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString("pl-PL")} - {contracts.length} {contracts.length === 1 ? 'umowa' : contracts.length < 5 ? 'umowy' : 'umów'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSendReturn3DaysNotification}
              disabled={!selectedReturn3DaysDate || isSendingReturn3Days}
              className="w-full sm:w-auto"
            >
              {isSendingReturn3Days && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie (bundel)
            </Button>
          </div>

          {/* Review Request Notification Test */}
          <div className="space-y-4 pt-8 border-t">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Prośba o opinię (8h po zwrocie kaucji)
              </h3>
              <p className="text-sm text-muted-foreground">
                Test powiadomienia wysyłanego automatycznie 8 godzin po zwrocie kaucji (gotówką lub przelewem)
              </p>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  Webhook: https://hook.eu2.make.com/sl64c2jcq2el9cdeiq6boszjd0upunow
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-select-review">Wybierz umowę</Label>
              <Select
                value={selectedReturnForReview}
                onValueChange={setSelectedReturnForReview}
                disabled={contractsLoading || isSendingReviewRequest}
              >
                <SelectTrigger id="contract-select-review">
                  <SelectValue placeholder="Wybierz umowę..." />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contract_number} - {contract.tenant_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSendReviewRequestNotification}
              disabled={!selectedReturnForReview || isSendingReviewRequest}
              className="w-full sm:w-auto"
            >
              {isSendingReviewRequest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij prośbę o opinię
            </Button>
          </div>

          {/* Deposit Check 3 Days Notification Test */}
          <div className="space-y-4 pt-8 border-t">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Sprawdzenie kaucji 3 dni przed rozpoczęciem najmu
              </h3>
              <p className="text-sm text-muted-foreground">
                Test powiadomienia wysyłanego dla umowy, gdzie kaucja nie została przyjęta 3 dni przed rozpoczęciem
              </p>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  Webhook: https://hook.eu2.make.com/l85qhj1o29x7ie0kp4t83277i15l4f1b
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-select-deposit-3days">Wybierz umowę</Label>
              <Select
                value={selectedContractDeposit3Days}
                onValueChange={setSelectedContractDeposit3Days}
                disabled={contractsLoading || isSendingDepositCheck3Days}
              >
                <SelectTrigger id="contract-select-deposit-3days">
                  <SelectValue placeholder="Wybierz umowę..." />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.filter(c => !c.deposit_received).map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contract_number} - {contract.tenant_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSendDepositCheck3Days}
              disabled={!selectedContractDeposit3Days || isSendingDepositCheck3Days}
              className="w-full sm:w-auto"
            >
              {isSendingDepositCheck3Days && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij testowe powiadomienie
            </Button>
          </div>

          {/* Deposit Check 5 Days Notification Test */}
          <div className="space-y-4 pt-8 border-t">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Sprawdzenie kaucji 5 dni przed rozpoczęciem najmu
              </h3>
              <p className="text-sm text-muted-foreground">
                Test powiadomienia wysyłanego dla umowy, gdzie kaucja nie została przyjęta 5 dni przed rozpoczęciem
              </p>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  Webhook: https://hook.eu2.make.com/l85qhj1o29x7ie0kp4t83277i15l4f1b
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-select-deposit-5days">Wybierz umowę</Label>
              <Select
                value={selectedContractDeposit5Days}
                onValueChange={setSelectedContractDeposit5Days}
                disabled={contractsLoading || isSendingDepositCheck5Days}
              >
                <SelectTrigger id="contract-select-deposit-5days">
                  <SelectValue placeholder="Wybierz umowę..." />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.filter(c => !c.deposit_received).map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contract_number} - {contract.tenant_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSendDepositCheck5Days}
              disabled={!selectedContractDeposit5Days || isSendingDepositCheck5Days}
              className="w-full sm:w-auto"
            >
              {isSendingDepositCheck5Days && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij testowe powiadomienie
            </Button>
          </div>

          {/* Deposit Received Notification Test */}
          <div className="space-y-4 pt-8 border-t">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Powiadomienie o przyjęciu kaucji
              </h3>
              <p className="text-sm text-muted-foreground">
                Test powiadomienia wysyłanego po zaznaczeniu checkboxa "Kaucja przyjęta" w panelu księgowości
              </p>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  Webhook: https://hook.eu2.make.com/hg6o7ehx1b6nar2xsshlpmqkkkf11fkp
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-select-deposit">Wybierz umowę</Label>
              <Select
                value={selectedContractForDeposit}
                onValueChange={setSelectedContractForDeposit}
                disabled={contractsLoading || isSendingDepositNotification}
              >
                <SelectTrigger id="contract-select-deposit">
                  <SelectValue placeholder="Wybierz umowę..." />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contract_number} - {contract.tenant_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSendDepositNotification}
              disabled={!selectedContractForDeposit || isSendingDepositNotification}
              className="w-full sm:w-auto"
            >
              {isSendingDepositNotification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie o kaucji
            </Button>
          </div>

          {/* Receipt Uploaded Notification Test */}
          <div className="space-y-4 pt-8 border-t">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Powiadomienie o wgraniu paragonu/faktury
              </h3>
              <p className="text-sm text-muted-foreground">
                Test powiadomienia wysyłanego automatycznie po wgraniu paragonu/faktury przez księgowość
              </p>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  Webhook: https://hook.eu2.make.com/vj28pea85sho49qrlhyv7vni16s7kmgg
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-select-receipt">Wybierz umowę</Label>
              <Select
                value={selectedContractForReceipt}
                onValueChange={setSelectedContractForReceipt}
                disabled={contractsLoading || isSendingReceiptNotification}
              >
                <SelectTrigger id="contract-select-receipt">
                  <SelectValue placeholder="Wybierz umowę..." />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contract_number} - {contract.tenant_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSendReceiptNotification}
              disabled={!selectedContractForReceipt || isSendingReceiptNotification}
              className="w-full sm:w-auto"
            >
              {isSendingReceiptNotification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie o paragonie
            </Button>
          </div>

          {/* Invoice/Receipt File Notification Test */}
          <div className="space-y-4 pt-8 border-t">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Test wysyłania powiadomienia o fakturze/paragonie (nowa funkcja)
              </h3>
              <p className="text-sm text-muted-foreground">
                Test powiadomienia wysyłanego automatycznie po wgraniu faktury/paragonu - używa funkcji send-invoice-file-notification z automatycznym podpisywaniem URL
              </p>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  Edge Function: send-invoice-file-notification → Webhook: https://hook.eu2.make.com/gtbg718kxoqvlwmtdneag7t36blgvghi
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-select-invoice-file">Wybierz umowę</Label>
              <Select
                value={selectedContractForInvoiceFile}
                onValueChange={setSelectedContractForInvoiceFile}
                disabled={contractsLoading || isSendingInvoiceFileNotification}
              >
                <SelectTrigger id="contract-select-invoice-file">
                  <SelectValue placeholder="Wybierz umowę..." />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contract_number} - {contract.tenant_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice-type-select">Typ faktury/paragonu</Label>
              <Select
                value={selectedInvoiceFileType}
                onValueChange={setSelectedInvoiceFileType}
                disabled={isSendingInvoiceFileNotification}
              >
                <SelectTrigger id="invoice-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reservation">Rezerwacyjna</SelectItem>
                  <SelectItem value="main_payment">Zasadnicza</SelectItem>
                  <SelectItem value="final">Końcowa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSendInvoiceFileNotification}
              disabled={!selectedContractForInvoiceFile || isSendingInvoiceFileNotification}
              className="w-full sm:w-auto"
            >
              {isSendingInvoiceFileNotification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie o fakturze/paragonie
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Paid on Rental Day Notification */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Powiadomienie o wpłaconej kaucji (dzień wynajmu)
          </CardTitle>
          <CardDescription>
            Test powiadomienia wysyłanego o 7:00 rano w dniu rozpoczęcia wynajmu, jeśli kaucja została opłacona
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Wybierz umowę z wpłaconą kaucją</Label>
              <Select
                value={selectedDepositRentalDayContract}
                onValueChange={setSelectedDepositRentalDayContract}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz umowę z wpłaconą kaucją" />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.filter(c => c.deposit_received).map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contract_number} - {contract.tenant_name} ✅
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSendDepositRentalDayNotification}
              disabled={isSendingDepositRentalDay || !selectedDepositRentalDayContract}
              className="w-full sm:w-auto"
            >
              {isSendingDepositRentalDay && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij test powiadomienia
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Folder Rename Notification (Cancelled Contract) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Zmiana nazwy folderu (Anulowana umowa)
          </CardTitle>
          <CardDescription>
            Test powiadomienia wysyłanego gdy umowa zostaje anulowana - folder w Google Drive zostanie oznaczony jako [ANULOWANA]
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">
                Edge Function: update-contract-folder-name → Webhook: https://hook.eu2.make.com/gx5h00ers5p2pmfolfj8c6latm9iogvy
              </span>
            </div>

            <div>
              <Label>Wybierz umowę</Label>
              <Select
                value={selectedContractForFolderRename}
                onValueChange={setSelectedContractForFolderRename}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz umowę..." />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contract_number} - {contract.tenant_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSendFolderRenameNotification}
              disabled={isSendingFolderRename || !selectedContractForFolderRename}
              className="w-full sm:w-auto"
            >
              {isSendingFolderRename && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij test zmiany nazwy folderu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestNotifications;
