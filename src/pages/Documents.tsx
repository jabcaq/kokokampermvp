import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Trash2, ArrowUpDown, FileText, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDocuments, useArchivedDocuments, useArchiveDocument, useAddDocument, useDeleteDocument, useUpdateDocument, Document } from "@/hooks/useDocuments";
import { useClients } from "@/hooks/useClients";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
const Documents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [rodzajFilter, setRodzajFilter] = useState<string>("all");
  const [umowaSystemFilter, setUmowaSystemFilter] = useState<"all" | "with" | "without">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"rodzaj" | "nazwa_pliku" | "data" | "created_at">("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAdmin, setIsAdmin] = useState(false);
  const [columnWidths, setColumnWidths] = useState({
    rodzaj: 150,
    umowa: 160,
    folder: 150,
    folder_link: 120,
    nazwa_pliku: 200,
    link: 100,
    path: 150,
    rok: 80,
    akcje: 120
  });
  const [resizing, setResizing] = useState<string | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startWidth: number;
    column: string;
  } | null>(null);
  const {
    toast
  } = useToast();
  const {
    data: documents = [],
    isLoading
  } = useDocuments();
  const {
    data: archivedDocuments = [],
    isLoading: isLoadingArchived
  } = useArchivedDocuments();
  const {
    data: clients = []
  } = useClients();
  const {
    data: contracts = []
  } = useContracts();
  const addDocumentMutation = useAddDocument();
  const updateDocumentMutation = useUpdateDocument();
  const archiveDocumentMutation = useArchiveDocument();
  const deleteDocumentMutation = useDeleteDocument();

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        const {
          data
        } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
        setIsAdmin(!!data);
      }
    };
    checkAdminStatus();
  }, []);

  // Get unique rodzaj values for filter (filter out empty strings)
  const displayedDocuments = showArchived ? archivedDocuments : documents;
  const uniqueRodzaje = Array.from(new Set(displayedDocuments.map(doc => doc.rodzaj).filter(r => r && r.trim() !== ''))).sort();
  const filteredDocuments = displayedDocuments.filter(doc => {
    const matchesSearch = doc.rodzaj.toLowerCase().includes(searchQuery.toLowerCase()) || doc.nazwa_pliku.toLowerCase().includes(searchQuery.toLowerCase()) || doc.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.contract?.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) || doc.umowa_id && doc.umowa_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRodzaj = rodzajFilter === "all" || doc.rodzaj === rodzajFilter;
    const hasContractId = doc.contract_id !== null && doc.contract_id !== undefined;
    const matchesUmowaSystem = umowaSystemFilter === "all" || umowaSystemFilter === "with" && hasContractId || umowaSystemFilter === "without" && !hasContractId;
    return matchesSearch && matchesRodzaj && matchesUmowaSystem;
  });
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let aValue: any = a[sortField] ?? "";
    let bValue: any = b[sortField] ?? "";
    if (sortField === "data") {
      aValue = a.data ? new Date(a.data).getTime() : 0;
      bValue = b.data ? new Date(b.data).getTime() : 0;
    } else if (sortField === "created_at") {
      aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
      bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
    }
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = sortedDocuments.slice(startIndex, endIndex);
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };
  const handleSort = (field: "rodzaj" | "nazwa_pliku" | "data" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  const handleMouseDown = (e: React.MouseEvent, column: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[column as keyof typeof columnWidths];
    resizeRef.current = {
      startX,
      startWidth,
      column
    };
    setResizing(column);
  };
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current || !resizing) return;
      const {
        startX,
        startWidth,
        column
      } = resizeRef.current;
      const diff = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColumnWidths(prev => ({
        ...prev,
        [column]: newWidth
      }));
    };
    const handleMouseUp = () => {
      resizeRef.current = null;
      setResizing(null);
    };
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);
  const handleAddDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addDocumentMutation.mutateAsync({
        rodzaj: formData.get("rodzaj") as string,
        contract_id: formData.get("contract_id") as string || null,
        umowa_id: formData.get("umowa_id") as string || null,
        client_id: formData.get("client_id") as string || null,
        folder: formData.get("folder") as string || null,
        folder_link: formData.get("folder_link") as string || null,
        nazwa_pliku: formData.get("nazwa_pliku") as string,
        link: formData.get("link") as string || null,
        path: formData.get("path") as string || null,
        data: formData.get("data") as string || null,
        rok: formData.get("rok") ? parseInt(formData.get("rok") as string) : null
      });
      toast({
        title: "Sukces",
        description: "Dokument został dodany pomyślnie."
      });
      setIsDialogOpen(false);
      e.currentTarget.reset();
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać dokumentu.",
        variant: "destructive"
      });
    }
  };
  const handleArchiveDocument = async (id: string) => {
    try {
      await archiveDocumentMutation.mutateAsync(id);
      toast({
        title: "Sukces",
        description: "Dokument został zarchiwizowany."
      });
      setDeleteDocumentId(null);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zarchiwizować dokumentu.",
        variant: "destructive"
      });
    }
  };
  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocumentMutation.mutateAsync(id);
      toast({
        title: "Sukces",
        description: "Dokument został trwale usunięty."
      });
      setDeleteDocumentId(null);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć dokumentu.",
        variant: "destructive"
      });
    }
  };
  const handleEditDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDocument) return;
    const formData = new FormData(e.currentTarget);
    const contractId = formData.get("contract_id") as string;
    const clientId = formData.get("client_id") as string;
    try {
      await updateDocumentMutation.mutateAsync({
        id: editingDocument.id,
        updates: {
          rodzaj: formData.get("rodzaj") as string,
          contract_id: contractId === "none" ? null : contractId || null,
          umowa_id: formData.get("umowa_id") as string || null,
          client_id: clientId === "none" ? null : clientId || null,
          folder: formData.get("folder") as string || null,
          folder_link: formData.get("folder_link") as string || null,
          nazwa_pliku: formData.get("nazwa_pliku") as string,
          link: formData.get("link") as string || null,
          path: formData.get("path") as string || null,
          data: formData.get("data") as string || null,
          rok: formData.get("rok") ? parseInt(formData.get("rok") as string) : null
        }
      });
      toast({
        title: "Sukces",
        description: "Dokument został zaktualizowany."
      });
      setIsEditDialogOpen(false);
      setEditingDocument(null);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować dokumentu.",
        variant: "destructive"
      });
    }
  };
  return <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Dokumenty</h1>
          <p className="text-muted-foreground">Zarządzaj dokumentami</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && <Button variant={showArchived ? "default" : "outline"} onClick={() => setShowArchived(!showArchived)} className="gap-2">
              {showArchived ? "Pokaż aktywne" : "Pokaż zarchiwizowane"}
            </Button>}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-md">
                <Plus className="h-4 w-4" />
                Dodaj dokument
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dodaj nowy dokument</DialogTitle>
              <DialogDescription>
                Wypełnij formularz, aby dodać dokument do systemu
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDocument} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rodzaj">Rodzaj *</Label>
                  <Input id="rodzaj" name="rodzaj" placeholder="Typ dokumentu" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nazwa_pliku">Nazwa pliku *</Label>
                  <Input id="nazwa_pliku" name="nazwa_pliku" placeholder="dokument.pdf" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Klient</Label>
                  <Select name="client_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz klienta" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_id">Umowa (system)</Label>
                  <Select name="contract_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz umowę" />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts.map(contract => <SelectItem key={contract.id} value={contract.id}>
                          {contract.contract_number}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="umowa_id">Numer umowy (stara baza)</Label>
                  <Input id="umowa_id" name="umowa_id" placeholder="Numer z poprzedniej bazy" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="folder">Folder</Label>
                  <Input id="folder" name="folder" placeholder="Ścieżka folderu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="folder_link">Folder Link</Label>
                  <Input id="folder_link" name="folder_link" type="url" placeholder="https://..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="path">Path</Label>
                  <Input id="path" name="path" placeholder="Pełna ścieżka" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link">Link</Label>
                  <Input id="link" name="link" type="url" placeholder="https://..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input id="data" name="data" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rok">Rok</Label>
                  <Input id="rok" name="rok" type="number" placeholder="2024" />
                </div>
              </div>

              <Button type="submit" className="w-full">Dodaj dokument</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant={umowaSystemFilter === "all" ? "default" : "outline"} onClick={() => setUmowaSystemFilter("all")} size="sm">
            Wszystkie
          </Button>
          <Button variant={umowaSystemFilter === "with" ? "default" : "outline"} onClick={() => setUmowaSystemFilter("with")} size="sm">
            Z Umowa system
          </Button>
          <Button variant={umowaSystemFilter === "without" ? "default" : "outline"} onClick={() => setUmowaSystemFilter("without")} size="sm">Stare umowy</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Szukaj dokumentów..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <div className="w-full sm:w-48">
            <Select value={rodzajFilter} onValueChange={setRodzajFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtruj po rodzaju" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie rodzaje</SelectItem>
                {uniqueRodzaje.map(rodzaj => <SelectItem key={rodzaj} value={rodzaj}>
                    {rodzaj}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div> : sortedDocuments.length === 0 ? <div className="text-center py-12 border rounded-lg bg-card">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nie znaleziono dokumentów</p>
        </div> : <>
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
              Pokazywanie {startIndex + 1}-{Math.min(endIndex, sortedDocuments.length)} z {sortedDocuments.length} dokumentów
            </div>
          </div>

        <div className="border rounded-lg bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors relative" style={{
                width: columnWidths.rodzaj
              }} onClick={() => handleSort("rodzaj")}>
                  <div className="flex items-center gap-2">
                    Rodzaj
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary" onMouseDown={e => handleMouseDown(e, 'rodzaj')} />
                </TableHead>
                <TableHead className="relative" style={{
                width: columnWidths.umowa
              }}>
                  Umowa (system)
                  <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary" onMouseDown={e => handleMouseDown(e, 'umowa')} />
                </TableHead>
                <TableHead className="relative" style={{
                width: columnWidths.folder
              }}>
                  Folder
                  <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary" onMouseDown={e => handleMouseDown(e, 'folder')} />
                </TableHead>
                <TableHead className="relative" style={{
                width: columnWidths.folder_link
              }}>
                  Folder Link
                  <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary" onMouseDown={e => handleMouseDown(e, 'folder_link')} />
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors relative" style={{
                width: columnWidths.nazwa_pliku
              }} onClick={() => handleSort("nazwa_pliku")}>
                  <div className="flex items-center gap-2">
                    Nazwa pliku
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary" onMouseDown={e => handleMouseDown(e, 'nazwa_pliku')} />
                </TableHead>
                <TableHead className="relative" style={{
                width: columnWidths.link
              }}>
                  Link
                  <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary" onMouseDown={e => handleMouseDown(e, 'link')} />
                </TableHead>
                <TableHead className="relative" style={{
                width: columnWidths.path
              }}>
                  Path
                  <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary" onMouseDown={e => handleMouseDown(e, 'path')} />
                </TableHead>
                <TableHead className="relative" style={{
                width: columnWidths.rok
              }}>
                  Rok
                  <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary" onMouseDown={e => handleMouseDown(e, 'rok')} />
                </TableHead>
                <TableHead className="text-right relative" style={{
                width: columnWidths.akcje
              }}>
                  Akcje
                  <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary" onMouseDown={e => handleMouseDown(e, 'akcje')} />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDocuments.map(doc => <TableRow key={doc.id}>
                  <TableCell className="font-medium" style={{
                width: columnWidths.rodzaj
              }}>{doc.rodzaj}</TableCell>
                  <TableCell className="text-muted-foreground text-sm" style={{
                width: columnWidths.umowa
              }}>
                    {doc.contract?.contract_number || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm truncate" style={{
                width: columnWidths.folder
              }}>
                    {doc.folder || "—"}
                  </TableCell>
                  <TableCell style={{
                width: columnWidths.folder_link
              }}>
                    {doc.folder_link ? <a href={doc.folder_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                        Link
                      </a> : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm truncate" style={{
                width: columnWidths.nazwa_pliku
              }}>
                    {doc.nazwa_pliku}
                  </TableCell>
                  <TableCell style={{
                width: columnWidths.link
              }}>
                    {doc.link ? <a href={doc.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                        Link
                      </a> : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs truncate" style={{
                width: columnWidths.path
              }} title={doc.path || ""}>
                    {doc.path || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm" style={{
                width: columnWidths.rok
              }}>
                    {doc.rok || "—"}
                  </TableCell>
                  <TableCell className="text-right" style={{
                width: columnWidths.akcje
              }}>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                    setEditingDocument(doc);
                    setIsEditDialogOpen(true);
                  }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteDocumentId(doc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
              Poprzednia
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({
            length: totalPages
          }, (_, i) => i + 1).map(page => {
            if (page === 1 || page === totalPages || page >= currentPage - 1 && page <= currentPage + 1) {
              return <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="w-10">
                      {page}
                    </Button>;
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return <span key={page} className="px-2">...</span>;
            }
            return null;
          })}
            </div>

            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Następna
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>}
        </>}

      <AlertDialog open={!!deleteDocumentId} onOpenChange={() => setDeleteDocumentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showArchived ? "Czy na pewno chcesz trwale usunąć ten dokument?" : "Czy na pewno chcesz zarchiwizować ten dokument?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showArchived ? "Ta operacja jest nieodwracalna. Dokument zostanie trwale usunięty z bazy danych." : "Dokument zostanie zarchiwizowany i będzie widoczny tylko dla administratorów w widoku zarchiwizowanych."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
            if (deleteDocumentId) {
              if (showArchived) {
                handleDeleteDocument(deleteDocumentId);
              } else {
                handleArchiveDocument(deleteDocumentId);
              }
            }
          }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {showArchived ? "Usuń trwale" : "Archiwizuj"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Document Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={open => {
      setIsEditDialogOpen(open);
      if (!open) setEditingDocument(null);
    }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Podgląd i edycja dokumentu</DialogTitle>
            <DialogDescription>
              Edytuj informacje o dokumencie
            </DialogDescription>
          </DialogHeader>
          {editingDocument && <form onSubmit={handleEditDocument} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-rodzaj">Rodzaj *</Label>
                  <Input id="edit-rodzaj" name="rodzaj" defaultValue={editingDocument.rodzaj} placeholder="Typ dokumentu" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-nazwa_pliku">Nazwa pliku *</Label>
                  <Input id="edit-nazwa_pliku" name="nazwa_pliku" defaultValue={editingDocument.nazwa_pliku} placeholder="dokument.pdf" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-client_id">Klient</Label>
                  <Select name="client_id" defaultValue={editingDocument.client_id || "none"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz klienta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Brak</SelectItem>
                      {clients.map(client => <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contract_id">Umowa (system)</Label>
                  <Select name="contract_id" defaultValue={editingDocument.contract_id || "none"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz umowę" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Brak</SelectItem>
                      {contracts.map(contract => <SelectItem key={contract.id} value={contract.id}>
                          {contract.contract_number}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-umowa_id">Numer umowy (stara baza)</Label>
                <Input id="edit-umowa_id" name="umowa_id" defaultValue={editingDocument.umowa_id || ""} placeholder="Numer z poprzedniej bazy" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-folder">Folder</Label>
                  <Input id="edit-folder" name="folder" defaultValue={editingDocument.folder || ""} placeholder="Ścieżka folderu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-folder_link">Folder Link</Label>
                  <Input id="edit-folder_link" name="folder_link" type="url" defaultValue={editingDocument.folder_link || ""} placeholder="https://..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-path">Path</Label>
                  <Input id="edit-path" name="path" defaultValue={editingDocument.path || ""} placeholder="Pełna ścieżka" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-link">Link</Label>
                  <Input id="edit-link" name="link" type="url" defaultValue={editingDocument.link || ""} placeholder="https://..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-data">Data</Label>
                  <Input id="edit-data" name="data" type="date" defaultValue={editingDocument.data || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-rok">Rok</Label>
                  <Input id="edit-rok" name="rok" type="number" defaultValue={editingDocument.rok || ""} placeholder="2024" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Zapisz zmiany</Button>
                <Button type="button" variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingDocument(null);
            }}>
                  Anuluj
                </Button>
              </div>
            </form>}
        </DialogContent>
      </Dialog>
    </div>;
};
export default Documents;