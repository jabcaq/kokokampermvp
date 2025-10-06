import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateReturnBooking } from "@/hooks/useReturnBookings";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Loader2, CheckCircle2, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MyReturns() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const updateBooking = useUpdateReturnBooking();

  const { data: myReturns, isLoading } = useQuery({
    queryKey: ["my_returns", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("vehicle_returns")
        .select(`
          *,
          contracts (
            contract_number,
            tenant_name,
            vehicle_model,
            registration_number
          )
        `)
        .eq("assigned_employee_id", user.id)
        .not("scheduled_return_date", "is", null)
        .order("scheduled_return_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleConfirm = (returnId: string) => {
    updateBooking.mutate({
      id: returnId,
      return_confirmed: true,
    });
  };

  const handleComplete = (returnId: string) => {
    updateBooking.mutate({
      id: returnId,
      return_completed: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const upcomingReturns = myReturns?.filter(r => !r.return_completed) || [];
  const completedReturns = myReturns?.filter(r => r.return_completed) || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Moje zwroty</h1>
          <p className="text-muted-foreground">
            Przypisane do mnie zwroty kamperów
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nadchodzące</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingReturns.length}</div>
            <Badge variant="outline" className="mt-2">Do realizacji</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Zakończone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedReturns.length}</div>
            <Badge variant="secondary" className="mt-2">Zrealizowane</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nadchodzące zwroty</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingReturns.length > 0 ? (
            <div className="space-y-4">
              {upcomingReturns.map((returnItem: any) => (
                <div
                  key={returnItem.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">
                        {returnItem.contracts?.contract_number || "Brak numeru"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {returnItem.contracts?.tenant_name}
                      </p>
                      <p className="text-sm">
                        {returnItem.contracts?.vehicle_model} ({returnItem.contracts?.registration_number})
                      </p>
                    </div>
                    <Badge variant={returnItem.return_confirmed ? "default" : "outline"}>
                      {returnItem.return_confirmed ? "Potwierdzona" : "Nowa"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(returnItem.scheduled_return_date), "d MMMM yyyy", { locale: pl })}
                        {" o "}
                        {returnItem.scheduled_return_time}
                      </span>
                    </div>
                  </div>

                  {returnItem.booking_notes && (
                    <p className="text-sm text-muted-foreground border-l-2 pl-3">
                      {returnItem.booking_notes}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {!returnItem.return_confirmed && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(returnItem.id)}
                        disabled={updateBooking.isPending}
                      >
                        Potwierdź
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/contracts/${returnItem.contract_id}`)}
                    >
                      Zobacz umowę
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleComplete(returnItem.id)}
                      disabled={updateBooking.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Zakończ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nie masz nadchodzących zwrotów
            </p>
          )}
        </CardContent>
      </Card>

      {completedReturns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Zakończone zwroty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedReturns.map((returnItem: any) => (
                <div
                  key={returnItem.id}
                  className="flex items-center justify-between p-3 border rounded-lg opacity-60"
                >
                  <div>
                    <p className="font-medium">{returnItem.contracts?.contract_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(returnItem.scheduled_return_date), "d MMMM yyyy", { locale: pl })}
                    </p>
                  </div>
                  <Badge variant="secondary">Zakończona</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
