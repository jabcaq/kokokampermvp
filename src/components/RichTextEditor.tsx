import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading2, 
  Quote,
  Undo,
  Redo,
  Info,
  Truck
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVehicles } from '@/hooks/useVehicles';
import { useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  inquiryData?: {
    name: string;
    email: string;
    subject?: string;
    message: string;
    created_at?: string;
    vehicle?: string | null;
    competitor_vehicle?: string | null;
    gearbox?: string | null;
    promotion_code?: string | null;
    departure_date?: string | null;
    return_date?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    number_of_people?: number | null;
    tuba_pay_rental?: boolean | null;
    what_to_rent?: string | null;
    travel_companions?: string | null;
    inquiry_type?: string | null;
    flexible_dates?: boolean | null;
    height?: number | null;
    partner_height?: number | null;
    daily_car?: string | null;
    camper_experience?: boolean | null;
    driver_license?: string | null;
    sports_equipment?: string | null;
    number_of_bikes?: number | null;
    number_of_skis?: number | null;
    vacation_type?: string | null;
    vacation_description?: string | null;
    countries?: string | null;
    planned_camping?: string | null;
    meals?: string | null;
    required_equipment?: string | null;
    number_of_fuel_tanks?: number | null;
    camper_layout?: string | null;
    budget_from?: number | null;
    budget_to?: number | null;
    other_notes?: string | null;
  };
}

