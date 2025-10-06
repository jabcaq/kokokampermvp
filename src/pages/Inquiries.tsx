import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Inbox, Trash2, Reply, Clock, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useInquiries, useUpdateInquiryStatus } from "@/hooks/useInquiries";
import { useCreateNotification } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useInquiryMessages, useAddInquiryMessage } from "@/hooks/useInquiryMessages";

const Inquiries = () => {
  const { data: inquiries = [], isLoading } = useInquiries();
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const { toast } = useToast();
  const updateStatusMutation = useUpdateInquiryStatus();
  const createNotificationMutation = useCreateNotification();
  const { data: messages = [] } = useInquiryMessages(selectedInquiry?.id);
  const addMessageMutation = useAddInquiryMessage();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      new: { variant: "default", label: "Nowe" },
      in_progress: { variant: "secondary", label: "W trakcie" },
      completed: { variant: "outline", label: "Zakończone" },
      archived: { variant: "outline", label: "Zarchiwizowane" },
    };
    const config = variants[status] || variants.new;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSendReply = async () => {
    if (!selectedInquiry || !replyMessage.trim()) return;
    
    try {
      // Save message to inquiry_messages
      await addMessageMutation.mutateAsync({
        inquiryId: selectedInquiry.id,
        message: replyMessage,
        senderType: 'admin',
      });
      
      // Update inquiry status
      await updateStatusMutation.mutateAsync({
        id: selectedInquiry.id,
        status: 'in_progress',
      });
      
      // Create notification for inquiry response
      await createNotificationMutation.mutateAsync({
        type: 'inquiry_response',
        title: 'Udzielono odpowiedzi na zapytanie',
        message: `Odpowiedziano na zapytanie od ${selectedInquiry.name}: ${selectedInquiry.subject || 'Bez tematu'}`,
        link: `/inquiries`,
      });
      
      setReplyMessage("");
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się wysłać odpowiedzi.",
        variant: "destructive",
      });
    }
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
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
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
                        <p className="font-medium text-sm mb-1">{inquiry.subject || 'Bez tematu'}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{inquiry.message}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {inquiry.created_at ? format(new Date(inquiry.created_at), 'dd.MM.yyyy HH:mm') : 'Brak daty'}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
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
                      <p className="text-xs text-muted-foreground">
                        {selectedInquiry.created_at ? format(new Date(selectedInquiry.created_at), 'dd.MM.yyyy HH:mm') : 'Brak daty'}
                      </p>
                    </div>
                    <Separator className="my-2" />
                    <div>
                      <p className="font-medium text-sm mb-1">{selectedInquiry.subject || 'Bez tematu'}</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedInquiry.message}</p>
                    </div>
                </div>

                {/* Historia konwersacji */}
                {messages.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Historia konwersacji</label>
                    <ScrollArea className="h-[300px] border rounded-lg p-4">
                      <div className="space-y-3">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg ${
                              msg.sender_type === 'admin' 
                                ? 'bg-primary/10 ml-8' 
                                : 'bg-muted mr-8'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-xs font-medium">
                                {msg.sender_type === 'admin' ? 'Administrator' : selectedInquiry.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(msg.created_at), 'dd.MM.yyyy HH:mm')}
                              </p>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Twoja odpowiedź</label>
                  <RichTextEditor
                    content={replyMessage}
                    onChange={setReplyMessage}
                    placeholder="Napisz odpowiedź..."
                    inquiryData={selectedInquiry}
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
    </div>
  );
};

export default Inquiries;
