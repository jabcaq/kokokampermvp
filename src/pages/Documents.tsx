import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Trash2, ArrowUpDown, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDocuments, useAddDocument, useDeleteDocument } from "@/hooks/useDocuments";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"rodzaj" | "nazwa_pliku" | "data">("data");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  
  const { data: documents = [], isLoading } = useDocuments();
  const { data: clients = [] } = useClients();
  const { data: contracts = [] } = useContracts();
  const addDocumentMutation = useAddDocument();
  const deleteDocumentMutation = useDeleteDocument();

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.rodzaj.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.nazwa_pliku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.contract?.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.umowa_id && doc.umowa_id.toLowerCase().includes(searchQuery.toLowerCase()))
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj dokumentów..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
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
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("rodzaj")}
                >
                  <div className="flex items-center gap-2">
                    Rodzaj
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Umowa (system)</TableHead>
                <TableHead>Umowa (stara baza)</TableHead>
                <TableHead>Folder</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("nazwa_pliku")}
                >
                  <div className="flex items-center gap-2">
                    Nazwa pliku
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("data")}
                >
                  <div className="flex items-center gap-2">
                    Data
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Rok</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.rodzaj}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.contract?.contract_number || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.umowa_id || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.folder || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.nazwa_pliku}
                  </TableCell>
                  <TableCell>
                    {doc.link ? (
                      <a 
                        href={doc.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Link
                      </a>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate">
                    {doc.path || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.client?.name || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.data ? new Date(doc.data).toLocaleDateString('pl-PL') : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.rok || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDocumentId(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
    </div>
  );
};

export default Documents;