export const RichTextEditor = ({ content, onChange, placeholder, inquiryData }: RichTextEditorProps) => {
  const { data: vehicles = [] } = useVehicles();
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const handleVehicleSelect = (vehicleId: string) => {
    if (selectedVehicles.includes(vehicleId)) {
      setSelectedVehicles(selectedVehicles.filter(id => id !== vehicleId));
    } else if (selectedVehicles.length < 2) {
      setSelectedVehicles([...selectedVehicles, vehicleId]);
    }
  };

  const insertVehicleInfo = () => {
    const selectedVehicleData = vehicles.filter(v => selectedVehicles.includes(v.id));
    if (selectedVehicleData.length === 0) return;

    let vehicleInfo = '<h3>Informacje o kamperach:</h3><ul>';
    selectedVehicleData.forEach(vehicle => {
      vehicleInfo += `<li><strong>${vehicle.model}</strong> (${vehicle.registration_number})`;
      if (vehicle.brand) vehicleInfo += ` - ${vehicle.brand}`;
      if (vehicle.year) vehicleInfo += `, ${vehicle.year}`;
      if (vehicle.type) vehicleInfo += `, Typ: ${vehicle.type}`;
      if (vehicle.status) vehicleInfo += `, Status: ${vehicle.status}`;
      vehicleInfo += '</li>';
    });
    vehicleInfo += '</ul>';

    editor.chain().focus().insertContent(vehicleInfo).run();
  };

  return (
    <div className="border border-input rounded-md">
      <div className="border-b border-input p-2 flex flex-wrap gap-1 bg-muted/50 justify-between">
        <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-accent' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <div className="border-l border-input mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
        </div>
        
        <div className="flex items-center gap-1">
          {inquiryData && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 max-h-[80vh] overflow-y-auto">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Szczegóły zapytania</h4>
                        <div className="space-y-2 text-sm">
                          {inquiryData.first_name && (
                            <div>
                              <span className="font-medium">Imię:</span>
                              <p className="text-muted-foreground">{inquiryData.first_name}</p>
                            </div>
                          )}
                          {inquiryData.last_name && (
                            <div>
                              <span className="font-medium">Nazwisko:</span>
                              <p className="text-muted-foreground">{inquiryData.last_name}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Email:</span>
                            <p className="text-muted-foreground">{inquiryData.email}</p>
                          </div>
                          {inquiryData.phone && (
                            <div>
                              <span className="font-medium">Numer telefonu:</span>
                              <p className="text-muted-foreground">{inquiryData.phone}</p>
                            </div>
                          )}
                          {inquiryData.subject && (
                            <div>
                              <span className="font-medium">Temat:</span>
                              <p className="text-muted-foreground">{inquiryData.subject}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Wiadomość:</span>
                            <p className="text-muted-foreground">{inquiryData.message}</p>
                          </div>
                          {inquiryData.vehicle && (
                            <div>
                              <span className="font-medium">Pojazd:</span>
                              <p className="text-muted-foreground">{inquiryData.vehicle}</p>
                            </div>
                          )}
                          {inquiryData.competitor_vehicle && (
                            <div>
                              <span className="font-medium">Konkurencyjny pojazd:</span>
                              <p className="text-muted-foreground">{inquiryData.competitor_vehicle}</p>
                            </div>
                          )}
                          {inquiryData.gearbox && (
                            <div>
                              <span className="font-medium">Skrzynia biegów:</span>
                              <p className="text-muted-foreground">{inquiryData.gearbox}</p>
                            </div>
                          )}
                          {inquiryData.promotion_code && (
                            <div>
                              <span className="font-medium">Promocja / kod:</span>
                              <p className="text-muted-foreground">{inquiryData.promotion_code}</p>
                            </div>
                          )}
                          {inquiryData.departure_date && (
                            <div>
                              <span className="font-medium">Data wyjazdu:</span>
                              <p className="text-muted-foreground">{new Date(inquiryData.departure_date).toLocaleDateString('pl-PL')}</p>
                            </div>
                          )}
                          {inquiryData.return_date && (
                            <div>
                              <span className="font-medium">Data powrotu:</span>
                              <p className="text-muted-foreground">{new Date(inquiryData.return_date).toLocaleDateString('pl-PL')}</p>
                            </div>
                          )}
                          {inquiryData.number_of_people && (
                            <div>
                              <span className="font-medium">Ilość osób:</span>
                              <p className="text-muted-foreground">{inquiryData.number_of_people}</p>
                            </div>
                          )}
                          {inquiryData.tuba_pay_rental !== null && inquiryData.tuba_pay_rental !== undefined && (
                            <div>
                              <span className="font-medium">Wynajem na raty Tuba Pay:</span>
                              <p className="text-muted-foreground">{inquiryData.tuba_pay_rental ? 'Tak' : 'Nie'}</p>
                            </div>
                          )}
                          {inquiryData.what_to_rent && (
                            <div>
                              <span className="font-medium">Co chcesz wypożyczyć:</span>
                              <p className="text-muted-foreground">{inquiryData.what_to_rent}</p>
                            </div>
                          )}
                          {inquiryData.travel_companions && (
                            <div>
                              <span className="font-medium">Z kim podróżujesz:</span>
                              <p className="text-muted-foreground">{inquiryData.travel_companions}</p>
                            </div>
                          )}
                          {inquiryData.inquiry_type && (
                            <div>
                              <span className="font-medium">Typ zapytania:</span>
                              <p className="text-muted-foreground">{inquiryData.inquiry_type}</p>
                            </div>
                          )}
                          {inquiryData.flexible_dates !== null && inquiryData.flexible_dates !== undefined && (
                            <div>
                              <span className="font-medium">Czy termin elastyczny:</span>
                              <p className="text-muted-foreground">{inquiryData.flexible_dates ? 'Tak' : 'Nie'}</p>
                            </div>
                          )}
                          {inquiryData.height && (
                            <div>
                              <span className="font-medium">Wzrost (m):</span>
                              <p className="text-muted-foreground">{inquiryData.height}</p>
                            </div>
                          )}
                          {inquiryData.partner_height && (
                            <div>
                              <span className="font-medium">Wzrost partner:</span>
                              <p className="text-muted-foreground">{inquiryData.partner_height}</p>
                            </div>
                          )}
                          {inquiryData.daily_car && (
                            <div>
                              <span className="font-medium">Auto na co dzień:</span>
                              <p className="text-muted-foreground">{inquiryData.daily_car}</p>
                            </div>
                          )}
                          {inquiryData.camper_experience !== null && inquiryData.camper_experience !== undefined && (
                            <div>
                              <span className="font-medium">Czy prowadzileś kampera:</span>
                              <p className="text-muted-foreground">{inquiryData.camper_experience ? 'Tak' : 'Nie'}</p>
                            </div>
                          )}
                          {inquiryData.driver_license && (
                            <div>
                              <span className="font-medium">Prawo jazdy:</span>
                              <p className="text-muted-foreground">{inquiryData.driver_license}</p>
                            </div>
                          )}
                          {inquiryData.sports_equipment && (
                            <div>
                              <span className="font-medium">Sprzęt sportowy:</span>
                              <p className="text-muted-foreground">{inquiryData.sports_equipment}</p>
                            </div>
                          )}
                          {inquiryData.number_of_bikes && (
                            <div>
                              <span className="font-medium">Liczba rowerów:</span>
                              <p className="text-muted-foreground">{inquiryData.number_of_bikes}</p>
                            </div>
                          )}
                          {inquiryData.number_of_skis && (
                            <div>
                              <span className="font-medium">Liczba nart:</span>
                              <p className="text-muted-foreground">{inquiryData.number_of_skis}</p>
                            </div>
                          )}
                          {inquiryData.vacation_type && (
                            <div>
                              <span className="font-medium">Typ wakacji:</span>
                              <p className="text-muted-foreground">{inquiryData.vacation_type}</p>
                            </div>
                          )}
                          {inquiryData.vacation_description && (
                            <div>
                              <span className="font-medium">Opis wakacji:</span>
                              <p className="text-muted-foreground">{inquiryData.vacation_description}</p>
                            </div>
                          )}
                          {inquiryData.countries && (
                            <div>
                              <span className="font-medium">Kraje:</span>
                              <p className="text-muted-foreground">{inquiryData.countries}</p>
                            </div>
                          )}
                          {inquiryData.planned_camping && (
                            <div>
                              <span className="font-medium">Planowany kemping:</span>
                              <p className="text-muted-foreground">{inquiryData.planned_camping}</p>
                            </div>
                          )}
                          {inquiryData.meals && (
                            <div>
                              <span className="font-medium">Posiłki:</span>
                              <p className="text-muted-foreground">{inquiryData.meals}</p>
                            </div>
                          )}
                          {inquiryData.required_equipment && (
                            <div>
                              <span className="font-medium">Potrzebne wyposażenie:</span>
                              <p className="text-muted-foreground">{inquiryData.required_equipment}</p>
                            </div>
                          )}
                          {inquiryData.number_of_fuel_tanks && (
                            <div>
                              <span className="font-medium">Liczba paliw6w:</span>
                              <p className="text-muted-foreground">{inquiryData.number_of_fuel_tanks}</p>
                            </div>
                          )}
                          {inquiryData.camper_layout && (
                            <div>
                              <span className="font-medium">Układ kampera:</span>
                              <p className="text-muted-foreground">{inquiryData.camper_layout}</p>
                            </div>
                          )}
                          {inquiryData.budget_from && (
                            <div>
                              <span className="font-medium">Budżet od:</span>
                              <p className="text-muted-foreground">{inquiryData.budget_from} zł</p>
                            </div>
                          )}
                          {inquiryData.budget_to && (
                            <div>
                              <span className="font-medium">Budżet do:</span>
                              <p className="text-muted-foreground">{inquiryData.budget_to} zł</p>
                            </div>
                          )}
                          {inquiryData.other_notes && (
                            <div>
                              <span className="font-medium">Inne uwagi:</span>
                              <p className="text-muted-foreground">{inquiryData.other_notes}</p>
                            </div>
                          )}
                          {inquiryData.created_at && (
                            <div>
                              <span className="font-medium">Data:</span>
                              <p className="text-muted-foreground">{new Date(inquiryData.created_at).toLocaleString('pl-PL')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Informacje o zapytaniu</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
              >
                <Truck className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Wybierz kampery (max 2)</h4>
                <div className="space-y-2">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className={`p-2 rounded border cursor-pointer transition-colors ${
                        selectedVehicles.includes(vehicle.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-input hover:border-primary/50'
                      }`}
                      onClick={() => handleVehicleSelect(vehicle.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{vehicle.model}</p>
                          <p className="text-xs text-muted-foreground">{vehicle.registration_number}</p>
                        </div>
                        {selectedVehicles.includes(vehicle.id) && (
                          <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={insertVehicleInfo}
                  disabled={selectedVehicles.length === 0}
                  className="w-full"
                  size="sm"
                >
                  Wstaw do notatki
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <EditorContent editor={editor} className="bg-background" />
    </div>
  );
};
