import { useProtocols } from "@/hooks/useProtocols";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { FileCheck, FileX, Calendar, User, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Protocols = () => {
  const { data: protocols, isLoading } = useProtocols();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Protokoły</h1>
          <p className="text-muted-foreground">
            Wszystkie protokoły wydań i zwrotów pojazdów
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-48 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Protokoły</h1>
        <p className="text-muted-foreground">
          Wszystkie protokoły wydań i zwrotów pojazdów
        </p>
      </div>

      {protocols && protocols.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Brak protokołów do wyświetlenia
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {protocols?.map((protocol) => {
            const firstPhoto = protocol.photos && protocol.photos.length > 0 
              ? protocol.photos[0] 
              : null;
            
            const isHandover = protocol.type === 'handover';
            const formUrl = isHandover 
              ? `/vehicle-handover?contractId=${protocol.contract_id}&contractNumber=${encodeURIComponent(protocol.contract_number)}&tenantName=${encodeURIComponent(protocol.tenant_name)}&startDate=${protocol.start_date}&endDate=${protocol.end_date}`
              : `/vehicle-return?contractId=${protocol.contract_id}&contractNumber=${encodeURIComponent(protocol.contract_number)}&tenantName=${encodeURIComponent(protocol.tenant_name)}&startDate=${protocol.start_date}&endDate=${protocol.end_date}`;

            return (
              <Card
                key={`${protocol.type}-${protocol.id}`}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(formUrl)}
              >
                <CardHeader className="p-0">
                  {firstPhoto ? (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={firstPhoto}
                        alt="Zdjęcie pojazdu"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={isHandover ? "default" : "secondary"}
                          className="shadow-lg"
                        >
                          {isHandover ? (
                            <>
                              <FileCheck className="h-3 w-3 mr-1" />
                              Wydanie
                            </>
                          ) : (
                            <>
                              <FileX className="h-3 w-3 mr-1" />
                              Zwrot
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-muted flex items-center justify-center">
                      {isHandover ? (
                        <FileCheck className="h-16 w-16 text-muted-foreground" />
                      ) : (
                        <FileX className="h-16 w-16 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <CardTitle className="text-lg mb-1">
                      Umowa {protocol.contract_number}
                    </CardTitle>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{protocol.tenant_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {protocol.start_date && format(new Date(protocol.start_date), "dd MMM yyyy", { locale: pl })}
                          {" - "}
                          {protocol.end_date && format(new Date(protocol.end_date), "dd MMM yyyy", { locale: pl })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>
                          Protokół: {format(new Date(protocol.created_at), "dd MMM yyyy, HH:mm", { locale: pl })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {protocol.photos?.length || 0} zdjęć
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {protocol.mileage} km | {protocol.fuel_level}% paliwa
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Protocols;
