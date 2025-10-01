import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Trash2, ArrowUpDown, FileText, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDocuments, useAddDocument, useDeleteDocument, useUpdateDocument, Document } from "@/hooks/useDocuments";
import { useClients } from "@/hooks/useClients";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Documents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [rodzajFilter, setRodzajFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"rodzaj" | "nazwa_pliku" | "data">("data");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  
  const { data: documents = [], isLoading } = useDocuments();
  const { data: clients = [] } = useClients();
  const { data: contracts = [] } = useContracts();
  const addDocumentMutation = useAddDocument();
  const updateDocumentMutation = useUpdateDocument();
  const deleteDocumentMutation = useDeleteDocument();

  // Get unique rodzaj values for filter
  const uniqueRodzaje = Array.from(new Set(documents.map(doc => doc.rodzaj))).sort();

  const filteredDocuments = documents.filter(
    (doc) => {
      const matchesSearch = doc.rodzaj.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.nazwa_pliku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.contract?.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.umowa_id && doc.umowa_id.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRodzaj = rodzajFilter === "all" || doc.rodzaj === rodzajFilter;
      
      return matchesSearch && matchesRodzaj;
    }
  );

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let aValue: any = a[sortField] ?? "";
    let bValue: any = b[sortField] ?? "";
    
    if (sortField === "data") {
      aValue = a.data ? new Date(a.data).getTime() : 0;
      bValue = b.data ? new Date(b.data).getTime() : 0;
    }
    
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: "rodzaj" | "nazwa_pliku" | "data") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

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
        nazwa_pliku: formData.get("nazwa_pliku") as string,
        link: formData.get("link") as string || null,
        path: formData.get("path") as string || null,
        data: formData.get("data") as string || null,
        rok: formData.get("rok") ? parseInt(formData.get("rok") as string) : null,
      });
      
      toast({
        title: "Sukces",
        description: "Dokument został dodany pomyślnie.",
      });
      
      setIsDialogOpen(false);
      e.currentTarget.reset();
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać dokumentu.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocumentMutation.mutateAsync(id);
      toast({
        title: "Sukces",
        description: "Dokument został usunięty.",
      });
      setDeleteDocumentId(null);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć dokumentu.",
        variant: "destructive",
      });
    }
  };

  const handleEditDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDocument) return;
    
    const formData = new FormData(e.currentTarget);
    
    try {
      await updateDocumentMutation.mutateAsync({
        id: editingDocument.id,
        updates: {
          rodzaj: formData.get("rodzaj") as string,
          contract_id: formData.get("contract_id") as string || null,
          umowa_id: formData.get("umowa_id") as string || null,
          client_id: formData.get("client_id") as string || null,
          folder: formData.get("folder") as string || null,
          nazwa_pliku: formData.get("nazwa_pliku") as string,
          link: formData.get("link") as string || null,
          path: formData.get("path") as string || null,
          data: formData.get("data") as string || null,
          rok: formData.get("rok") ? parseInt(formData.get("rok") as string) : null,
        },
      });
      
      toast({
        title: "Sukces",
        description: "Dokument został zaktualizowany.",
      });
      
      setIsEditDialogOpen(false);
      setEditingDocument(null);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować dokumentu.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Dokumenty</h1>
          <p className="text-muted-foreground">Zarządzaj dokumentami</p>
        </div>
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
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
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
                      {contracts.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.contract_number}
                        </SelectItem>
                      ))}
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
                  <Label htmlFor="path">Path</Label>
                  <Input id="path" name="path" placeholder="Pełna ścieżka" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Link</Label>
                <Input id="link" name="link" type="url" placeholder="https://..." />
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj dokumentów..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={rodzajFilter} onValueChange={setRodzajFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtruj po rodzaju" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie rodzaje</SelectItem>
              {uniqueRodzaje.map((rodzaj) => (
                <SelectItem key={rodzaj} value={rodzaj}>
                  {rodzaj}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sortedDocuments.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nie znaleziono dokumentów</p>
        </div>
      ) : (
        <div className="border rounded-lg bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors min-w-[120px]"
                  onClick={() => handleSort("rodzaj")}
                >
                  <div className="flex items-center gap-2">
                    Rodzaj
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="min-w-[140px]">Umowa (system)</TableHead>
                <TableHead>Folder</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors min-w-[150px]"
                  onClick={() => handleSort("nazwa_pliku")}
                >
                  <div className="flex items-center gap-2">
                    Nazwa pliku
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="w-[80px]">Link</TableHead>
                <TableHead className="min-w-[120px]">Path</TableHead>
                <TableHead className="w-[70px]">Rok</TableHead>
                <TableHead className="text-right w-[100px]">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.rodzaj}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {doc.contract?.contract_number || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[120px] truncate">
                    {doc.folder || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
                    {doc.nazwa_pliku}
                  </TableCell>
                  <TableCell>
                    {doc.link ? (
                      <a 
                        href={doc.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        Link
                      </a>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[120px] truncate" title={doc.path || ""}>
                    {doc.path || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {doc.rok || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingDocument(doc);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteDocumentId(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteDocumentId} onOpenChange={() => setDeleteDocumentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć ten dokument?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Dokument zostanie trwale usunięty.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDocumentId && handleDeleteDocument(deleteDocumentId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Document Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
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
          {editingDocument && (
            <form onSubmit={handleEditDocument} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-rodzaj">Rodzaj *</Label>
                  <Input 
                    id="edit-rodzaj" 
                    name="rodzaj" 
                    defaultValue={editingDocument.rodzaj}
                    placeholder="Typ dokumentu" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-nazwa_pliku">Nazwa pliku *</Label>
                  <Input 
                    id="edit-nazwa_pliku" 
                    name="nazwa_pliku" 
                    defaultValue={editingDocument.nazwa_pliku}
                    placeholder="dokument.pdf" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-client_id">Klient</Label>
                  <Select name="client_id" defaultValue={editingDocument.client_id || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz klienta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Brak</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contract_id">Umowa (system)</Label>
                  <Select name="contract_id" defaultValue={editingDocument.contract_id || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz umowę" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Brak</SelectItem>
                      {contracts.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.contract_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-umowa_id">Numer umowy (stara baza)</Label>
                <Input 
                  id="edit-umowa_id" 
                  name="umowa_id" 
                  defaultValue={editingDocument.umowa_id || ""}
                  placeholder="Numer z poprzedniej bazy" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-folder">Folder</Label>
                  <Input 
                    id="edit-folder" 
                    name="folder" 
                    defaultValue={editingDocument.folder || ""}
                    placeholder="Ścieżka folderu" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-path">Path</Label>
                  <Input 
                    id="edit-path" 
                    name="path" 
                    defaultValue={editingDocument.path || ""}
                    placeholder="Pełna ścieżka" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-link">Link</Label>
                <Input 
                  id="edit-link" 
                  name="link" 
                  type="url" 
                  defaultValue={editingDocument.link || ""}
                  placeholder="https://..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-data">Data</Label>
                  <Input 
                    id="edit-data" 
                    name="data" 
                    type="date" 
                    defaultValue={editingDocument.data || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-rok">Rok</Label>
                  <Input 
                    id="edit-rok" 
                    name="rok" 
                    type="number" 
                    defaultValue={editingDocument.rok || ""}
                    placeholder="2024" 
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Zapisz zmiany</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingDocument(null);
                  }}
                >
                  Anuluj
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents;