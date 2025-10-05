import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProtocolWithContract {
  id: string;
  type: 'handover' | 'return';
  contract_id: string;
  mileage: number;
  fuel_level: number;
  photos: string[];
  created_at: string;
  contract_number: string;
  tenant_name: string;
  start_date: string;
  end_date: string;
}

export const useProtocols = () => {
  return useQuery({
    queryKey: ["protocols"],
    queryFn: async () => {
      // Fetch handovers
      const { data: handovers, error: handoversError } = await supabase
        .from("vehicle_handovers")
        .select(`
          id,
          contract_id,
          mileage,
          fuel_level,
          photos,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (handoversError) throw handoversError;

      // Fetch returns - only completed ones
      const { data: returns, error: returnsError } = await supabase
        .from("vehicle_returns")
        .select(`
          id,
          contract_id,
          mileage,
          fuel_level,
          photos,
          created_at
        `)
        .eq('return_completed', true)
        .order('created_at', { ascending: false });

      if (returnsError) throw returnsError;

      // Get all unique contract IDs
      const contractIds = [
        ...new Set([
          ...(handovers?.map(h => h.contract_id) || []),
          ...(returns?.map(r => r.contract_id) || [])
        ])
      ];

      // Fetch contract details
      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select("id, contract_number, tenant_name, start_date, end_date")
        .in("id", contractIds);

      if (contractsError) throw contractsError;

      // Create a map of contracts for easy lookup
      const contractMap = new Map(
        contracts?.map(c => [c.id, c]) || []
      );

      // Combine handovers with contract data
      const handoverProtocols: ProtocolWithContract[] = (handovers || []).map(h => ({
        id: h.id,
        type: 'handover' as const,
        contract_id: h.contract_id,
        mileage: h.mileage,
        fuel_level: h.fuel_level,
        photos: h.photos as string[],
        created_at: h.created_at,
        contract_number: contractMap.get(h.contract_id)?.contract_number || 'N/A',
        tenant_name: contractMap.get(h.contract_id)?.tenant_name || 'N/A',
        start_date: contractMap.get(h.contract_id)?.start_date || '',
        end_date: contractMap.get(h.contract_id)?.end_date || '',
      }));

      // Combine returns with contract data
      const returnProtocols: ProtocolWithContract[] = (returns || []).map(r => ({
        id: r.id,
        type: 'return' as const,
        contract_id: r.contract_id,
        mileage: r.mileage,
        fuel_level: r.fuel_level,
        photos: r.photos as string[],
        created_at: r.created_at,
        contract_number: contractMap.get(r.contract_id)?.contract_number || 'N/A',
        tenant_name: contractMap.get(r.contract_id)?.tenant_name || 'N/A',
        start_date: contractMap.get(r.contract_id)?.start_date || '',
        end_date: contractMap.get(r.contract_id)?.end_date || '',
      }));

      // Combine and sort by date
      const allProtocols = [...handoverProtocols, ...returnProtocols].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return allProtocols;
    },
  });
};
