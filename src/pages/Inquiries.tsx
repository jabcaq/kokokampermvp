import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Inbox, Trash2, Reply, Clock, Loader2, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useInquiries, useUpdateInquiryStatus } from "@/hooks/useInquiries";
import { useCreateNotification } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useInquiryMessages, useAddInquiryMessage } from "@/hooks/useInquiryMessages";
import { CreateContractFromInquiryDialog } from "@/components/CreateContractFromInquiryDialog";

const Inquiries = () => {
  const { data: inquiries = [], isLoading } = useInquiries();
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
        inquiryNumber: selectedInquiry.inquiry_number,
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

      // Send all data to Make.com webhook for AI training
      try {
        await fetch('https://hook.eu2.make.com/xtmpyhgk5ls5gslzwr2x6qclmte23zvv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'no-cors',
          body: JSON.stringify({
            inquiry: selectedInquiry,
            admin_response: replyMessage,
            conversation_history: messages,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      }
      
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

      {/* Mobile Layout */}
      <div className="flex flex-col lg:hidden gap-4 h-[calc(100vh-12rem)]">
        <Card className="flex flex-col overflow-hidden max-h-[40vh]">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Przychodzące zapytania
            </CardTitle>
            <CardDescription>
              {inquiries.filter(i => i.status === "new").length} nowych zapytań
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ScrollArea className="h-full pr-4">
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
                            {inquiry.inquiry_number && (
                              <p className="text-xs font-mono text-primary mt-1">{inquiry.inquiry_number}</p>
                            )}
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

        {selectedInquiry && (
          <Card className="flex flex-col overflow-hidden flex-1">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Reply className="h-5 w-5" />
                Edytor odpowiedzi
              </CardTitle>
              <CardDescription>
                {selectedInquiry.inquiry_number && <span className="font-mono">{selectedInquiry.inquiry_number} - </span>}
                {selectedInquiry.subject || 'Bez tematu'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{selectedInquiry.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedInquiry.email}</p>
                        {selectedInquiry.inquiry_number && (
                          <p className="text-xs font-mono text-primary mt-1">{selectedInquiry.inquiry_number}</p>
                        )}
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

                {messages.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Historia konwersacji</label>
                    <ScrollArea className="max-h-[200px] border rounded-lg p-4">
                      <div className="space-y-3">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg ${
                              msg.sender_type === 'admin' 
                                ? 'bg-primary/10' 
                                : 'bg-muted'
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

                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setIsDialogOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Utwórz klienta i umowę
                  </Button>
                  <Button variant="outline" onClick={() => setReplyMessage("")} className="w-full sm:w-auto">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Wyczyść
                  </Button>
                  <Button onClick={handleSendReply} disabled={!replyMessage.trim()} className="w-full sm:w-auto">
                    <Send className="h-4 w-4 mr-2" />
                    Wyślij odpowiedź
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Layout */}
      <ResizablePanelGroup direction="horizontal" className="hidden lg:flex gap-6 h-[calc(100vh-12rem)]">
        {/* Lista zapytań */}
        <ResizablePanel defaultSize={25} minSize={20}>
        <Card className="flex flex-col overflow-hidden h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Przychodzące zapytania
            </CardTitle>
            <CardDescription>
              {inquiries.filter(i => i.status === "new").length} nowych zapytań
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden min-h-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-3 pr-4">
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
                            {inquiry.inquiry_number && (
                              <p className="text-xs font-mono text-primary mt-1">{inquiry.inquiry_number}</p>
                            )}
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
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Edytor odpowiedzi */}
        <ResizablePanel defaultSize={40} minSize={30}>
        <Card className="flex flex-col overflow-hidden h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5" />
              Edytor odpowiedzi
            </CardTitle>
            <CardDescription>
              {selectedInquiry ? (
                <span>
                  {selectedInquiry.inquiry_number && <span className="font-mono">{selectedInquiry.inquiry_number} - </span>}
                  {selectedInquiry.subject || 'Bez tematu'}
                </span>
              ) : "Wybierz zapytanie"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden min-h-0">
            {selectedInquiry ? (
              <div className="flex flex-col h-full gap-4 overflow-hidden">
                <div className="bg-muted p-4 rounded-lg space-y-2 flex-shrink-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{selectedInquiry.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedInquiry.email}</p>
                        {selectedInquiry.inquiry_number && (
                          <p className="text-xs font-mono text-primary mt-1">{selectedInquiry.inquiry_number}</p>
                        )}
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

                <div className="flex-1 flex flex-col gap-2 min-h-0">
                  <label className="text-sm font-medium flex-shrink-0">Twoja odpowiedź</label>
                  <div className="flex-1 min-h-0">
                    <RichTextEditor
                      content={replyMessage}
                      onChange={setReplyMessage}
                      placeholder="Napisz odpowiedź..."
                      inquiryData={selectedInquiry}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end flex-shrink-0">
                  <Button
                    variant="secondary"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Utwórz klienta i umowę
                  </Button>
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
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Historia konwersacji */}
        <ResizablePanel defaultSize={35} minSize={25}>
        <Card className="flex flex-col overflow-hidden h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Historia konwersacji
            </CardTitle>
            <CardDescription>
              {selectedInquiry ? `${messages.length} wiadomości` : "Wybierz zapytanie"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden min-h-0">
            {selectedInquiry && messages.length > 0 ? (
              <ScrollArea className="h-full">
                <div className="space-y-3 pr-4">
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
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Brak historii konwersacji</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </ResizablePanel>
      </ResizablePanelGroup>

      <CreateContractFromInquiryDialog
        inquiry={selectedInquiry}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          setSelectedInquiry(null);
          setReplyMessage("");
        }}
      />
    </div>
  );
};

export default Inquiries;
