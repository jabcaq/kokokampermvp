import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Search, FileText, Receipt, Eye, Trash2, CheckCircle, Clock, FileUp, Upload, Plus, Check, ChevronsUpDown, ChevronLeft, ChevronRight, Archive } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ContractInvoice, ContractInvoiceFile, useUpdateContractInvoice, useAddContractInvoice } from "@/hooks/useContractInvoices";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "Oczekuje", icon: Clock, className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  submitted: { label: "Przesłano", icon: FileUp, className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  invoice_uploaded: { label: "Dokument wgrany", icon: Upload, className: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  completed: { label: "Zakończone", icon: CheckCircle, className: "bg-green-500/10 text-green-500 border-green-500/20" },
};

const invoiceTypeLabels = {
  reservation: "Rezerwacyjna",
  main_payment: "Zasadnicza", 
  final: "Końcowa",
};

const InvoicesManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [previewInvoice, setPreviewInvoice] = useState<ContractInvoice | null>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<ContractInvoiceFile | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [contractComboOpen, setContractComboOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<'reservation' | 'main_payment' | 'final'>('reservation');
  const [contractSearchQuery, setContractSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showArchived, setShowArchived] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  
  const updateInvoice = useUpdateContractInvoice();
  const addInvoice = useAddContractInvoice();

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        setIsAdmin(roles?.some(r => r.role === 'admin') || false);
      }
    };
    checkAdminStatus();
  }, []);

  const { data: allInvoices, isLoading } = useQuery({
    queryKey: ['all-invoices', showArchived],
    queryFn: async () => {
      let query = supabase
        .from('contract_invoices')
        .select(`
          *,
          contract:contracts(
            contract_number,
            tenant_name,
            tenant_company_name,
            invoice_type
          )
        `);
      
      if (!showArchived) {
        query = query.eq('is_archived', false);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(invoice => ({
        ...invoice,
        files: (invoice.files as any) || [],
      })) as (ContractInvoice & { contract: any })[];
    },
  });

  const { data: allContracts } = useQuery({
    queryKey: ['all-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('id, contract_number, tenant_name, tenant_company_name')
        .order('contract_number', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleUploadReceipt = async () => {
    if (!selectedContractId || !selectedFile) {
      toast({
        title: "Błąd",
        description: "Wybierz umowę i plik",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create invoice record first
      const newInvoice = await addInvoice.mutateAsync({
        contract_id: selectedContractId,
        invoice_type: selectedInvoiceType,
        amount: 0,
        status: 'invoice_uploaded',
        notes: 'Paragon wgrany przez system',
        submitted_at: null,
        invoice_file_url: null,
        invoice_uploaded_at: null,
        files: [],
        is_archived: false,
      });

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${newInvoice.id}-${Date.now()}.${fileExt}`;
      const filePath = `${selectedContractId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(filePath);

      // Update invoice with file info
      const fileData: ContractInvoiceFile = {
        id: Date.now().toString(),
        name: selectedFile.name,
        url: publicUrl,
        type: selectedFile.type,
        uploadedAt: new Date().toISOString(),
      };

      await updateInvoice.mutateAsync({
        id: newInvoice.id,
        updates: {
          files: [fileData],
          invoice_uploaded_at: new Date().toISOString(),
        }
      });

      // Invalidate all-invoices query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });

      toast({
        title: "Sukces",
        description: "Paragon został wgrany",
      });

      // Reset form
      setUploadDialogOpen(false);
      setSelectedContractId("");
      setSelectedInvoiceType('reservation');
      setSelectedFile(null);
      setFilePreview(null);
      setContractSearchQuery("");
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się wgrać paragonu",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contract_invoices')
        .update({ is_archived: true })
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });

      toast({
        title: "Sukces",
        description: "Dokument został przeniesiony do archiwum",
      });
      
      setDeleteInvoiceId(null);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zarchiwizować dokumentu",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!isAdmin) {
      toast({
        title: "Błąd",
        description: "Tylko administrator może usunąć dokument permanentnie",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contract_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });

      toast({
        title: "Sukces",
        description: "Dokument został trwale usunięty",
      });
      
      setDeleteInvoiceId(null);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć dokumentu",
        variant: "destructive",
      });
    }
  };

  const handleBulkArchive = async () => {
    try {
      const { error } = await supabase
        .from('contract_invoices')
        .update({ is_archived: true })
        .in('id', selectedInvoices);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });

      toast({
        title: "Sukces",
        description: `Przeniesiono ${selectedInvoices.length} dokumentów do archiwum`,
      });
      
      setSelectedInvoices([]);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zarchiwizować dokumentów",
        variant: "destructive",
      });
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (!isAdmin) {
      toast({
        title: "Błąd",
        description: "Tylko administrator może usunąć dokumenty permanentnie",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contract_invoices')
        .delete()
        .in('id', selectedInvoices);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });

      toast({
        title: "Sukces",
        description: `Trwale usunięto ${selectedInvoices.length} dokumentów`,
      });
      
      setSelectedInvoices([]);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć dokumentów",
        variant: "destructive",
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.length === paginatedInvoices?.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(paginatedInvoices?.map(inv => inv.id) || []);
    }
  };

  const toggleSelectInvoice = (id: string) => {
    setSelectedInvoices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredInvoices = allInvoices?.filter(invoice => {
    const searchLower = searchQuery.toLowerCase();
    return (
      invoice.contract?.contract_number?.toLowerCase().includes(searchLower) ||
      invoice.contract?.tenant_name?.toLowerCase().includes(searchLower) ||
      invoice.contract?.tenant_company_name?.toLowerCase().includes(searchLower) ||
      invoice.notes?.toLowerCase().includes(searchLower)
    );
  });

  const filteredContracts = allContracts?.filter(contract => {
    const searchLower = contractSearchQuery.toLowerCase();
    return (
      contract.contract_number?.toLowerCase().includes(searchLower) ||
      contract.tenant_name?.toLowerCase().includes(searchLower) ||
      contract.tenant_company_name?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const totalPages = Math.ceil((filteredInvoices?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices?.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const isImageFile = (type?: string) => type?.startsWith('image/');
  const isPdfFile = (type?: string) => type === 'application/pdf';

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Ładowanie...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Faktury i Paragony</h1>
              <p className="text-muted-foreground">Zarządzaj wszystkimi dokumentami rozliczeniowymi</p>
            </div>
          </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  variant={showArchived ? "default" : "outline"}
                  onClick={() => setShowArchived(!showArchived)}
                >
                  {showArchived ? "Ukryj archiwum" : "Pokaż archiwum"}
                </Button>
              )}
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Wgraj paragon
              </Button>
            </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Szukaj po numerze umowy, nazwie klienta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedInvoices.length > 0 && (
              <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Wybrano {selectedInvoices.length} {selectedInvoices.length === 1 ? 'dokument' : 'dokumentów'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {showArchived && isAdmin ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkPermanentDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Usuń trwale
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkArchive}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Do archiwum
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedInvoices([])}
                  >
                    Anuluj
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Pokaż</span>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">rekordów na stronę</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Pokazywanie {startIndex + 1}-{Math.min(endIndex, filteredInvoices?.length || 0)} z {filteredInvoices?.length || 0} dokumentów
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedInvoices.length === paginatedInvoices?.length && paginatedInvoices?.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Numer umowy</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Kwota</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pliki</TableHead>
                  <TableHead>Data utworzenia</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices?.map((invoice) => {
                  const status = statusConfig[invoice.status];
                  const StatusIcon = status.icon;
                  const docType = invoice.contract?.invoice_type === 'invoice' ? 'Faktura' : 'Paragon';
                  
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedInvoices.includes(invoice.id)}
                          onCheckedChange={() => toggleSelectInvoice(invoice.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {invoice.contract?.contract_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {invoice.contract?.tenant_company_name || invoice.contract?.tenant_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {docType === 'Faktura' ? <FileText className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
                          <span>{invoiceTypeLabels[invoice.invoice_type as keyof typeof invoiceTypeLabels]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {invoice.amount.toFixed(2)} PLN
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.files?.length > 0 ? (
                          <span className="text-sm text-muted-foreground">
                            {invoice.files.length} {invoice.files.length === 1 ? 'plik' : 'plików'}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Brak plików</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(invoice.created_at), 'dd.MM.yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteInvoiceId(invoice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredInvoices?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Brak dokumentów do wyświetlenia
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Poprzednia
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Następna
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Szczegóły dokumentu</DialogTitle>
          </DialogHeader>
          {previewInvoice && (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Numer umowy:</span>
                  <span className="font-medium">{(previewInvoice as any).contract?.contract_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Klient:</span>
                  <span className="font-medium">
                    {(previewInvoice as any).contract?.tenant_company_name || (previewInvoice as any).contract?.tenant_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Typ:</span>
                  <span className="font-medium">
                    {invoiceTypeLabels[previewInvoice.invoice_type as keyof typeof invoiceTypeLabels]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kwota:</span>
                  <span className="font-bold text-lg">{previewInvoice.amount.toFixed(2)} PLN</span>
                </div>
                {previewInvoice.notes && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Uwagi:</span>
                    <p className="font-medium">{previewInvoice.notes}</p>
                  </div>
                )}
              </div>

              {previewInvoice.files && previewInvoice.files.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Wgrane pliki:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {previewInvoice.files.map((file: ContractInvoiceFile) => (
                      <div 
                        key={file.id} 
                        className="relative group border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-muted"
                        onClick={() => setPreviewFile(file)}
                      >
                        <div className="aspect-square flex items-center justify-center p-4">
                          {isImageFile(file.type) ? (
                            <img 
                              src={file.url} 
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="p-2 bg-background border-t">
                          <p className="text-xs truncate" title={file.name}>
                            {file.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewFile && (
              <>
                {isImageFile(previewFile.type) ? (
                  <img 
                    src={previewFile.url} 
                    alt={previewFile.name}
                    className="w-full h-auto rounded-lg"
                  />
                ) : isPdfFile(previewFile.type) ? (
                  <iframe
                    src={previewFile.url}
                    className="w-full h-[70vh] rounded-lg border"
                    title={previewFile.name}
                  />
                ) : (
                  <div className="text-center space-y-4 p-8">
                    <FileText className="h-24 w-24 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Podgląd niedostępny dla tego typu pliku
                    </p>
                    <Button
                      onClick={() => window.open(previewFile.url, '_blank')}
                      variant="outline"
                    >
                      Pobierz plik
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Receipt Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto" aria-describedby="upload-description">
          <DialogHeader>
            <DialogTitle>Wgraj paragon</DialogTitle>
          </DialogHeader>
          <p id="upload-description" className="sr-only">Formularz do wgrywania paragonu dla wybranej umowy</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Wybierz umowę</Label>
              <Popover open={contractComboOpen} onOpenChange={setContractComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={contractComboOpen}
                    className="w-full justify-between"
                  >
                    {selectedContractId
                      ? allContracts?.find((contract) => contract.id === selectedContractId)
                          ? `${allContracts.find((c) => c.id === selectedContractId)?.contract_number} - ${
                              allContracts.find((c) => c.id === selectedContractId)?.tenant_company_name ||
                              allContracts.find((c) => c.id === selectedContractId)?.tenant_name
                            }`
                          : "Wybierz umowę..."
                      : "Wybierz umowę..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Szukaj po numerze umowy, nazwisku..." />
                    <CommandList>
                      <CommandEmpty>Nie znaleziono umowy.</CommandEmpty>
                      <CommandGroup>
                        {allContracts?.map((contract) => (
                          <CommandItem
                            key={contract.id}
                            value={`${contract.contract_number} ${contract.tenant_name || ''} ${contract.tenant_company_name || ''}`}
                            onSelect={() => {
                              setSelectedContractId(contract.id);
                              setContractComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedContractId === contract.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {contract.contract_number} - {contract.tenant_company_name || contract.tenant_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Typ paragonu</Label>
              <Select value={selectedInvoiceType} onValueChange={(value: any) => setSelectedInvoiceType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reservation">Rezerwacyjna</SelectItem>
                  <SelectItem value="main_payment">Zasadnicza</SelectItem>
                  <SelectItem value="final">Końcowa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Wybierz plik</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
              />
            </div>

            {filePreview && selectedFile && (
              <div className="space-y-2">
                <Label>Podgląd</Label>
                <div className="border rounded-lg p-4 bg-muted/50">
                  {selectedFile.type.startsWith('image/') ? (
                    <img src={filePreview} alt="Preview" className="max-h-64 mx-auto rounded" />
                  ) : selectedFile.type === 'application/pdf' ? (
                    <iframe
                      src={filePreview}
                      className="w-full h-64 rounded"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">{selectedFile.name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Anuluj
              </Button>
              <Button 
                onClick={handleUploadReceipt} 
                disabled={!selectedContractId || !selectedFile || isUploading}
              >
                {isUploading ? "Wgrywanie..." : "Zapisz"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive/Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteInvoiceId} onOpenChange={() => setDeleteInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showArchived && isAdmin ? "Trwale usuń dokument?" : "Przenieś do archiwum?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showArchived && isAdmin 
                ? "Ta akcja jest nieodwracalna. Dokument zostanie trwale usunięty z bazy danych."
                : "Dokument zostanie przeniesiony do archiwum. Administrator będzie mógł go przywrócić lub trwale usunąć."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (!deleteInvoiceId) return;
                if (showArchived && isAdmin) {
                  handlePermanentDelete(deleteInvoiceId);
                } else {
                  handleArchive(deleteInvoiceId);
                }
              }}
            >
              {showArchived && isAdmin ? "Usuń trwale" : "Do archiwum"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InvoicesManagement;
