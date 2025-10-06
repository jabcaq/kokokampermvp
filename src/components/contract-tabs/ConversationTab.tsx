import { Card, CardContent } from "@/components/ui/card";
import { useInquiryMessages } from "@/hooks/useInquiryMessages";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { MessageCircle, User, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConversationTabProps {
  inquiryId: string | null;
}

export const ConversationTab = ({ inquiryId }: ConversationTabProps) => {
  const { data: messages, isLoading } = useInquiryMessages(inquiryId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Ładowanie konwersacji...</p>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Brak konwersacji z klientem.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Historia konwersacji</h3>
        <Badge variant="secondary">{messages.length} wiadomości</Badge>
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <Card
            key={message.id}
            className={
              message.sender_type === 'customer'
                ? 'border-l-4 border-l-blue-500'
                : 'border-l-4 border-l-green-500'
            }
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {message.sender_type === 'customer' ? (
                    <User className="h-4 w-4 text-blue-500" />
                  ) : (
                    <UserCog className="h-4 w-4 text-green-500" />
                  )}
                  <span className="font-semibold">
                    {message.sender_type === 'customer' ? 'Klient' : 'Administrator'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(message.created_at), 'dd MMM yyyy, HH:mm', { locale: pl })}
                </span>
              </div>
              <div
                className="prose prose-sm max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: message.message }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
