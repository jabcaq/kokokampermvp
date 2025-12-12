import { z } from "zod";

// Polish phone number regex (9-15 digits, optional + prefix)
const phoneRegex = /^\+?[0-9]{9,15}$/;

// Email regex
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// PESEL regex (11 digits)
const peselRegex = /^[0-9]{11}$/;

// NIP regex (10 digits)
const nipRegex = /^[0-9]{10}$/;

export const contractSchema = z.object({
  contract_number: z.string().min(1, "Numer umowy jest wymagany").max(50),
  invoice_type: z.enum(['receipt', 'invoice']).default('receipt').optional(),
  tenant_company_name: z.string().max(200).optional().or(z.literal("")),
  tenant_name: z.string().min(1, "Nazwa najemcy jest wymagana").max(200),
  tenant_email: z.string()
    .regex(emailRegex, "Nieprawidłowy format adresu email")
    .max(255)
    .optional()
    .or(z.literal("")),
  tenant_phone: z.string()
    .regex(phoneRegex, "Nieprawidłowy format numeru telefonu")
    .optional()
    .or(z.literal("")),
  tenant_pesel: z.string()
    .regex(peselRegex, "PESEL musi składać się z 11 cyfr")
    .optional()
    .or(z.literal("")),
  tenant_nip: z.string()
    .regex(nipRegex, "NIP musi składać się z 10 cyfr")
    .optional()
    .or(z.literal("")),
  start_date: z.string().min(1, "Data rozpoczęcia jest wymagana"),
  end_date: z.string().min(1, "Data zakończenia jest wymagana"),
  value: z.number().positive("Wartość musi być większa od 0").optional(),
  vehicle_model: z.string().min(1, "Model pojazdu jest wymagany").max(200),
  registration_number: z.string().min(1, "Numer rejestracyjny jest wymagany").max(50),
  notes: z.string().max(5000, "Uwagi nie mogą przekraczać 5000 znaków").optional(),
  has_trailer: z.boolean().optional(),
  trailer_mass: z.number().positive("Masa przyczepy musi być większa od 0").optional(),
  vehicle_f1_mass: z.number().positive("Masa F1 musi być większa od 0").optional(),
  vehicle_o1_mass: z.number().positive("Masa O1 musi być większa od 0").optional(),
  tenant_trailer_license_category: z.enum(['B', 'B96', 'B+E']).optional(),
})
.refine(
  (data) => {
    // If invoice is selected, company name is required
    if (data.invoice_type === 'invoice') {
      return !!data.tenant_company_name && data.tenant_company_name.trim().length > 0;
    }
    return true;
  },
  {
    message: "Nazwa firmy jest wymagana dla faktury",
    path: ["tenant_company_name"],
  }
)
.refine(
  (data) => {
    // If invoice is selected, NIP is required and must be valid
    if (data.invoice_type === 'invoice') {
      return !!data.tenant_nip && nipRegex.test(data.tenant_nip);
    }
    return true;
  },
  {
    message: "NIP jest wymagany dla faktury i musi mieć 10 cyfr",
    path: ["tenant_nip"],
  }
)
.refine(
  (data) => {
    if (!data.start_date || !data.end_date) return true;
    return new Date(data.end_date) > new Date(data.start_date);
  },
  { 
    message: "Data zakończenia musi być późniejsza niż data rozpoczęcia",
    path: ["end_date"]
  }
)
.refine(
  (data) => {
    // If has_trailer is true, validate trailer license category and masses
    if (data.has_trailer) {
      if (!data.tenant_trailer_license_category) {
        return false;
      }
      if (!data.trailer_mass || !data.vehicle_f1_mass || !data.vehicle_o1_mass) {
        return false;
      }
      
      const category = data.tenant_trailer_license_category;
      const f1 = data.vehicle_f1_mass;
      const trailerMass = data.trailer_mass;
      const o1 = data.vehicle_o1_mass;
      
      // Check if trailer mass exceeds O1 value
      if (trailerMass > o1) {
        return false;
      }
      
      // Check category-specific limits
      if (category === 'B' || category === 'B+E') {
        if (f1 + trailerMass > 3500) {
          return false;
        }
      } else if (category === 'B96') {
        if (f1 + trailerMass > 4250) {
          return false;
        }
      }
    }
    return true;
  },
  {
    message: "Nieprawidłowa konfiguracja przyczepy - sprawdź kategorię prawa jazdy i masy pojazdu",
    path: ["tenant_trailer_license_category"]
  }
);

export const clientSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(200),
  email: z.string().regex(emailRegex, "Nieprawidłowy format adresu email").max(255),
  phone: z.string().max(50).optional().or(z.literal("")).nullable(),
});

export const inquirySchema = z.object({
  name: z.string().min(1, "Imię i nazwisko jest wymagane").max(200),
  email: z.string().regex(emailRegex, "Nieprawidłowy format adresu email").max(255),
  message: z.string().min(1, "Wiadomość jest wymagana").max(5000),
  subject: z.string().max(200).optional(),
  phone: z.string()
    .regex(phoneRegex, "Nieprawidłowy format numeru telefonu")
    .optional()
    .or(z.literal("")),
  departure_date: z.string().optional(),
  return_date: z.string().optional(),
}).refine(
  (data) => {
    if (!data.departure_date || !data.return_date) return true;
    return new Date(data.return_date) >= new Date(data.departure_date);
  },
  {
    message: "Data powrotu musi być taka sama lub późniejsza niż data wyjazdu",
    path: ["return_date"]
  }
);

export type ContractFormData = z.infer<typeof contractSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
export type InquiryFormData = z.infer<typeof inquirySchema>;
