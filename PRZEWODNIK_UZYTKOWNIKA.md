# Przewodnik Użytkownika - System Zarządzania Wypożyczalnią

## Spis treści
1. [O aplikacji](#o-aplikacji)
2. [Panel główny](#panel-główny)
3. [Zarządzanie klientami](#zarządzanie-klientami)
4. [Zarządzanie umowami](#zarządzanie-umowami)
5. [Flota pojazdów](#flota-pojazdów)
6. [Zapytania](#zapytania)
7. [Protokoły](#protokoły)
8. [Dokumenty](#dokumenty)
9. [Faktury](#faktury)
10. [Harmonogramy pracowników](#harmonogramy-pracowników)
11. [Użytkownicy](#użytkownicy)
12. [Powiadomienia](#powiadomienia)

---

## O aplikacji

System zarządzania wypożyczalnią to kompleksowe narzędzie stworzone do obsługi wszystkich aspektów działalności wypożyczalni pojazdów. Aplikacja umożliwia zarządzanie klientami, umowami najmu, flotą pojazdów, protokołami przekazań i zwrotów, dokumentacją oraz finansami.

### Główne funkcje systemu
- **Centralizacja danych** - wszystkie informacje o klientach, pojazdach i umowach w jednym miejscu
- **Automatyzacja procesów** - automatyczne generowanie dokumentów, wysyłanie powiadomień i przypomnień
- **Kontrola floty** - monitorowanie stanu pojazdów, przeglądów i ubezpieczeń
- **Zarządzanie finansami** - śledzenie płatności, faktur i rozliczeń
- **Komunikacja z klientami** - wbudowane narzędzia do komunikacji i udostępniania formularzy
- **Wielopoziomowy dostęp** - różne uprawnienia dla administratorów i pracowników

---

## Panel główny

Po zalogowaniu widzisz **Dashboard** z najważniejszymi informacjami:

### Sekcja statystyk
- **Aktywne umowy** - liczba obecnie trwających wynajmów
- **Nadchodzące rezerwacje** - lista pojazdów, które wkrótce będą wydawane
- **Dostępne pojazdy** - liczba wolnych pojazdów gotowych do wynajmu
- **Zwroty dzisiaj** - lista pojazdów, które mają być zwrócone danego dnia

### Szybkie akcje
Dashboard zawiera przyciski szybkiego dostępu do:
- Tworzenia nowej umowy
- Dodawania klienta
- Przeglądania zapytań
- Zarządzania flotą

### Powiadomienia i alerty
W górnej części ekranu znajdziesz:
- **Dzwonek powiadomień** - informacje o ważnych wydarzeniach
- **Alerty** - ostrzeżenia o zbliżających się terminach przeglądów lub wygasających ubezpieczeniach
- **Menu użytkownika** - dostęp do ustawień i wylogowania

---

## Zarządzanie klientami

### Lista klientów
W sekcji **Klienci** znajdziesz wszystkich klientów wypożyczalni. Możesz:
- Przeglądać listę wszystkich klientów
- Wyszukiwać klientów po nazwisku, firmie lub numerze telefonu
- Dodawać nowych klientów
- **Synchronizować dane klientów z umów** - jeśli klient wypełnił dane w umowie, możesz je automatycznie zaciągnąć do profilu klienta

### Szczegóły klienta
Po kliknięciu na klienta zobaczysz:
- Pełne dane kontaktowe
- Dane dokumentu tożsamości
- Informacje o prawie jazdy
- Historię wszystkich umów klienta
- Dodatkowe notatki

### Dodawanie nowego klienta
1. Kliknij przycisk **"Dodaj klienta"**
2. Wypełnij formularz z danymi:
   
   **Dane podstawowe:**
   - Imię i nazwisko (dla klientów indywidualnych)
   - Nazwa firmy (dla klientów firmowych)
   - Email - adres do korespondencji
   - Telefon kontaktowy
   
   **Adres:**
   - Ulica i numer domu/mieszkania
   - Kod pocztowy
   - Miasto
   - Kraj
   
   **Dokument tożsamości:**
   - Typ dokumentu (dowód osobisty, paszport, inny)
   - Numer dokumentu
   - Organ wydający
   - PESEL (dla obywateli Polski)
   - NIP (dla firm)
   
   **Prawo jazdy:**
   - Numer prawa jazdy
   - Kategorie uprawnień (np. B, B+E, C)
   - Data wydania
   - Czy posiada uprawnienia do przyczepy

3. Zapisz dane kliknięciem **"Zapisz"**

### Edycja danych klienta
1. Znajdź klienta na liście
2. Kliknij na jego nazwisko, aby otworzyć szczegóły
3. Kliknij przycisk **"Edytuj"**
4. Wprowadź zmiany w formularzu
5. Zapisz zaktualizowane dane

### Synchronizacja danych z umów
Jeśli klient wypełnił formularz kierowcy online, jego dane mogą nie być jeszcze w profilu:
1. Kliknij przycisk **"Synchronizuj z umów"** na liście klientów
2. System automatycznie zaktualizuje profile wszystkich klientów danymi z umów
3. Zobaczysz powiadomienie z liczbą zaktualizowanych profili

---

## Zarządzanie umowami

### Lista umów
Sekcja **Umowy** zawiera wszystkie umowy najmu. Możesz:
- Przeglądać aktywne i zakończone umowy
- Filtrować umowy po statusie
- Wyszukiwać umowy po numerze lub nazwie klienta
- Tworzyć nowe umowy
- Archiwizować zakończone umowy

### Szczegóły umowy
Każda umowa zawiera pełne zakładki z informacjami:

#### Zakładka Ogólne
- Numer umowy
- Dane najemcy (klienta)
- Dane pojazdu
- Daty wynajmu (od - do)
- Informacje o lokalizacji odbioru i zwrotu
- Status płatności

#### Zakładka Dodatkowi kierowcy
- Lista wszystkich dodatkowych kierowców
- Ich dane osobowe i dokumenty
- Informacje o prawach jazdy

#### Zakładka Protokoły przekazania
- Historia przekazań pojazdu
- Zdjęcia stanu pojazdu przy przekazaniu
- Stan licznika i paliwa
- Podpisy i pliki PDF protokołów

#### Zakładka Protokoły zwrotu
- Historia zwrotów pojazdu
- Zdjęcia stanu pojazdu przy zwrocie
- Uwagi pracownika przyjmującego
- Rezerwacja terminu zwrotu

#### Zakładka Konwersacja
- Historia wiadomości z klientem
- Możliwość dodawania notatek
- Przebieg komunikacji

#### Zakładka Dokumenty
- Wszystkie dokumenty związane z umową
- Umowa w PDF
- Dokumenty klienta
- Inne pliki

#### Zakładka Faktury i paragony
- Lista wszystkich faktur
- Paragony i potwierdzenia płatności
- Status rozliczeń

### Akcje umowy
Dla każdej umowy możesz:
- **Generuj umowę** - automatyczne wygenerowanie dokumentu umowy
- **Wyślij do klienta** - wysłanie umowy na email klienta
- **Formularz kierowcy** - link dla klienta do wypełnienia danych kierowców
- **Wyślij do weryfikacji** - przesłanie umowy do systemu weryfikacji

### Tworzenie nowej umowy

#### Krok 1: Rozpoczęcie
1. Kliknij przycisk **"Nowa umowa"** w sekcji Umowy
2. System otworzy formularz nowej umowy

#### Krok 2: Wybór klienta
- **Istniejący klient**: Wyszukaj klienta po nazwisku lub firmie
- **Nowy klient**: Kliknij "Dodaj nowego klienta" i wypełnij podstawowe dane

#### Krok 3: Wybór pojazdu
1. Z listy dostępnych pojazdów wybierz odpowiedni samochód
2. System automatycznie sprawdzi dostępność w wybranych terminach
3. Jeśli pojazd jest zajęty, zobaczysz ostrzeżenie

#### Krok 4: Daty wynajmu
- **Data rozpoczęcia** - kiedy klient odbierze pojazd
- **Data zakończenia** - planowana data zwrotu
- **Lokalizacja odbioru** - gdzie pojazd będzie wydany
- **Lokalizacja zwrotu** - gdzie pojazd ma być zwrócony

#### Krok 5: Szczegóły umowy
- **Numer umowy** - generowany automatycznie (można edytować)
- **Cena wynajmu** - kwota za cały okres
- **Kaucja** - wysokość kaucji do wpłaty
- **Limit kilometrów** - maksymalny przebieg (jeśli dotyczy)
- **Ubezpieczenie** - rodzaj i zakres ubezpieczenia
- **Dodatkowe usługi** - foteliki, GPS, itp.

#### Krok 6: Zapisanie umowy
1. Sprawdź wszystkie dane
2. Kliknij **"Zapisz umowę"**
3. System wygeneruje automatyczne linki:
   - Link do formularza kierowcy
   - Link do protokołu przekazania
   - Link do kalendarza zwrotu

### Przekształcanie zapytania w umowę
Z poziomu zapytania możesz szybko utworzyć umowę:

#### Proces krok po kroku:
1. Otwórz sekcję **Zapytania**
2. Znajdź zapytanie, które chcesz przekształcić
3. Otwórz szczegóły zapytania
4. Kliknij przycisk **"Utwórz umowę z zapytania"**
5. System automatycznie:
   - Utworzy profil klienta (jeśli nie istnieje)
   - Przeniesie dane kontaktowe z zapytania
   - Ustawi wybrane daty wynajmu
   - Przypisze wybrany pojazd (jeśli został wskazany)
6. Uzupełnij pozostałe szczegóły umowy
7. Zapisz umowę

#### Zalety tego rozwiązania:
- Oszczędność czasu - nie przepisujesz danych ręcznie
- Brak błędów - dane są kopiowane automatycznie
- Ciągłość procesu - od zapytania do umowy w kilka kliknięć

---

## Flota pojazdów

### Lista pojazdów
W sekcji **Flota** zarządzasz wszystkimi pojazdami. Możesz:
- Przeglądać wszystkie pojazdy
- Sprawdzać dostępność pojazdów
- Monitorować przeglądy i ubezpieczenia
- Dodawać nowe pojazdy
- Edytować dane pojazdów

### Szczegóły pojazdu
Każdy pojazd ma pełną kartę z informacjami:
- Podstawowe dane (marka, model, rocznik, VIN)
- Dane rejestracyjne
- Informacje o ubezpieczeniu (data ważności)
- Terminy przeglądów (data następnego przeglądu)
- Historia umów tego pojazdu
- Zdjęcia pojazdu

### Kalendarz rezerwacji
**Kalendarz rezerwacji** to wizualne narzędzie do planowania wynajmów:

#### Widoki kalendarza:
- **Widok miesięczny** - przegląd wszystkich rezerwacji w miesiącu
- **Widok tygodniowy** - szczegółowy widok tygodnia
- **Widok dzienny** - lista wszystkich wydarzeń danego dnia

#### Funkcje kalendarza:
- **Kolor rezerwacji** - każdy pojazd ma przypisany kolor dla łatwiejszej identyfikacji
- **Sprawdzanie dostępności** - kliknij na datę, aby zobaczyć wolne pojazdy
- **Dodawanie rezerwacji** - kliknij i przeciągnij, aby stworzyć nową rezerwację
- **Wykrywanie konfliktów** - system ostrzeże, jeśli pojazd jest już zarezerwowany

#### Kolory statusów:
- **Zielony** - potwierdzona rezerwacja
- **Żółty** - rezerwacja wstępna (oczekująca na potwierdzenie)
- **Czerwony** - konflikt terminów
- **Szary** - pojazd niedostępny (serwis, naprawa)

---

## Zapytania

### Obsługa zapytań klientów
Sekcja **Zapytania** służy do zarządzania zapytaniami ofertowymi:
- Lista wszystkich zapytań
- Status każdego zapytania (nowe, w trakcie, zamknięte)
- Historia konwersacji z klientem
- Możliwość odpowiadania na zapytania
- Przekształcanie zapytań w umowy

### Proces obsługi zapytania
1. Klient przesyła zapytanie
2. Widzisz je w liście zapytań
3. Możesz odpowiedzieć klientowi
4. Po ustaleniu warunków tworzysz umowę z zapytania
5. Zapytanie zostaje zamknięte

---

## Protokoły

### Protokoły przekazania pojazdu
Przekazanie pojazdu klientowi to kluczowy moment - dokumentujesz stan pojazdu przed wydaniem:

#### Przygotowanie do przekazania:
1. Otwórz szczegóły umowy
2. Przejdź do zakładki **Protokoły przekazania**
3. Kliknij **"Otwórz formularz przekazania"**

#### Wypełnianie protokołu przekazania:

**Krok 1: Dane podstawowe**
- Data i godzina przekazania
- Stan licznika kilometrów
- Poziom paliwa (w %)
- Osoba przekazująca pojazd

**Krok 2: Dokumentacja fotograficzna**
Zrób zdjęcia pojazdu ze wszystkich stron:
- Przód pojazdu
- Tył pojazdu
- Lewa strona
- Prawa strona
- Wnętrze (deskę rozdzielczą)
- Stan opon
- Ewentualne uszkodzenia (zbliżenia)

**Krok 3: Oględziny pojazdu**
- Zaznacz wszystkie istniejące uszkodzenia na schemacie pojazdu
- Opisz każde uszkodzenie (rysa, wgniecenie, itp.)
- Oceń stan ogólny pojazdu

**Krok 4: Wyposażenie pojazdu**
Potwierdź obecność:
- Kół zapasowych lub zestawu naprawczego
- Trójkąta ostrzegawczego
- Gaśnicy
- Kamizelki ostrzegawczej
- Apteczki
- Kluczy zapasowych
- Dokumentów pojazdu

**Krok 5: Finalizacja**
1. Przejrzyj cały protokół
2. Poproś klienta o potwierdzenie stanu pojazdu
3. Kliknij **"Zapisz protokół"**
4. System wygeneruje PDF protokołu
5. Wydrukuj lub wyślij elektronicznie do klienta

### Protokoły zwrotu pojazdu
Przyjęcie pojazdu od klienta wymaga dokładnej weryfikacji stanu:

#### Rezerwacja terminu zwrotu (opcjonalnie):
Klient może wcześniej zarezerwować termin:
1. Otrzymuje link do kalendarza zwrotów
2. Wybiera dogodną datę i godzinę
3. Rezerwacja pojawia się w systemie
4. Pracownik otrzymuje powiadomienie

#### Proces przyjęcia pojazdu:

**Krok 1: Otwarcie formularza**
1. Otwórz umowę klienta
2. Przejdź do zakładki **Protokoły zwrotu**
3. Kliknij **"Otwórz formularz zwrotu"**

**Krok 2: Weryfikacja danych**
- Data i godzina zwrotu
- Stan licznika końcowy
- Obliczenie przejechanych kilometrów
- Sprawdzenie limitu kilometrów

**Krok 3: Kontrola paliwa**
- Poziom paliwa przy zwrocie
- Porównanie z poziomem przy wydaniu
- Naliczenie opłaty za brakujące paliwo (jeśli dotyczy)

**Krok 4: Dokumentacja fotograficzna**
Wykonaj zdjęcia pojazdu:
- Wszystkie strony pojazdu (jak przy przekazaniu)
- Szczególną uwagę zwróć na miejsca, gdzie były wcześniej uszkodzenia
- Zrób zdjęcia wszystkich nowych uszkodzeń

**Krok 5: Oględziny i porównanie**
- Porównaj stan obecny ze stanem z protokołu przekazania
- Zaznacz wszystkie NOWE uszkodzenia na schemacie
- Opisz każde nowe uszkodzenie szczegółowo
- Oceń, czy uszkodzenie wymaga naprawy

**Krok 6: Sprawdzenie wyposażenia**
Upewnij się, że wszystko jest kompletne:
- Koło zapasowe lub zestaw naprawczy
- Akcesoria bezpieczeństwa
- Klucze (wszystkie komplety)
- Dokumenty pojazdu
- Dodatkowe wyposażenie (GPS, fotelik, itp.)

**Krok 7: Czystość pojazdu**
- Oceń czystość wnętrza
- Oceń czystość zewnętrzną
- Nalicz opłatę za czyszczenie (jeśli pojazd jest bardzo brudny)

**Krok 8: Uwagi i notatki**
- Dodaj wszelkie uwagi dotyczące stanu pojazdu
- Zanotuj uwagi klienta
- Odnotuj ewentualne reklamacje

**Krok 9: Rozliczenie**
- Sprawdź status płatności
- Oblicz ewentualne dodatkowe opłaty:
  - Za przekroczenie limitu kilometrów
  - Za brakujące paliwo
  - Za uszkodzenia
  - Za spóźniony zwrot
- Zwróć kaucję lub odlicz koszty napraw

**Krok 10: Finalizacja**
1. Przejrzyj cały protokół zwrotu
2. Poproś klienta o potwierdzenie
3. Kliknij **"Zapisz protokół"**
4. System wygeneruje PDF protokołu zwrotu
5. Przekaż klientowi kopię protokołu
6. Zaktualizuj status umowy na "Zakończona"

### Moje zwroty (dla pracowników)
Pracownicy obsługujący zwroty mają dostęp do sekcji **Moje zwroty**:
- Lista zaplanowanych zwrotów
- Kalendarz zwrotów
- Szybki dostęp do formularzy zwrotu

---

## Dokumenty

### Zarządzanie dokumentami
Sekcja **Dokumenty** to centralne miejsce przechowywania plików:
- Dokumenty związane z umowami
- Dokumenty pojazdów
- Dokumenty klientów
- Inne pliki firmowe

### Typy dokumentów
- Umowy PDF
- Protokoły przekazań i zwrotów
- Dokumenty tożsamości
- Prawa jazdy
- Dowody rejestracyjne
- Polisy ubezpieczeniowe
- Karty przeglądu

### Przesyłanie dokumentów
1. Wybierz kategorię dokumentu
2. Kliknij **"Dodaj dokument"**
3. Wybierz plik z dysku
4. Przypisz do umowy/pojazdu/klienta
5. Zapisz

---

## Faktury

### Zarządzanie fakturami
Sekcja **Faktury** obsługuje rozliczenia:
- Lista wszystkich faktur
- Faktury przypisane do umów
- Status płatności
- Historia transakcji

### Przesyłanie faktur
1. Kliknij **"Prześlij fakturę"**
2. Wybierz plik PDF faktury
3. Przypisz do umowy
4. Uzupełnij dane (kwota, data)
5. Zapisz

### Panel księgowości
**Księgowość** zawiera:
- Zestawienie przychodów
- Faktury do rozliczenia
- Raporty finansowe
- Eksport danych do systemu księgowego

---

## Harmonogramy pracowników

### Zarządzanie grafikami (dla administratorów)
Administrator może zarządzać harmonogramami:
- Tworzenie grafików pracy
- Przypisywanie zmian pracownikom
- Planowanie obsady w lokalizacjach
- Kalendarz pracy zespołu

### Mój harmonogram (dla pracowników)
Każdy pracownik widzi swój harmonogram:
- Zaplanowane zmiany
- Godziny pracy
- Lokalizacja pracy
- Kalendarza własnych zmian

---

## Użytkownicy

### Zarządzanie kontami (tylko dla administratorów)
Administrator może:
- Dodawać nowych użytkowników
- Przypisywać role (administrator, pracownik, obsługa zwrotów)
- Edytować dane użytkowników
- Resetować hasła
- Dezaktywować konta

### Role użytkowników
- **Administrator** - pełny dostęp do systemu
- **Pracownik** - dostęp do umów, klientów, protokołów
- **Obsługa zwrotów** - dostęp do funkcji przyjmowania zwrotów

---

## Powiadomienia

### System powiadomień
Aplikacja automatycznie wysyła powiadomienia o:
- Zbliżających się terminach najmu
- Upływających terminach zwrotu
- Konieczności wpłaty kaucji
- Zbliżających się przeglądach pojazdów
- Wygasających ubezpieczeniach
- Nowych zapytaniach

### Dzwonek powiadomień
W prawym górnym rogu znajduje się **dzwonek powiadomień**:
- Czerwona kropka informuje o nowych powiadomieniach
- Kliknij, aby zobaczyć wszystkie powiadomienia
- Powiadomienia są automatycznie oznaczane jako przeczytane

### Powiadomienia email
System automatycznie wysyła emaile:
- Do klientów z linkami do formularzy
- Do pracowników o ważnych wydarzeniach
- Przypomnienia o terminach

---

## Formularze dla klientów

### Formularz kierowcy
Klient otrzymuje link do wypełnienia danych:
1. Dane głównego najemcy
2. Dane dodatkowych kierowców
3. Informacje o dokumentach
4. Prawa jazdy

Po wypełnieniu formularza dane automatycznie trafiają do umowy i profilu klienta.

### Rezerwacja terminu zwrotu
Klient może zarezerwować termin zwrotu pojazdu:
1. Otrzymuje link do kalendarza
2. Wybiera dogodny termin
3. Rezerwacja pojawia się w systemie
4. Pracownik jest powiadamiany o zaplanowanym zwrocie

---

## Wskazówki i najlepsze praktyki

### Codzienne czynności

#### Poranny przegląd (pierwsza rzecz po zalogowaniu):
1. Sprawdź **powiadomienia** (dzwonek w prawym górnym rogu)
2. Przejrzyj **dzisiejsze przekazania** pojazdu
3. Sprawdź **dzisiejsze zwroty** pojazdu
4. Zweryfikuj **płatności do otrzymania**
5. Przejrzyj **nowe zapytania** od klientów

#### W trakcie dnia:
- Odpowiadaj na zapytania klientów w ciągu 2 godzin
- Aktualizuj statusy umów na bieżąco
- Dodawaj notatki do konwersacji z klientami
- Sprawdzaj dzwonek powiadomień co godzinę

#### Wieczorny przegląd (przed zakończeniem pracy):
1. Sprawdź czy wszystkie protokoły zostały zapisane
2. Potwierdź wszystkie płatności za dzisiejsze zwroty
3. Przejrzyj **jutrzejsze przekazania** - sprawdź czy pojazdy są przygotowane
4. Wyślij przypomnienia klientom o jutrzejszych rezerwacjach

### Najlepsze praktyki - zarządzanie flotą

#### Monitorowanie pojazdów:
- **Raz w tygodniu**: Sprawdź daty ubezpieczeń wszystkich pojazdów
- **Raz w miesiącu**: Zweryfikuj daty kolejnych przeglądów technicznych
- **Po każdym zwrocie**: Zaktualizuj stan licznika w systemie
- **Bieżąco**: Dodawaj zdjęcia pojazdów po myjni lub serwisie

#### Dokumentacja fotograficzna:
- Rób zdjęcia w dobrym oświetleniu (dzień, nie noc)
- Zawsze te same kąty: przód, tył, lewy bok, prawy bok, dach (jeśli możliwe)
- Zdjęcia uszkodzeń rób z bliska + z daleka (kontekst)
- Wszystkie zdjęcia z datą i godziną (automatyczne w aplikacji)

### Najlepsze praktyki - obsługa klienta

#### Komunikacja:
- Odpowiadaj na zapytania maksymalnie w ciągu 2 godzin
- Używaj profesjonalnego tonu
- Zawsze potwierdzaj rezerwacje
- Wysyłaj linki do formularzy od razu po utworzeniu umowy

#### Przy przekazaniu pojazdu:
- Przywitaj klienta ciepło
- Sprawdź dokumenty przed wypełnieniem protokołu
- Pokaż klientowi jak obsługiwać pojazd
- Upewnij się, że klient ma Twój numer telefonu
- Zrób wspólnie z klientem obchód pojazdu
- Pokaż wszystkie istniejące uszkodzenia

#### Przy zwrocie pojazdu:
- Bądź punktualny - klient czeka
- Sprawdź pojazd razem z klientem
- Jeśli są uszkodzenia, rozmawiaj spokojnie i konstruktywnie
- Rozlicz klienta od razu, nie odwlekaj
- Podziel się wrażeniami - zapytaj jak przebiegł wynajem
- Zachęć do pozostawienia opinii

### Najlepsze praktyki - umowy

#### Tworzenie umowy:
- Zawsze sprawdzaj dostępność pojazdu w kalendarzu przed utworzeniem umowy
- Upewnij się, że klient ma wszystkie wymagane dokumenty
- Wyjaśnij klientowi wszystkie warunki umowy
- Wyślij link do formularza kierowcy od razu po zapisaniu umowy
- Potwierdź odbiór płatności przed wydaniem pojazdu

#### Zarządzanie umowami:
- Synchronizuj dane klientów po wypełnieniu formularzy (przycisk "Synchronizuj z umów")
- Regularnie archiwizuj zakończone umowy (raz w miesiącu)
- Dodawaj notatki do każdej umowy - ułatwia to późniejszą obsługę
- Aktualizuj status płatności na bieżąco

### Najlepsze praktyki - dokumenty i faktury

#### Przechowywanie dokumentów:
- Wszystkie dokumenty przypisuj do konkretnej umowy
- Używaj jasnych nazw plików (np. "Umowa_K-10-2025.pdf")
- Skanuj dokumenty w dobrej jakości (min. 300 DPI)
- Przechowuj kopie dokumentów tożsamości klientów

#### Faktury:
- Wystawiaj faktury tego samego dnia co zwrot pojazdu
- Od razu oznaczaj status płatności
- Przesyłaj faktury klientom emailem w ciągu 24h
- Regularnie eksportuj dane do księgowości

### Częste błędy do uniknięcia

#### ❌ NIE RÓB TEGO:
- Nie twórz umowy bez sprawdzenia dostępności pojazdu
- Nie wydawaj pojazdu bez protokołu przekazania
- Nie przyjmuj zwrotu bez dokładnych oględzin
- Nie zapominaj o zdjęciach (to Twoja ochrona!)
- Nie przekazuj pojazdu bez sprawdzenia dokumentów klienta
- Nie zwlekaj z rozliczeniem kaucji
- Nie ignoruj powiadomień o zbliżających się przeglądach

#### ✅ ZAWSZE RÓB TO:
- Sprawdzaj dostępność przed potwierdzeniem rezerwacji
- Rób dokładne zdjęcia przy przekazaniu i zwrocie
- Wypełniaj wszystkie pola w protokołach
- Potwierdzaj rezerwacje klientom emailem/SMS
- Synchronizuj dane klientów po wypełnieniu formularzy
- Sprawdzaj powiadomienia kilka razy dziennie
- Aktualizuj statusy umów na bieżąco

### Rozwiązywanie problemów

#### Klient nie wypełnił formularza kierowcy:
1. Sprawdź czy wysłano mu link (w szczegółach umowy)
2. Wyślij ponownie link przez email
3. W razie problemów - wypełnij dane razem z klientem przy przekazaniu

#### Pojazd ma nowe uszkodzenie przy zwrocie:
1. Zrób dokładne zdjęcia uszkodzenia
2. Porównaj ze zdjęciami z przekazania
3. Oceń koszt naprawy
4. Porozmawiaj spokojnie z klientem
5. Odlicz koszt naprawy od kaucji lub wystaw fakturę

#### Klient spóźnia się ze zwrotem:
1. Zadzwoń do klienta 1h przed umówionym czasem
2. Ustal nowy termin zwrotu
3. Poinformuj o ewentualnej opłacie za opóźnienie
4. Zaktualizuj rezerwację w systemie

#### Brak synchronizacji danych klienta:
1. Idź do sekcji **Klienci**
2. Kliknij **"Synchronizuj z umów"**
3. Poczekaj na potwierdzenie
4. Sprawdź czy dane się uzupełniły

#### Pojazd potrzebuje serwisu:
1. Oznacz pojazd jako niedostępny w systemie
2. Dodaj notatkę o powodzie niedostępności
3. Zaplanuj termin serwisu
4. Po serwisie zaktualizuj datę następnego przeglądu
5. Przywróć dostępność pojazdu

### Skróty klawiszowe i szybkie akcje

- **Ctrl/Cmd + K** - Szybkie wyszukiwanie (klienci, umowy, pojazdy)
- **Dzwonek powiadomień** - Kliknij, aby zobaczyć wszystkie alerty
- **Kalendarz** - Przeciągnij aby stworzyć nową rezerwację
- **Szybkie filtry** - Użyj filtrów na listach do szybkiego znalezienia umów

### Wsparcie techniczne

#### Przed zgłoszeniem problemu:
1. Odśwież stronę (F5)
2. Wyloguj się i zaloguj ponownie
3. Sprawdź czy problem się powtarza

#### Zgłaszanie problemów:
- Opisz dokładnie co robiłeś gdy wystąpił problem
- Zrób zrzut ekranu błędu
- Podaj numer umowy lub klienta (jeśli dotyczy)
- Napisz do administratora systemu

#### Najczęstsze pytania:
**P: Jak zmienić hasło?**
O: Kliknij na swoje imię w prawym górnym rogu → Ustawienia → Zmień hasło

**P: Jak wydrukować umowę?**
O: Otwórz umowę → Zakładka Dokumenty → Kliknij na PDF umowy → Drukuj

**P: Jak dodać dodatkowego kierowcę do umowy?**
O: Otwórz umowę → Zakładka "Dodatkowi kierowcy" → Dodaj kierowcę

**P: Jak oznaczyć umowę jako opłaconą?**
O: Otwórz umowę → Zakładka "Ogólne" → Zmień status płatności na "Opłacona"

**P: Jak wysłać klientowi link do formularza?**
O: Otwórz umowę → Akcje umowy → Formularz kierowcy → Skopiuj link → Wyślij klientowi

---

**Wersja dokumentu:** 1.0  
**Data aktualizacji:** 2025
