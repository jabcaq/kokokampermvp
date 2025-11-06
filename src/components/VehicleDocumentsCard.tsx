import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  useVehicleDocuments,
  useAddVehicleDocument,
  useDeleteVehicleDocument,
} from "@/hooks/useVehicleDocuments";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VehicleDocumentsCardProps {
  vehicleId: string;
}

const documentTypes = {
  oc: "Polisa OC",
  green_card: "Zielona Karta",
  inspection: "Przegląd techniczny",
  registration: "Dowód rejestracyjny",
  other: "Inny",
};

export const VehicleDocumentsCard = ({ vehicleId }: VehicleDocumentsCardProps) => {
  const { data: documents = [] } = useVehicleDocuments(vehicleId);
  const addDocument = useAddVehicleDocument();
  const deleteDocument = useDeleteVehicleDocument();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    document_type: "oc",
    file_name: "",
    issue_date: "",
    expiry_date: "",
    notes: "",
    document_number: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error("Proszę wybrać plik");
      return;
    }

    // Validate required dates for OC and inspection
    if ((formData.document_type === "oc" || formData.document_type === "inspection") && !formData.expiry_date) {
      toast.error("Data wygaśnięcia jest wymagana dla tego typu dokumentu");
      return;
    }

    // Validate document number for OC and registration
    if ((formData.document_type === "oc" || formData.document_type === "registration") && !formData.document_number) {
      toast.error(formData.document_type === "oc" ? "Numer polisy jest wymagany" : "Numer dowodu rejestracyjnego jest wymagany");
      return;
    }

    setUploading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${vehicleId}/${Date.now()}_${formData.document_type}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-documents')
        .getPublicUrl(fileName);

      // Save document metadata to database
      await addDocument.mutateAsync({
        vehicle_id: vehicleId,
        document_type: formData.document_type,
        file_name: selectedFile.name,
        file_url: publicUrl,
        issue_date: formData.issue_date || undefined,
        expiry_date: formData.expiry_date || undefined,
        notes: formData.notes || undefined,
        document_number: formData.document_number || undefined,
      });

      // Update vehicle data based on document type
      const vehicleUpdates: any = {};
      
      if (formData.document_type === "oc") {
        vehicleUpdates.insurance_valid_until = formData.expiry_date;
        vehicleUpdates.insurance_policy_number = formData.document_number;
      } else if (formData.document_type === "inspection") {
        vehicleUpdates.next_inspection_date = formData.expiry_date;
      } else if (formData.document_type === "registration") {
        vehicleUpdates.registration_certificate_number = formData.document_number;
      }

      // Update vehicle if there are changes
      if (Object.keys(vehicleUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from('vehicles')
          .update(vehicleUpdates)
          .eq('id', vehicleId);

        if (updateError) throw updateError;
      }

      toast.success("Dokument został dodany, a dane pojazdu zaktualizowane");

      setFormData({
        document_type: "oc",
        file_name: "",
        issue_date: "",
        expiry_date: "",
        notes: "",
        document_number: "",
      });
      setSelectedFile(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Nie udało się przesłać pliku");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten dokument?")) {
      await deleteDocument.mutateAsync({ id, vehicleId });
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Dokumenty pojazdu</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj dokument
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Dodaj nowy dokument</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Typ dokumentu</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentTypes).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Plik dokumentu *</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      // Auto-fill file name if empty
                      if (!formData.file_name) {
                        setFormData({ ...formData, file_name: file.name });
                      }
                    }
                  }}
                  required
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Wybrany plik: {selectedFile.name}
                  </p>
                )}
              </div>

              {(formData.document_type === "oc" || formData.document_type === "registration") && (
                <div className="space-y-2">
                  <Label>
                    {formData.document_type === "oc" ? "Numer polisy" : "Numer dowodu rejestracyjnego"} *
                  </Label>
                  <Input
                    type="text"
                    value={formData.document_number}
                    onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                    placeholder={formData.document_type === "oc" ? "Wpisz numer polisy" : "Wpisz numer dowodu"}
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data wystawienia</Label>
                  <Input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Data wygaśnięcia
                    {(formData.document_type === "oc" || formData.document_type === "inspection") && " *"}
                  </Label>
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    required={formData.document_type === "oc" || formData.document_type === "inspection"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notatki</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Dodatkowe informacje..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button type="submit" disabled={uploading || addDocument.isPending}>
                  {uploading ? "Przesyłanie..." : "Dodaj"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Brak dokumentów dla tego pojazdu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Nazwa pliku</TableHead>
                  <TableHead>Data wygaśnięcia</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const expiryDate = doc.expiry_date ? new Date(doc.expiry_date) : null;
                  const isExpired = expiryDate && expiryDate < new Date();
                  
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {documentTypes[doc.document_type as keyof typeof documentTypes] || doc.document_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.file_url ? (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            {doc.file_name}
                          </a>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {doc.file_name}
                          </span>
                        )}
                        {doc.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{doc.notes}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {expiryDate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className={isExpired ? "text-destructive font-medium" : ""}>
                              {format(expiryDate, "dd.MM.yyyy", { locale: pl })}
                            </span>
                            {isExpired && (
                              <Badge variant="destructive" className="text-xs">
                                Wygasł
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
