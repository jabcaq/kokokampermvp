# Dokumentacja Funkcjonalności Aplikacji KOKO Kamper

## Spis treści
1. [Dashboard](#dashboard)
2. [Zarządzanie Klientami](#zarządzanie-klientami)
3. [Zarządzanie Umowami](#zarządzanie-umowami)
4. [Flota Pojazdów](#flota-pojazdów)
5. [Kierowcy](#kierowcy)
6. [Zapytania (Inquiries)](#zapytania-inquiries)
7. [Protokoły](#protokoły)
8. [Dokumenty](#dokumenty)
9. [Faktury i Rozliczenia](#faktury-i-rozliczenia)
10. [Kalendarz](#kalendarz)
11. [Zwroty Pojazdów](#zwroty-pojazdów)
12. [Grafiki Pracowników](#grafiki-pracowników)
13. [Użytkownicy i Role](#użytkownicy-i-role)
14. [Powiadomienia](#powiadomienia)
15. [Formularze Zewnętrzne](#formularze-zewnętrzne)
16. [Funkcje Administracyjne](#funkcje-administracyjne)
17. [Integracje](#integracje)

---

## Dashboard

**Ścieżka:** `/`

### Funkcjonalności:
- Wyświetlanie statystyk:
  - Liczba aktywnych umów
  - Nadchodzące rezerwacje
  - Dostępne pojazdy
  - Zwroty zaplanowane na dziś
- Szybkie akcje (Quick Actions)
- Panel powiadomień i alertów
- Przegląd najważniejszych informacji

---

## Zarządzanie Klientami

**Ścieżka:** `/clients`

### Funkcjonalności:
- Lista wszystkich klientów z wyszukiwaniem
- Dodawanie nowego klienta
- Edycja danych klienta
- Szczegóły klienta (`/clients/:id`):
  - Dane osobowe (imię, nazwisko, email, telefon)
  - Adres
  - Dane dokumentu tożsamości (typ, numer, wydawca)
  - PESEL / NIP
  - Dane prawa jazdy (numer, kategoria, data wydania)
  - Kategoria prawa jazdy na przyczepę
  - Nazwa firmy (opcjonalnie)
- Synchronizacja danych klientów z umów
- Licznik umów per klient

---

## Zarządzanie Umowami

**Ścieżka:** `/contracts`

### Funkcjonalności:

#### Lista umów:
- Filtrowanie po statusie (pending, active, completed, cancelled)
- Wyszukiwanie
- Archiwizacja umów
- Sortowanie

#### Tworzenie umowy:
- Format numeru: `{NUMER}/{ROK}/{TYP}` (np. `15/2025/K`)
- Tworzenie z zapytania (inquiry)
- Tworzenie od podstaw
- Wybór języka preferowanego (PL/EN)

#### Szczegóły umowy (`/contracts/:id`):

**Zakładki:**
1. **Ogólne** - dane umowy, najemcy, pojazdu
2. **Dodatkowi kierowcy** - lista dodatkowych kierowców z danymi
3. **Protokoły wydania** - dokumentacja wydania pojazdu
4. **Protokoły zwrotu** - dokumentacja zwrotu pojazdu
5. **Konwersacja** - notatki i komunikacja
6. **Dokumenty** - załączone pliki
7. **Faktury/Paragony** - rozliczenia finansowe

**Panel akcji (Checklist):**
- Formularz dla kierowców (wysłany/niewysłany)
- Wysłanie do weryfikacji
- Wygenerowanie umowy
- Wysłanie umowy do klienta

**Panel księgowości:**
- Generowanie proformy (rezerwacyjna, główna, kaucja)
- Zarządzanie płatnościami

**Dane umowy:**
- Daty wynajmu (start, koniec)
- Dane najemcy
- Dane pojazdu
- Płatności (rezerwacyjna, zasadnicza, kaucja)
- Przyczepa (opcjonalnie)
- Liczba podróżnych
- Zwierzęta
- Dodatkowe wyposażenie
- Sprzątanie
- Notatki

**Linki automatycznie generowane:**
- Link do formularza kierowcy (PL)
- Link do formularza kierowcy (EN)
- Link do wydania pojazdu
- Link do zwrotu pojazdu
- Link do rezerwacji zwrotu (dla pracownika)

---

## Flota Pojazdów

**Ścieżka:** `/fleet`

### Funkcjonalności:

#### Lista pojazdów:
- Przegląd wszystkich pojazdów
- Status pojazdu (dostępny, w użyciu, serwis)
- Wyszukiwanie

#### Szczegóły pojazdu (`/fleet/:id`):
- Dane podstawowe:
  - Model
  - Marka
  - Rok produkcji
  - VIN
  - Numer rejestracyjny
  - Numer dowodu rejestracyjnego
  - Lokalizacja
  - Typ pojazdu
  - Waga przyczepy
  - Dodatkowe informacje
- Data następnego przeglądu
- Ubezpieczenie (numer polisy, ważność)
- Dokumenty pojazdu

#### Dokumenty pojazdu:
- Dodawanie dokumentów (PDF, zdjęcia)
- Typy dokumentów:
  - Dowód rejestracyjny
  - Polisa ubezpieczeniowa
  - Przegląd techniczny
  - Inne
- Podgląd PDF w modalu
- Pobieranie dokumentów

---

## Kierowcy

**Ścieżka:** `/drivers`

### Funkcjonalności:
- Lista kierowców
- Dane kierowców z formularzy zgłoszeniowych
- Powiązanie z umowami

---

## Zapytania (Inquiries)

**Ścieżka:** `/inquiries`

### Funkcjonalności:

#### Lista zapytań:
- Automatyczna numeracja (INQ-XXXXX)
- Filtrowanie po statusie (new, in_progress, completed, archived)
- Filtrowanie po emailu (wyszukuje we wszystkich statusach)
- Wyszukiwanie

#### Dane zapytania:
- Dane kontaktowe (imię, nazwisko, email, telefon)
- Daty podróży (wyjazd, powrót)
- Elastyczne daty (tak/nie)
- Liczba osób
- Budżet (od-do)
- Typ pojazdu
- Doświadczenie z kamperami
- Kraje docelowe
- Typ wakacji
- Wyposażenie sportowe
- Wymagane wyposażenie
- Kod promocyjny
- Notatki

#### Konwersacja:
- Wiadomości od klienta
- Odpowiedzi admina
- Historia komunikacji

#### Konwersja do umowy:
- Tworzenie umowy bezpośrednio z zapytania
- Przenoszenie danych klienta
- Wybór języka preferowanego

---

## Protokoły

**Ścieżka:** `/protocols`

### Funkcjonalności:
- Lista wszystkich protokołów (wydania i zwrotu)
- Filtrowanie
- Szczegóły protokołów

---

## Dokumenty

**Ścieżka:** `/documents`

### Funkcjonalności:
- Centralna lista wszystkich dokumentów
- Filtrowanie po typie
- Filtrowanie po umowie/kliencie
- Podgląd dokumentów
- Pobieranie

---

## Faktury i Rozliczenia

**Ścieżka:** `/invoices`

### Funkcjonalności:

#### Typy faktur:
- **Zaliczkowa (rezerwacja)** - dawniej "Rezerwacyjna"
- **Zaliczkowa (płatność główna)** - dawniej "Zasadnicza"
- **Końcowa**
- **Proforma** - generowana w aplikacji

#### Generowanie Proformy:
- Automatyczne generowanie PDF w aplikacji
- Dane firmy z konfiguracji
- Typy: rezerwacyjna, główna, kaucja
- Pobieranie PDF

#### Zarządzanie fakturami:
- Dodawanie faktur z plikami
- Statusy (oczekująca, opłacona)
- Podgląd plików (PDF, obrazy)
- Archiwizacja

#### Dostęp dla księgowości:
- Rola "accounting" - tylko odczyt umów
- Dostęp do zakładki faktur
- Brak możliwości edycji umów

---

## Kalendarz

**Ścieżka:** `/calendar`

### Funkcjonalności:
- Widok kalendarza rezerwacji
- Widok miesięczny/tygodniowy/dzienny
- Kolorowanie według statusu umowy
- Szczegóły rezerwacji po kliknięciu

### Kalendarz zwrotów:
**Ścieżka:** `/return-calendar`
- Kalendarz zaplanowanych zwrotów
- Przypisani pracownicy
- Status zwrotu

---

## Zwroty Pojazdów

### Wydanie pojazdu:
**Ścieżka:** `/handover/:contractId`

#### Funkcjonalności:
- Przebieg pojazdu
- Poziom paliwa
- Zdjęcia stanu pojazdu
- Protokół wydania (pliki)

### Zwrot pojazdu:
**Ścieżka:** `/return/:contractId`

#### Funkcjonalności:
- Przebieg pojazdu
- Poziom paliwa
- Zdjęcia stanu pojazdu
- Uwagi dotyczące stanu
- Oznaczenie problemów
- Rozliczenie kaucji:
  - Możliwość zwrotu (tak/nie)
  - Zwrot gotówką
  - Zwrot przelewem
  - Timestamp zwrotu
- Potwierdzenie zwrotu
- Zakończenie zwrotu
- Automatyczna zmiana statusu umowy na "completed"

### Rezerwacja terminu zwrotu:
**Ścieżka:** `/return-booking/:contractId`

#### Funkcjonalności:
- Wybór daty zwrotu
- Wybór dostępnego slotu czasowego
- Notatki do rezerwacji
- Wielojęzyczność (PL/EN)

### Moje zwroty:
**Ścieżka:** `/my-returns`

#### Funkcjonalności:
- Lista przypisanych zwrotów dla pracownika
- Filtrowanie po dacie
- Szczegóły zwrotu

---

## Grafiki Pracowników

### Widok administratora:
**Ścieżka:** `/admin/schedules`

#### Funkcjonalności:
- Zarządzanie grafikami wszystkich pracowników
- Dodawanie zmian
- Edycja dostępności
- Ustawienia:
  - Maksymalna liczba równoczesnych zwrotów
  - Czas trwania zwrotu (minuty)
  - Dni na rezerwację z wyprzedzeniem

### Widok pracownika:
**Ścieżka:** `/schedule`

#### Funkcjonalności:
- Podgląd własnego grafiku
- Dodawanie własnej dostępności
- Notatki do zmian

---

## Użytkownicy i Role

**Ścieżka:** `/users`

### Role w systemie:
1. **admin** - pełny dostęp
2. **staff** - pracownik
3. **user** - podstawowy użytkownik
4. **return_handler** - obsługa zwrotów
5. **admin_return_handler** - admin zwrotów
6. **accounting** - księgowość (tylko odczyt umów + faktury)

### Funkcjonalności:
- Lista użytkowników
- Dodawanie użytkowników
- Zmiana ról
- Archiwizacja użytkowników
- Reset hasła

---

## Powiadomienia

### System powiadomień:
**Ścieżka:** `/notifications` (dzwonek w nagłówku)

#### Typy powiadomień:
- Wygasające ubezpieczenie pojazdu
- Wygasający przegląd techniczny
- Dodana faktura
- Nadchodzące wynajmy

### Logi powiadomień (Admin):
**Ścieżka:** `/notification-logs`

#### Funkcjonalności:
- Historia wszystkich powiadomień systemowych
- Filtrowanie po typie
- Filtrowanie po użytkowniku
- Filtrowanie po dacie
- Śledzenie akcji użytkowników

---

## Formularze Zewnętrzne

### Formularz kierowcy (PL):
**Ścieżka:** `/driver-form/:contractId`

#### Dane do wypełnienia:
- Dane osobowe
- Adres
- Dokument tożsamości
- Prawo jazdy
- Data i godzina odbioru

### Formularz kierowcy (EN):
**Ścieżka:** `/driver-form-en/:contractId`

- Wersja angielska formularza kierowcy
- Identyczne pola jak wersja polska

### Wgrywanie faktury przez księgowość:
**Ścieżka:** `/accounting-upload/:contractId`

#### Funkcjonalności:
- Wgrywanie plików faktur
- Wybór typu faktury
- Kwota
- Notatki

### Wgrywanie pojedynczej faktury:
**Ścieżka:** `/invoice-upload/:contractId/:invoiceId`

#### Funkcjonalności:
- Wgrywanie pliku do konkretnej faktury
- Aktualizacja statusu

---

## Funkcje Administracyjne

### Eksport danych:
**Ścieżka:** `/admin/export-data` (ukryta strona)

#### Funkcjonalności:
- Eksport wszystkich danych z bazy
- Format JSON
- Pobieranie pliku
- Kopiowanie do schowka
- Podgląd danych

### Test powiadomień:
**Ścieżka:** `/test-notifications`

#### Funkcjonalności:
- Testowanie funkcji powiadomień
- Ręczne wyzwalanie webhooków

---

## Integracje

### Edge Functions (Supabase):

#### Powiadomienia automatyczne:
- `check-deposit-3days` - przypomnienie o kaucji 3 dni przed
- `check-deposit-5days` - przypomnienie o kaucji 5 dni przed
- `check-deposit-rental-day` - przypomnienie o kaucji w dniu wynajmu
- `check-expiring-inspection` - wygasający przegląd
- `check-expiring-insurance` - wygasające ubezpieczenie
- `check-final-invoice-due` - przypomnienie o fakturze końcowej
- `check-handover-day` - dzień wydania pojazdu
- `check-payment-due-7days` - przypomnienie o płatności 7 dni przed
- `check-payment-overdue` - zaległa płatność
- `check-rental-2days` - 2 dni przed wynajmem
- `check-rental-start-day` - dzień rozpoczęcia wynajmu
- `check-return-2days` - 2 dni przed zwrotem
- `check-return-day` - dzień zwrotu
- `check-upcoming-rentals` - nadchodzące wynajmy

#### Inne funkcje:
- `export-data` - eksport danych bazy
- `notify-contract-active` - webhook przy aktywacji umowy
- `notify-contract-cancelled` - webhook przy anulowaniu
- `notify-driver-submission` - webhook przy zgłoszeniu kierowcy
- `send-accounting-request` - żądanie do księgowości
- `send-deposit-notification` - powiadomienie o kaucji
- `send-invoice-file-notification` - powiadomienie o pliku faktury
- `send-rental-notification` - powiadomienie o wynajmie
- `send-review-request` - prośba o opinię
- `sync-clients-from-contracts` - synchronizacja klientów
- `telegram-update-deposit` - aktualizacja kaucji przez Telegram
- `update-contract-folder-name` - aktualizacja nazwy folderu
- `update-user` - aktualizacja użytkownika
- `reset-user-password` - reset hasła
- `create-user` - tworzenie użytkownika

### Webhooks (Make.com):
- Powiadomienia o kaucji
- Powiadomienia o płatnościach
- Powiadomienia o wynajmach
- Prośby o opinię
- Powiadomienia księgowe

---

## Baza Danych (Tabele)

1. **clients** - klienci
2. **contracts** - umowy
3. **contract_documents** - dokumenty umów
4. **contract_invoices** - faktury umów
5. **contract_status_history** - historia statusów
6. **documents** - dokumenty ogólne
7. **employee_availability_settings** - ustawienia dostępności
8. **employee_schedules** - grafiki pracowników
9. **inquiries** - zapytania
10. **inquiry_messages** - wiadomości zapytań
11. **notification_logs** - logi powiadomień
12. **notifications** - powiadomienia
13. **profiles** - profile użytkowników
14. **user_roles** - role użytkowników
15. **vehicle_documents** - dokumenty pojazdów
16. **vehicle_handovers** - protokoły wydania
17. **vehicle_returns** - protokoły zwrotu
18. **vehicles** - pojazdy

---

## Automatyczne Procesy

1. **Auto-aktywacja umowy** - przy wpłacie kaucji (pending → active)
2. **Auto-zakończenie umowy** - przy zakończeniu zwrotu i rozliczeniu kaucji (active → completed)
3. **Generowanie numerów zapytań** - automatyczna sekwencja INQ-XXXXX
4. **Generowanie linków** - automatyczne tworzenie linków do formularzy
5. **Powiadomienia o wygasających dokumentach** - codzienne sprawdzanie

---

## Konfiguracja

### Dane firmy (`src/config/companyData.ts`):
- Nazwa: KOKO GROUP SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ
- NIP: 5223208183
- Adres: ul. Stawowa 1D, 05-504 Złotokłos
- Bank: 34 1140 2004 0000 3802 8192 4912

---

*Dokument wygenerowany: grudzień 2024*
