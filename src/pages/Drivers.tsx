import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

// Mock data - w przyszłości z bazy danych
const contracts = [
  { id: "UM/2024/001", clientName: "Jan Kowalski", vehicle: "Kamper XYZ", driversCount: 1 },
  { id: "UM/2024/002", clientName: "Anna Nowak", vehicle: "Przyczepa ABC", driversCount: 0 },
  { id: "UM/2024/003", clientName: "Piotr Wiśniewski", vehicle: "Kamper 123", driversCount: 2 },
];

const Drivers = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (contractId: string) => {
    const link = `https://app.kokokamper.pl/driver-form/${encodeURIComponent(contractId)}`;
    navigator.clipboard.writeText(link);
    setCopiedId(contractId);
    toast.success("Link skopiowany do schowka!", {
      description: "Możesz teraz wysłać go do kierowcy",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Zgłoszenie kierowców</h1>
        <p className="text-muted-foreground">Generuj linki do formularzy dla kierowców</p>
      </div>

      <div className="grid gap-6">
        {contracts.map((contract) => (
          <Card key={contract.id} className="shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{contract.id}</CardTitle>
                  <CardDescription className="mt-1">
                    Klient: {contract.clientName} • Pojazd: {contract.vehicle}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    {contract.driversCount}/3 kierowców
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => copyLink(contract.id)}
                  className="gap-2"
                  variant={copiedId === contract.id ? "secondary" : "default"}
                >
                  {copiedId === contract.id ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Skopiowano
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Kopiuj link do formularza
                    </>
                  )}
                </Button>
                <div className="flex-1 bg-muted/50 rounded-md px-3 py-2 text-sm text-muted-foreground truncate">
                  <Link2 className="h-4 w-4 inline mr-2" />
                  https://app.kokokamper.pl/driver-form/{encodeURIComponent(contract.id)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-md bg-gradient-subtle border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="font-medium text-foreground">Jak to działa?</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Skopiuj link dla wybranej umowy</li>
              <li>Wyślij link do kierowcy (email, SMS, WhatsApp)</li>
              <li>Kierowca wypełnia formularz ze swoimi danymi</li>
              <li>Dane kierowcy automatycznie przypisują się do umowy</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Drivers;
