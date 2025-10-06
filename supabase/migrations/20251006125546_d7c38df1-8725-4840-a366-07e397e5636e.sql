-- Create inquiry_messages table for conversation history
CREATE TABLE public.inquiry_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inquiry_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to inquiry_messages" 
ON public.inquiry_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to inquiry_messages" 
ON public.inquiry_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to inquiry_messages" 
ON public.inquiry_messages 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to inquiry_messages" 
ON public.inquiry_messages 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_inquiry_messages_updated_at
BEFORE UPDATE ON public.inquiry_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_inquiry_messages_inquiry_id ON public.inquiry_messages(inquiry_id);
CREATE INDEX idx_inquiry_messages_created_at ON public.inquiry_messages(created_at);