import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Trash2, ArrowUpDown, Eye, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClients, useAddClient, useDeleteClient } from "@/hooks/useClients";
import { useToast } from "@/hooks/use-toast";
import { clientSchema } from "@/lib/validation";
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

const Clients = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"name" | "email" | "contracts_count" | "created_at">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();
  
  const { data: clients = [], isLoading } = useClients();
  const addClientMutation = useAddClient();
  const deleteClientMutation = useDeleteClient();

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find duplicate emails and mark which ones can be deleted
  const { duplicateEmails, firstOccurrences, deletableDuplicates } = useMemo(() => {
    const emailCount = new Map<string, number>();
    const emailFirstId = new Map<string, string>();
    const deletable = new Set<string>();
    
    clients.forEach(client => {
      const count = emailCount.get(client.email) || 0;
      emailCount.set(client.email, count + 1);
      
      if (count === 0) {
        // First occurrence - mark as the one to keep
        emailFirstId.set(client.email, client.id);
      } else {
        // Subsequent occurrences - mark as deletable
        deletable.add(client.id);
      }
    });
    
    const duplicates = new Set(
      Array.from(emailCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([email]) => email)
    );
    
    return {
      duplicateEmails: duplicates,
      firstOccurrences: emailFirstId,
      deletableDuplicates: deletable
    };
  }, [clients]);

  const sortedClients = [...filteredClients].sort((a, b) => {
    const aValue = a[sortField] ?? "";
    const bValue = b[sortField] ?? "";
    
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const duplicateClientsToDelete = sortedClients.filter(client => deletableDuplicates.has(client.id));

  // Pagination
  const totalPages = Math.ceil(sortedClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = sortedClients.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const toggleClientSelection = (clientId: string) => {
    if (!deletableDuplicates.has(clientId)) return;
    
    const newSelection = new Set(selectedClients);
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId);
    } else {
      newSelection.add(clientId);
    }
    setSelectedClients(newSelection);
  };

  const toggleAllDuplicates = () => {
    if (selectedClients.size === duplicateClientsToDelete.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(duplicateClientsToDelete.map(c => c.id)));
    }
  };

  const handleSort = (field: "name" | "email" | "contracts_count" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const clientData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
    };

    // Validate the data
    const validation = clientSchema.safeParse(clientData);
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Nieprawidłowe dane";
      toast({
        title: "Błąd walidacji",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }
    
    try {
      await addClientMutation.mutateAsync(clientData);
      
      toast({
        title: "Sukces",
        description: "Klient został dodany pomyślnie.",
      });
      
      setIsDialogOpen(false);
      e.currentTarget.reset();
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: error?.message || "Nie udało się dodać klienta.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteClientMutation.mutateAsync(id);
      toast({
        title: "Sukces",
        description: "Klient został usunięty.",
      });
      setDeleteClientId(null);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć klienta. Sprawdź czy nie ma przypisanych umów.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    const errors: string[] = [];
    let successCount = 0;

    for (const clientId of selectedClients) {
      try {
        await deleteClientMutation.mutateAsync(clientId);
        successCount++;
      } catch (error) {
        errors.push(clientId);
      }
    }

    if (successCount > 0) {
      toast({
        title: "Sukces",
        description: `Usunięto ${successCount} klientów.`,
      });
    }

    if (errors.length > 0) {
      toast({
        title: "Błąd",
        description: `Nie udało się usunąć ${errors.length} klientów. Sprawdź czy nie mają przypisanych umów.`,
        variant: "destructive",
      });
    }

    setSelectedClients(new Set());
    setShowBulkDeleteDialog(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Klienci</h1>
          <p className="text-muted-foreground">Zarządzaj bazą klientów</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-md">
              <Plus className="h-4 w-4" />
              Dodaj klienta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj nowego klienta</DialogTitle>
              <DialogDescription>
                Wypełnij formularz, aby dodać klienta do systemu
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Imię i nazwisko</Label>
                <Input id="name" name="name" placeholder="Jan Kowalski" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="jan@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" placeholder="+48 500 123 456" required />
              </div>
              <Button type="submit" className="w-full">Dodaj klienta</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj klientów..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {duplicateClientsToDelete.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={toggleAllDuplicates}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              {selectedClients.size === duplicateClientsToDelete.length ? "Odznacz" : "Zaznacz"} duplikaty do usunięcia ({duplicateClientsToDelete.length})
            </Button>
            {selectedClients.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowBulkDeleteDialog(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Usuń zaznaczone ({selectedClients.size})
              </Button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sortedClients.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">Nie znaleziono klientów</p>
        </div>
      ) : (
        <>
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
              Pokazywanie {startIndex + 1}-{Math.min(endIndex, sortedClients.length)} z {sortedClients.length} klientów
            </div>
          </div>
          
        <div className="border rounded-lg bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    Imię i nazwisko
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-2">
                    Email
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors text-center"
                  onClick={() => handleSort("contracts_count")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Liczba umów
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center gap-2">
                    Data utworzenia
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client) => {
                const isDuplicate = duplicateEmails.has(client.email);
                const isFirstOccurrence = firstOccurrences.get(client.email) === client.id;
                const isDeletable = deletableDuplicates.has(client.id);
                
                return (
                  <TableRow 
                    key={client.id} 
                    className={`hover:bg-muted/50 transition-colors ${isDuplicate ? 'bg-destructive/5' : ''}`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedClients.has(client.id)}
                        onCheckedChange={() => toggleClientSelection(client.id)}
                        disabled={!isDeletable}
                      />
                    </TableCell>
                    <TableCell 
                      className="font-medium cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        {client.name}
                        {isDuplicate && (
                          <Badge variant={isFirstOccurrence ? "secondary" : "destructive"} className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {isFirstOccurrence ? "Duplikat (zostanie)" : "Duplikat"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell 
                      className="text-muted-foreground cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      {client.email}
                    </TableCell>
                    <TableCell 
                      className="text-muted-foreground cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      {client.phone || "—"}
                    </TableCell>
                    <TableCell 
                      className="text-center cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        {client.contracts_count}
                      </span>
                    </TableCell>
                    <TableCell 
                      className="text-muted-foreground cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      {client.created_at ? format(new Date(client.created_at), 'dd.MM.yyyy HH:mm', { locale: pl }) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/clients/${client.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteClientId(client.id);
                          }}
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
        </div>

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
                // Show first page, last page, current page, and pages around current
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
        </>
      )}

      <AlertDialog open={!!deleteClientId} onOpenChange={() => setDeleteClientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tego klienta?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Wszystkie dane klienta zostaną trwale usunięte.
              Upewnij się, że klient nie ma aktywnych umów.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteClientId && handleDeleteClient(deleteClientId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Czy na pewno chcesz usunąć zaznaczonych klientów?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Zostaną usunięci <strong>{selectedClients.size} klienci</strong>.
              Wszystkie dane klientów zostaną trwale usunięte.
              Klienci z aktywnymi umowami nie zostaną usunięci.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń zaznaczonych ({selectedClients.size})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;
