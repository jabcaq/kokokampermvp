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
                    <PopoverContent className="w-96">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Szczegóły zapytania</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Imię i nazwisko:</span>
                            <p className="text-muted-foreground">{inquiryData.name}</p>
                          </div>
                          <div>
                            <span className="font-medium">Email:</span>
                            <p className="text-muted-foreground">{inquiryData.email}</p>
                          </div>
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
