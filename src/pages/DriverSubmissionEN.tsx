import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Send, CheckCircle2, FileText, Plus, Info } from "lucide-react";
import { toast } from "sonner";
import { useContractByNumber, useUpdateContract, useContract } from "@/hooks/useContracts";
import { useUpdateClient } from "@/hooks/useClients";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { supabase } from "@/integrations/supabase/client";

const WARSAW_TZ = "Europe/Warsaw";

const DriverSubmissionEN = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const decodedId = contractId ? decodeURIComponent(contractId) : undefined;
  
  const isUUID = decodedId?.includes('-');
  
  const { data: contractByUUID, isLoading: isLoadingByUUID, isError: isErrorByUUID } = useContract(isUUID ? decodedId : undefined);
  const { data: contractByNumber, isLoading: isLoadingByNumber, isError: isErrorByNumber } = useContractByNumber(!isUUID ? decodedId : undefined);
  
  const contract = isUUID ? contractByUUID : contractByNumber;
  const isLoading = isUUID ? isLoadingByUUID : isLoadingByNumber;
  const isError = isUUID ? isErrorByUUID : isErrorByNumber;
  const updateContract = useUpdateContract();
  const updateClient = useUpdateClient();
  const [submitted, setSubmitted] = useState(false);
  const [additionalDrivers, setAdditionalDrivers] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    invoiceType: "receipt" as "receipt" | "invoice",
    companyName: "",
    nip: "",
    numberOfTravelers: "",
    driverName: "",
    driverEmail: "",
    driverPhone: "",
    driverAddress: "",
    driverPesel: "",
    licenseNumber: "",
    licenseIssueDate: "",
    hasCategoryB: false,
    documentType: "dowod",
    documentNumber: "",
    documentIssuedBy: "",
    trailerLicenseCategory: "" as "" | "B" | "B96" | "B+E",
    trailerF1Mass: "",
    trailerO1Mass: "",
  });

  const [additionalDriversHasCategoryB, setAdditionalDriversHasCategoryB] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (contract) {
      const existingCategories = contract.tenant_license_category 
        ? contract.tenant_license_category.split(',').map(c => c.trim()).filter(Boolean)
        : [];
      const hasBCategory = existingCategories.includes('B');
      
      setFormData({
        invoiceType: (contract.invoice_type as "receipt" | "invoice") || "receipt",
        companyName: contract.tenant_company_name || "",
        nip: contract.tenant_nip || "",
        numberOfTravelers: contract.number_of_travelers?.toString() || "",
        driverName: contract.tenant_name || "",
        driverEmail: contract.tenant_email || "",
        driverPhone: contract.tenant_phone || "",
        driverAddress: contract.tenant_address || "",
        driverPesel: contract.tenant_pesel || "",
        licenseNumber: contract.tenant_license_number || "",
        licenseIssueDate: contract.tenant_license_date || "",
        hasCategoryB: hasBCategory,
        documentType: contract.tenant_id_type || "dowod",
        documentNumber: contract.tenant_id_number || "",
        documentIssuedBy: contract.tenant_id_issuer || "",
        trailerLicenseCategory: (contract.tenant_trailer_license_category as "" | "B" | "B96" | "B+E") || "",
        trailerF1Mass: contract.vehicle_f1_mass?.toString() || "",
        trailerO1Mass: contract.vehicle_o1_mass?.toString() || "",
      });
    }
  }, [contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contract?.id) return;

    if (!formData.hasCategoryB) {
      toast.error("Validation Error", {
        description: "You must confirm having a category B driving license"
      });
      return;
    }

    if (!formData.numberOfTravelers || Number(formData.numberOfTravelers) < 1) {
      toast.error("Validation Error", {
        description: "You must provide the number of travelers (minimum 1)"
      });
      return;
    }

    if (contract.has_trailer) {
      if (!formData.trailerF1Mass || !formData.trailerO1Mass) {
        toast.error("Validation Error", {
          description: "You must provide F1 and O1 values from the registration certificate"
        });
        return;
      }

      if (!formData.trailerLicenseCategory) {
        toast.error("Validation Error", {
          description: "You must select a trailer license category"
        });
        return;
      }

      const f1 = Number(formData.trailerF1Mass);
      const trailerMass = Number(contract.trailer_mass);
      const o1 = Number(formData.trailerO1Mass);

      if (trailerMass > o1) {
        toast.error("Validation Error", {
          description: `Trailer mass (${trailerMass} kg) exceeds maximum O1 value (${o1} kg)`
        });
        return;
      }

      const totalMass = f1 + trailerMass;
      
      if (formData.trailerLicenseCategory === 'B' || formData.trailerLicenseCategory === 'B+E') {
        if (totalMass > 3500) {
          toast.error("Validation Error", {
            description: `For category ${formData.trailerLicenseCategory}: F1 + trailer mass (${totalMass} kg) exceeds 3500 kg limit`
          });
          return;
        }
      } else if (formData.trailerLicenseCategory === 'B96') {
        if (totalMass > 4250) {
          toast.error("Validation Error", {
            description: `For category B96: F1 + trailer mass (${totalMass} kg) exceeds 4250 kg limit`
          });
          return;
        }
      }
    }

    try {
      const form = e.target as HTMLFormElement;
      
      const mainDriver = {
        imie_nazwisko: formData.driverName,
        email: formData.driverEmail,
        tel: formData.driverPhone,
        pesel: formData.driverPesel,
        prawo_jazdy_numer: formData.licenseNumber,
        prawo_jazdy_data: formData.licenseIssueDate,
        prawo_jazdy_kategoria: 'B',
        dokument_rodzaj: formData.documentType,
        dokument_numer: formData.documentNumber,
        dokument_organ: formData.documentIssuedBy,
        typ: 'najemca',
      };

      const additionalDriversData = additionalDrivers.map((driverIndex) => ({
        imie_nazwisko: form[`add_driver_${driverIndex}_name`].value,
        email: form[`add_driver_${driverIndex}_email`].value,
        tel: form[`add_driver_${driverIndex}_phone`].value,
        prawo_jazdy_numer: form[`add_driver_${driverIndex}_license`].value,
        prawo_jazdy_data: form[`add_driver_${driverIndex}_license_date`].value,
        prawo_jazdy_kategoria: 'B',
        dokument_rodzaj: form[`add_driver_${driverIndex}_doc_type`].value,
        dokument_numer: form[`add_driver_${driverIndex}_doc_number`].value,
        dokument_organ: form[`add_driver_${driverIndex}_doc_issuer`].value,
        typ: 'dodatkowy',
      }));

      const allDrivers = [mainDriver, ...additionalDriversData];

      // Update contract with all driver data - SAME AS POLISH VERSION
      await updateContract.mutateAsync({
        id: contract.id,
        updates: {
          additional_drivers: allDrivers,
          invoice_type: formData.invoiceType,
          tenant_company_name: formData.companyName,
          tenant_nip: formData.nip,
          number_of_travelers: Number(formData.numberOfTravelers),
          tenant_name: formData.driverName,
          tenant_email: formData.driverEmail,
          tenant_phone: formData.driverPhone,
          tenant_address: formData.driverAddress,
          tenant_pesel: formData.driverPesel,
          tenant_license_number: formData.licenseNumber,
          tenant_license_date: formData.licenseIssueDate,
          tenant_license_category: 'B',
          tenant_id_type: formData.documentType,
          tenant_id_number: formData.documentNumber,
          tenant_id_issuer: formData.documentIssuedBy,
          tenant_trailer_license_category: formData.trailerLicenseCategory || null,
          vehicle_f1_mass: formData.trailerF1Mass ? Number(formData.trailerF1Mass) : null,
          vehicle_o1_mass: formData.trailerO1Mass ? Number(formData.trailerO1Mass) : null,
        } as any,
      });

      // Sync all tenant data with client profile - SAME AS POLISH VERSION
      if (contract.client_id) {
        const clientUpdates: any = {};
        
        // Basic contact data
        if (formData.driverName) clientUpdates.name = formData.driverName;
        if (formData.driverEmail) clientUpdates.email = formData.driverEmail;
        if (formData.driverPhone) clientUpdates.phone = formData.driverPhone;
        if (formData.driverAddress) clientUpdates.address = formData.driverAddress;
        
        // Identity documents
        if (formData.documentType) clientUpdates.id_type = formData.documentType;
        if (formData.documentNumber) clientUpdates.id_number = formData.documentNumber;
        if (formData.documentIssuedBy) clientUpdates.id_issuer = formData.documentIssuedBy;
        if (formData.driverPesel) clientUpdates.pesel = formData.driverPesel;
        if (formData.nip) clientUpdates.nip = formData.nip;
        
        // Driver's license
        if (formData.licenseNumber) clientUpdates.license_number = formData.licenseNumber;
        if (formData.hasCategoryB) {
          clientUpdates.license_category = 'B';
        }
        if (formData.licenseIssueDate) clientUpdates.license_date = formData.licenseIssueDate;
        if (formData.trailerLicenseCategory) clientUpdates.trailer_license_category = formData.trailerLicenseCategory;
        
        // Company data
        if (formData.companyName) clientUpdates.company_name = formData.companyName;
        
        // Update only if there are changes
        if (Object.keys(clientUpdates).length > 0) {
          await updateClient.mutateAsync({
            id: contract.client_id,
            updates: clientUpdates,
          });
          console.log('Client profile updated with:', clientUpdates);
        }
      }

      // Send webhook notification (this will also create the notification log)
      try {
        await supabase.functions.invoke('notify-driver-submission', {
          body: {
            contractId: contract.id,
            contractNumber: contract.contract_number,
          }
        });
      } catch (webhookError) {
        console.error('Error sending webhook:', webhookError);
        // Don't block submission if webhook fails
      }

      toast.success("Success!", {
        description: "Driver data has been successfully submitted"
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting driver data:', error);
      toast.error("Error", {
        description: "An error occurred while submitting driver data"
      });
    }
  };

  const addAdditionalDriver = () => {
    if (additionalDrivers.length < 2) {
      setAdditionalDrivers([...additionalDrivers, additionalDrivers.length]);
    }
  };

  const removeAdditionalDriver = (index: number) => {
    setAdditionalDrivers(additionalDrivers.filter(d => d !== index));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading contract data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Contract not found or you don't have access to it.</p>
              <Button onClick={() => navigate('/contracts')} variant="outline">
                Back to Contracts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Success!</CardTitle>
            <CardDescription className="text-base">
              Driver data has been successfully submitted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Thank you for completing the driver information form.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Driver Information</CardTitle>
            </div>
            <CardDescription>
              Contract number: {contract.contract_number} | Vehicle: {contract.vehicle_model}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Type
                </h3>
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select
                    value={formData.invoiceType}
                    onValueChange={(value: "receipt" | "invoice") => 
                      setFormData({...formData, invoiceType: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.invoiceType === "invoice" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        required={formData.invoiceType === "invoice"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nip">Tax ID (NIP) *</Label>
                      <Input
                        id="nip"
                        value={formData.nip}
                        onChange={(e) => setFormData({...formData, nip: e.target.value})}
                        required={formData.invoiceType === "invoice"}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="numberOfTravelers">Number of Travelers *</Label>
                  <Input
                    id="numberOfTravelers"
                    type="number"
                    min="1"
                    value={formData.numberOfTravelers}
                    onChange={(e) => setFormData({...formData, numberOfTravelers: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Main Driver Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="driverName">Full Name *</Label>
                    <Input
                      id="driverName"
                      value={formData.driverName}
                      onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverEmail">Email *</Label>
                    <Input
                      id="driverEmail"
                      type="email"
                      value={formData.driverEmail}
                      onChange={(e) => setFormData({...formData, driverEmail: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverPhone">Phone *</Label>
                    <Input
                      id="driverPhone"
                      type="tel"
                      value={formData.driverPhone}
                      onChange={(e) => setFormData({...formData, driverPhone: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverAddress">Address *</Label>
                    <Input
                      id="driverAddress"
                      value={formData.driverAddress}
                      onChange={(e) => setFormData({...formData, driverAddress: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverPesel">PESEL</Label>
                    <Input
                      id="driverPesel"
                      value={formData.driverPesel}
                      onChange={(e) => setFormData({...formData, driverPesel: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number *</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseIssueDate">License Issue Date *</Label>
                    <Input
                      id="licenseIssueDate"
                      type="date"
                      value={formData.licenseIssueDate}
                      onChange={(e) => setFormData({...formData, licenseIssueDate: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="hasCategoryB"
                    checked={formData.hasCategoryB}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, hasCategoryB: checked as boolean})
                    }
                  />
                  <Label 
                    htmlFor="hasCategoryB" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I confirm having a valid category B driving license *
                  </Label>
                </div>
              </div>

              {contract.has_trailer && (
                <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <h3 className="text-lg font-semibold">Trailer Information</h3>
                      <p className="text-sm text-muted-foreground">
                        This rental includes a trailer. Please provide the following information from your vehicle registration certificate.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="trailerF1Mass">
                        F.1 (Gross Vehicle Weight) *
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 inline ml-1 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">F.1 value from your vehicle registration certificate</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Input
                        id="trailerF1Mass"
                        type="number"
                        value={formData.trailerF1Mass}
                        onChange={(e) => setFormData({...formData, trailerF1Mass: e.target.value})}
                        placeholder="e.g., 3500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trailerO1Mass">
                        O.1 (Maximum Trailer Mass) *
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 inline ml-1 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">O.1 value from your vehicle registration certificate</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Input
                        id="trailerO1Mass"
                        type="number"
                        value={formData.trailerO1Mass}
                        onChange={(e) => setFormData({...formData, trailerO1Mass: e.target.value})}
                        placeholder="e.g., 750"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="trailerLicenseCategory">Trailer License Category *</Label>
                      <Select
                        value={formData.trailerLicenseCategory}
                        onValueChange={(value: "" | "B" | "B96" | "B+E") => 
                          setFormData({...formData, trailerLicenseCategory: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="B">Category B</SelectItem>
                          <SelectItem value="B96">Category B96</SelectItem>
                          <SelectItem value="B+E">Category B+E</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Trailer mass: {contract.trailer_mass} kg
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Identity Document</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentType">Document Type *</Label>
                    <Select
                      value={formData.documentType}
                      onValueChange={(value) => setFormData({...formData, documentType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dowod">ID Card</SelectItem>
                        <SelectItem value="paszport">Passport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">Document Number *</Label>
                    <Input
                      id="documentNumber"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({...formData, documentNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="documentIssuedBy">Issued By *</Label>
                    <Input
                      id="documentIssuedBy"
                      value={formData.documentIssuedBy}
                      onChange={(e) => setFormData({...formData, documentIssuedBy: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Additional Drivers</h3>
                  {additionalDrivers.length < 2 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addAdditionalDriver}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Driver
                    </Button>
                  )}
                </div>

                {additionalDrivers.map((driverIndex) => (
                  <Card key={driverIndex} className="p-4 bg-muted/30">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Additional Driver #{driverIndex + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAdditionalDriver(driverIndex)}
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_name`}>Full Name *</Label>
                          <Input
                            id={`add_driver_${driverIndex}_name`}
                            name={`add_driver_${driverIndex}_name`}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_email`}>Email *</Label>
                          <Input
                            id={`add_driver_${driverIndex}_email`}
                            name={`add_driver_${driverIndex}_email`}
                            type="email"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_phone`}>Phone *</Label>
                          <Input
                            id={`add_driver_${driverIndex}_phone`}
                            name={`add_driver_${driverIndex}_phone`}
                            type="tel"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_license`}>License Number *</Label>
                          <Input
                            id={`add_driver_${driverIndex}_license`}
                            name={`add_driver_${driverIndex}_license`}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_license_date`}>License Issue Date *</Label>
                          <Input
                            id={`add_driver_${driverIndex}_license_date`}
                            name={`add_driver_${driverIndex}_license_date`}
                            type="date"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_doc_type`}>Document Type *</Label>
                          <Select
                            name={`add_driver_${driverIndex}_doc_type`}
                            defaultValue="dowod"
                            required
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dowod">ID Card</SelectItem>
                              <SelectItem value="paszport">Passport</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_doc_number`}>Document Number *</Label>
                          <Input
                            id={`add_driver_${driverIndex}_doc_number`}
                            name={`add_driver_${driverIndex}_doc_number`}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_doc_issuer`}>Issued By *</Label>
                          <Input
                            id={`add_driver_${driverIndex}_doc_issuer`}
                            name={`add_driver_${driverIndex}_doc_issuer`}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 p-4 bg-background rounded-lg">
                        <Checkbox
                          id={`add_driver_${driverIndex}_category_b`}
                          checked={additionalDriversHasCategoryB[driverIndex] || false}
                          onCheckedChange={(checked) => 
                            setAdditionalDriversHasCategoryB({
                              ...additionalDriversHasCategoryB,
                              [driverIndex]: checked as boolean
                            })
                          }
                          required
                        />
                        <Label 
                          htmlFor={`add_driver_${driverIndex}_category_b`}
                          className="text-sm font-medium"
                        >
                          I confirm having a valid category B driving license *
                        </Label>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Important Information
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>All fields marked with * are required</li>
                  <li>Make sure all information is accurate</li>
                  <li>Driver's license must be valid for the entire rental period</li>
                  {contract.has_trailer && (
                    <li>F.1 and O.1 values must be from your vehicle registration certificate</li>
                  )}
                </ul>
              </div>

              <Button type="submit" className="w-full" size="lg">
                <Send className="mr-2 h-5 w-5" />
                Submit Driver Information
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverSubmissionEN;
