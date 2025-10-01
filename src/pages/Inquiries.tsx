import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Inbox, Trash2, Reply, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Inquiry {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: "new" | "replied" | "closed";
}

interface EmailHistory {
  id: number;
  type: "sent" | "received";
  from: string;
  to: string;
  subject: string;
  message: string;
  date: string;
}

const mockInquiries: Inquiry[] = [
  {
    id: 1,
    name: "Jan Kowalski",
    email: "jan.kowalski@example.com",
    subject: "Pytanie o wynajem kampera",
    message: "Dzień dobry, interesuje mnie wynajem kampera na lipiec. Czy są dostępne terminy?",
    date: "2024-01-15 10:30",
    status: "new",
  },
  {
    id: 2,
    name: "Anna Nowak",
    email: "anna.nowak@example.com",
    subject: "Przedłużenie umowy",
    message: "Witam, chciałabym przedłużyć obecną umowę najmu o kolejny tydzień.",
    date: "2024-01-14 15:20",
    status: "replied",
  },
];

const mockEmailHistory: EmailHistory[] = [
  {
    id: 1,
    type: "received",
    from: "jan.kowalski@example.com",
    to: "biuro@rentcamper.pl",
    subject: "Pytanie o wynajem kampera",
    message: "Dzień dobry, interesuje mnie wynajem kampera na lipiec. Czy są dostępne terminy?",
    date: "2024-01-15 10:30",
  },
  {
    id: 2,
    type: "sent",
    from: "biuro@rentcamper.pl",
    to: "anna.nowak@example.com",
    subject: "Re: Przedłużenie umowy",
    message: "Dzień dobry, oczywiście możemy przedłużyć umowę. Proszę o kontakt telefoniczny.",
    date: "2024-01-14 16:45",
  },
];

const Inquiries = () => {
  const [inquiries] = useState<Inquiry[]>(mockInquiries);
  const [emailHistory] = useState<EmailHistory[]>(mockEmailHistory);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      new: { variant: "default", label: "Nowe" },
      replied: { variant: "secondary", label: "Odpowiedziano" },
      closed: { variant: "outline", label: "Zamknięte" },
    };
    const config = variants[status] || variants.new;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSendReply = () => {
    console.log("Wysyłanie odpowiedzi:", {
      to: selectedInquiry?.email,
      message: replyMessage,
    });
    setReplyMessage("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Zapytania
        </h1>
        <p className="text-muted-foreground mt-2">
          Zarządzaj zapytaniami z formularzy kontaktowych
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista zapytań */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Przychodzące zapytania
            </CardTitle>
            <CardDescription>
              {inquiries.filter(i => i.status === "new").length} nowych zapytań
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {inquiries.map((inquiry) => (
                  <Card
                    key={inquiry.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedInquiry?.id === inquiry.id ? "border-primary shadow-md" : ""
                    }`}
                    onClick={() => setSelectedInquiry(inquiry)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{inquiry.name}</p>
                          <p className="text-xs text-muted-foreground">{inquiry.email}</p>
                        </div>
                        {getStatusBadge(inquiry.status)}
                      </div>
                      <p className="font-medium text-sm mb-1">{inquiry.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{inquiry.message}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {inquiry.date}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Edytor odpowiedzi */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5" />
              Edytor odpowiedzi
            </CardTitle>
            <CardDescription>
              {selectedInquiry ? `Odpowiedz na: ${selectedInquiry.subject}` : "Wybierz zapytanie"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedInquiry ? (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{selectedInquiry.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedInquiry.email}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedInquiry.date}</p>
                  </div>
                  <Separator className="my-2" />
                  <div>
                    <p className="font-medium text-sm mb-1">{selectedInquiry.subject}</p>
                    <p className="text-sm">{selectedInquiry.message}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Twoja odpowiedź</label>
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Napisz odpowiedź..."
                    className="min-h-[300px]"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setReplyMessage("")}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Wyczyść
                  </Button>
                  <Button onClick={handleSendReply} disabled={!replyMessage.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Wyślij odpowiedź
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Wybierz zapytanie z listy, aby odpowiedzieć</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historia maili */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Historia komunikacji
          </CardTitle>
          <CardDescription>Wysłane i otrzymane wiadomości</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {emailHistory.map((email) => (
                <Card key={email.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={email.type === "sent" ? "secondary" : "default"}>
                          {email.type === "sent" ? "Wysłane" : "Otrzymane"}
                        </Badge>
                        <div className="text-sm">
                          <span className="font-medium">Od:</span> {email.from}
                          <span className="mx-2">→</span>
                          <span className="font-medium">Do:</span> {email.to}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{email.date}</p>
                    </div>
                    <p className="font-medium text-sm mb-2">{email.subject}</p>
                    <p className="text-sm text-muted-foreground">{email.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inquiries;
