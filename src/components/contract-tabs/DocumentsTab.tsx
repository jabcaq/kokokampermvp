import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { format } from "date-fns";

interface DocumentsTabProps {
  contractId: string;
}

export const DocumentsTab = ({ contractId }: DocumentsTabProps) => {
  const { data: documents = [], isLoading } = useDocuments();

  // Filter documents by contract_id
  const contractDocuments = documents.filter(doc => doc.contract_id === contractId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (contractDocuments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Brak dokumentów przypisanych do tej umowy</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Dokumenty umowy ({contractDocuments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rodzaj</TableHead>
                <TableHead>Nazwa pliku</TableHead>
                <TableHead>Folder</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Rok</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Badge variant="outline">{doc.rodzaj}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{doc.nazwa_pliku}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.folder || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.data ? format(new Date(doc.data), 'dd.MM.yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.rok || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {doc.link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={doc.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {doc.folder_link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={doc.folder_link} target="_blank" rel="noopener noreferrer">
                            Folder
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
