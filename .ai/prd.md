# Dokument wymagań produktu (PRD) - MindReel
## 1. Przegląd produktu
MindReel to inteligentna aplikacja desktopowa na platformę macOS, zaprojektowana, aby pomóc profesjonalistom, zwłaszcza z branży IT, automatycznie dokumentować i podsumowywać ich codzienną pracę. Działa w tle jako osobista, inteligentna pamięć zawodowa, która dba o to, by żadne osiągnięcie nie zostało zapomniane. Aplikacja proaktywnie i w dyskretny sposób zbiera informacje o wykonywanych zadaniach za pomocą cyklicznych powiadomień, a następnie wykorzystuje sztuczną inteligencję do generowania cotygodniowych, spójnych podsumowań.

## 2. Problem użytkownika
W dynamicznym środowisku pracy, specjaliści często zapominają o wykonanych zadaniach, wprowadzonych rozwiązaniach i kluczowych osiągnięciach z danego dnia czy tygodnia. Prowadzi to do szeregu problemów:
- Trudności w przygotowaniu się do spotkań statusowych, takich jak codzienne stand-upy czy retrospektywy sprintu.
- Niezdolność do precyzyjnego przedstawienia swoich dokonań podczas rozmów o awans, podwyżkę czy w trakcie procesów rekrutacyjnych.
- Brak udokumentowanej historii pracy, co utrudnia analizę własnej produktywności, rozwoju i identyfikację obszarów do poprawy.
- Chaos informacyjny i poczucie, że cenne dokonania umykają bezpowrotnie.

## 3. Wymagania funkcjonalne
### 3.1. Aplikacja i platforma
- Aplikacja będzie natywną aplikacją desktopową działającą wyłącznie na systemie macOS.
- Aplikacja będzie działać w tle, z ikoną na pasku menu systemowym.

### 3.2. Uwierzytelnianie i zarządzanie użytkownikiem
- Użytkownicy mogą stworzyć konto i logować się za pomocą adresu e-mail i hasła.
- System uwierzytelniania będzie oparty na usłudze Supabase.
- Funkcje wymagające uwierzytelnienia (np. generowanie podsumowań AI) będą niedostępne dla niezalogowanych użytkowników.

### 3.3. System zapisywania aktywności
- Aplikacja cyklicznie wyświetla okno pop-up z pytaniem "Nad czym teraz pracujesz?".
- Interfejs pop-upu zawiera pole tekstowe, przycisk "Zapisz", przycisk "To samo" (powtarzający ostatni wpis) oraz listę kilku ostatnich unikalnych wpisów do szybkiego wyboru.
- Użytkownik może dodać wpis za pomocą konfigurowalnego, globalnego skrótu klawiszowego.
- Użytkownik może dodać wpis z poziomu głównego okna aplikacji.
- Wpisy są zapisywane z sygnaturą czasową.

### 3.4. Historia i przeglądanie zapisów
- Główne okno aplikacji wyświetla historię zapisów.
- Zapisy są grupowane w karty według dni. Każda karta ma w tytule datę i dzień tygodnia.
- Użytkownik może edytować i usuwać poszczególne wpisy.

### 3.5. Automatyczne podsumowania AI
- Funkcja dostępna wyłącznie dla uwierzytelnionych użytkowników, którzy wyrazili zgodę na przetwarzanie danych.
- System automatycznie generuje podsumowanie w każdą niedzielę o 23:00, analizując wpisy od poniedziałku do niedzieli.
- Do generowania podsumowań wykorzystywane jest API openrouter.ai.
- Wywołanie odbywa się przez funkcję brzegową Supabase (Edge Function), która uwierzytelnia użytkownika, egzekwuje limit oraz ukrywa klucz API OpenRouter przed klientem.
- Wygenerowane podsumowanie jest prezentowane jako specjalna karta w historii, z tytułem zawierającym zakres dat i numer tygodnia (np. "6/10/2025 - 12/10/2025. Tydzień 35").
- Użytkownik może edytować treść wygenerowanego podsumowania, ale nie może go usunąć.
- Obowiązuje limit 5 darmowych podsumowań na 28-dniowy cykl na użytkownika.
- Nieudane próby (błąd sieci lub modelu) nie zmniejszają dostępnego limitu.

### 3.6. Konfiguracja
- Użytkownik może w ustawieniach aplikacji skonfigurować częstotliwość pojawiania się okien pop-up (w zakresie od 30 minut do 4 godzin).
- Użytkownik może zdefiniować własny globalny skrót klawiszowy do dodawania wpisów.

### 3.7. Prywatność i przechowywanie danych
- Wszystkie zapisy użytkownika są domyślnie przechowywane lokalnie na jego komputerze.
- Wysłanie danych do zewnętrznego API w celu wygenerowania podsumowania wymaga jawnej zgody użytkownika (akceptacja regulaminu podczas rejestracji).
- Tylko wpisy z danego tygodnia są tymczasowo przesyłane do funkcji brzegowej; żadne z nich nie są tam persistentnie przechowywane.
- Funkcja brzegowa nie zapisuje treści wpisów ani treści wygenerowanych podsumowań – przetwarzanie jest efemeryczne.

## 4. Granice produktu
- Wersja MVP będzie dostępna wyłącznie na platformę macOS. Wsparcie dla systemów Windows i Linux nie jest objęte zakresem tego wydania.
- Grupa docelowa dla MVP to programiści front-end i back-end.
- W MVP dostępne będą tylko automatyczne, cotygodniowe podsumowania. Generowanie podsumowań na żądanie dla dowolnego okresu nie jest częścią MVP.
- Uwierzytelnianie będzie realizowane tylko przez e-mail i hasło. Inne metody (np. logowanie przez Google, GitHub) nie będą dostępne w MVP.
- Aplikacja nie będzie oferować bezpośrednich integracji z innymi narzędziami (np. Jira, Asana, Git). Użytkownicy mogą używać hashtagów do kategoryzacji wpisów.
- Przechowywanie danych w chmurze ogranicza się do tymczasowego przetwarzania na potrzeby generowania podsumowań. Pełna synchronizacja i backup danych w chmurze nie są częścią MVP.
- Brak trwałego przechowywania wpisów w chmurze; jedynym komponentem serwerowym jest funkcja brzegowa służąca do generowania podsumowań i liczenia limitu.

## 5. Historyjki użytkowników
### US-001: Pierwsze uruchomienie aplikacji
- ID: US-001
- Tytuł: Doświadczenie pierwszego uruchomienia
- Opis: Jako nowy użytkownik, po pierwszym uruchomieniu aplikacji chcę zobaczyć krótkie wprowadzenie wyjaśniające jej działanie, abym mógł od razu zrozumieć jej podstawową funkcjonalność i wartość.
- Kryteria akceptacji:
  1. Przy pierwszym uruchomieniu aplikacji wyświetla się okno modalne z krótkim opisem działania aplikacji.
  2. Okno zawiera informację o cyklicznych pop-upach i możliwości dodawania wpisów.
  3. Po zamknięciu okna wprowadzającego, natychmiast pojawia się pierwszy pop-up, zachęcający do dodania pierwszego wpisu.
...

### US-002: Rejestracja użytkownika
- ID: US-002
- Tytuł: Tworzenie nowego konta
- Opis: Jako nowy użytkownik, chcę móc zarejestrować się w aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do funkcji zaawansowanych, takich jak podsumowania AI.
- Kryteria akceptacji:
  1. W aplikacji dostępny jest formularz rejestracji z polami na adres e-mail i hasło.
  2. System waliduje poprawność formatu adresu e-mail.
  3. System wymaga hasła o minimalnej długości.
  4. Podczas rejestracji muszę zaakceptować regulamin, który informuje o przetwarzaniu danych na potrzeby funkcji AI.
  5. Po pomyślnej rejestracji jestem automatycznie zalogowany i widzę ekran główny aplikacji.

### US-003: Logowanie użytkownika
- ID: US-003
- Tytuł: Logowanie do istniejącego konta
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na swoje konto, aby uzyskać dostęp do moich danych i funkcji premium.
- Kryteria akceptacji:
  1. W aplikacji dostępny jest formularz logowania z polami na adres e-mail i hasło.
  2. W przypadku podania błędnych danych, wyświetlany jest stosowny komunikat.
  3. Po pomyślnym zalogowaniu, mam dostęp do wszystkich funkcji, w tym historii i przyszłych podsumowań AI.

### US-004: Zapisywanie aktywności przez pop-up
- ID: US-004
- Tytuł: Dodawanie wpisu za pomocą okna pop-up
- Opis: Jako użytkownik, w trakcie mojej pracy chcę w prosty i szybki sposób zapisać, nad czym aktualnie pracuję, gdy pojawi się okno pop-up.
- Kryteria akceptacji:
  1. Aplikacja w regularnych, skonfigurowanych odstępach czasu wyświetla okno pop-up.
  2. Pop-up zawiera pole tekstowe do wpisania aktywności.
  3. Przycisk "Zapisz" jest aktywny tylko wtedy, gdy pole tekstowe nie jest puste.
  4. Kliknięcie "Zapisz" powoduje zapisanie wpisu z aktualną datą i godziną i zamknięcie pop-upu.
  5. Pop-up można zamknąć bez zapisywania (np. klawiszem Escape lub przyciskiem zamknięcia okna).

### US-005: Zapisywanie powtarzalnej aktywności
- ID: US-005
- Tytuł: Szybkie zapisywanie tej samej czynności
- Opis: Jako użytkownik, który kontynuuje pracę nad tym samym zadaniem, chcę mieć możliwość ponownego zapisania ostatniej aktywności jednym kliknięciem.
- Kryteria akceptacji:
  1. W oknie pop-up widoczny jest przycisk "To samo", którego etykieta zawiera treść ostatniego wpisu.
  2. Kliknięcie przycisku "To samo" zapisuje nowy wpis z treścią ostatniej aktywności i zamyka pop-up.
  3. W oknie pop-up widoczne są również przyciski z kilkoma ostatnimi unikalnymi wpisami, aby umożliwić szybki powrót do niedawnych zadań.

### US-006: Zapisywanie aktywności skrótem klawiszowym
- ID: US-006
- Tytuł: Dodawanie wpisu za pomocą globalnego skrótu klawiszowego
- Opis: Jako użytkownik, który wykonuje nieplanowane zadanie, chcę natychmiast zapisać aktywność bez odrywania rąk od klawiatury, używając globalnego skrótu.
- Kryteria akceptacji:
  1. Aplikacja reaguje na zdefiniowany globalny skrót klawiszowy, nawet gdy nie jest aktywnym oknem.
  2. Użycie skrótu powoduje wyświetlenie okna pop-up do dodania wpisu.
  3. Domyślny skrót jest predefiniowany, ale mogę go zmienić w ustawieniach.

### US-006a: Zapisywanie aktywności z głównego okna aplikacji
- ID: US-006a
- Tytuł: Dodawanie wpisu z poziomu głównego okna
- Opis: Jako użytkownik, który przegląda swoją historię, chcę mieć możliwość dodania nowego wpisu bezpośrednio z głównego okna aplikacji, bez czekania na automatyczny pop-up.
- Kryteria akceptacji:
  1. W głównym oknie aplikacji znajduje się dedykowany przycisk (np. "+ Dodaj wpis").
  2. Kliknięcie przycisku powoduje wyświetlenie okna pop-up do dodania wpisu.
  3. Po zapisaniu wpisu, jest on natychmiast widoczny w historii w głównym oknie.

### US-007: Przeglądanie historii zapisów
- ID: US-007
- Tytuł: Przeglądanie dziennych wpisów
- Opis: Jako użytkownik, chcę mieć możliwość przejrzenia wszystkich moich zapisów z przeszłości, aby przypomnieć sobie, co robiłem w konkretnym dniu.
- Kryteria akceptacji:
  1. Główne okno aplikacji wyświetla listę kart, każda reprezentująca jeden dzień z co najmniej jednym wpisem.
  2. Karty są posortowane chronologicznie, od najnowszej do najstarszej.
  3. Tytuł każdej karty zawiera datę i dzień tygodnia (np. "Poniedziałek, 7/10/2025").
  4. Wewnątrz karty znajduje się lista wszystkich zapisów z danego dnia.
  5. Wpisy powtarzające się będą oznaczone etykieta np `x3`.
  6. Wpisy powtarzające sie będą grupowane pod etykieta tylko wtedy kiedy nastąpily bezposrednio po sobie. Ten sam wpis przerwany innym zadaniem nie będzie mial etykiety, chyba ze kolejny wpis wystal bezposrednio po sobie. Np.
  ```
  - praca nad logowaniem
  - pomoc koledze
  - praca nad logowniem 'x2'
  ```

### US-008: Edycja istniejącego wpisu
- ID: US-008
- Tytuł: Poprawianie zapisanego wpisu
- Opis: Jako użytkownik, chcę mieć możliwość edytowania treści istniejącego wpisu, na wypadek gdybym popełnił błąd lub chciał coś doprecyzować.
- Kryteria akceptacji:
  1. Przy każdym wpisie w historii znajduje się opcja (np. ikona lub przycisk) pozwalająca na jego edycję.
  2. Po kliknięciu opcji edycji, treść wpisu staje się edytowalna.
  3. Po dokonaniu zmian mogę je zapisać lub anulować.
  4. Zmiany są trwale zapisywane w lokalnej bazie danych.

### US-009: Usuwanie istniejącego wpisu
- ID: US-009
- Tytuł: Usuwanie błędnego wpisu
- Opis: Jako użytkownik, chcę mieć możliwość usunięcia wpisu, który został dodany przez pomyłkę lub jest już nieistotny.
- Kryteria akceptacji:
  1. Przy każdym wpisie w historii znajduje się opcja pozwalająca na jego usunięcie.
  2. Przed ostatecznym usunięciem wyświetlane jest okno z prośbą o potwierdzenie.
  3. Po potwierdzeniu, wpis jest trwale usuwany z lokalnej bazy danych.

### US-010: Otrzymywanie cotygodniowego podsumowania
- ID: US-010
- Tytuł: Automatyczne generowanie podsumowania tygodnia
- Opis: Jako zalogowany użytkownik, chcę, aby system automatycznie analizował moje wpisy z całego tygodnia i generował zwięzłe podsumowanie moich dokonań, gotowe do wykorzystania.
- Kryteria akceptacji:
  1. W każdą niedzielę o 23:00 system automatycznie uruchamia proces generowania podsumowania dla użytkowników, którzy wyrazili na to zgodę.
  2. Proces zbiera wszystkie wpisy od ostatniego poniedziałku do bieżącej niedzieli.
  3. Zebrane dane są wysyłane do API openrouter.ai w celu wygenerowania podsumowania.
  4. Wygenerowane podsumowanie jest zapisywane i pojawia się w widoku historii jako specjalna karta.
  5. Karta podsumowania ma tytuł w formacie "DD-MMM-RRRR - DD-MMM-RRRR . Tydzień NN".
  6. Treść podsumowania jest listą punktowaną.

### US-011: Osiągnięcie limitu podsumowań
- ID: US-011
- Tytuł: Obsługa limitu podsumowań w cyklu
- Opis: Jako użytkownik, który wykorzystał już 5 podsumowań w bieżącym 28-dniowym cyklu, chcę otrzymać jasną informację, że kolejne podsumowanie będzie dostępne dopiero po odnowieniu cyklu.
- Kryteria akceptacji:
  1. System zlicza liczbę wygenerowanych podsumowań dla każdego użytkownika w ramach jego bieżącego 28-dniowego cyklu.
  2. Gdy licznik osiągnie 5, automatyczne generowanie podsumowań jest wstrzymywane aż do rozpoczęcia nowego cyklu.
  3. W miejscu, gdzie powinno pojawić się podsumowanie, wyświetlany jest komunikat informujący o osiągnięciu limitu i dacie odnowienia cyklu.

### US-012: Konfiguracja częstotliwości powiadomień
- ID: US-012
- Tytuł: Dostosowanie częstotliwości pop-upów
- Opis: Jako użytkownik, chcę mieć możliwość zmiany częstotliwości pojawiania się okien pop-up, aby dopasować ją do mojego stylu pracy.
- Kryteria akceptacji:
  1. W ustawieniach aplikacji znajduje się opcja do konfiguracji interwału czasowego dla pop-upów.
  2. Mogę wybrać jedną z predefiniowanych wartości (np. 30 min, 1h, 2h, 4h).
  3. Wybrana wartość jest zapisywana i aplikacja stosuje nowy interwał.

## 6. Metryki sukcesu
- Główny wskaźnik (North Star Metric): Procent uwierzytelnionych użytkowników, którzy co tydzień otwierają i przeglądają swoje automatycznie wygenerowane podsumowanie. Cel: >40%.
- Aktywacja: Procent użytkowników, którzy dokonali co najmniej jednego zapisu w ciągu pierwszych 24 godzin od instalacji. Cel: >60%.
- Zaangażowanie: Średnia liczba zapisów dodawanych przez aktywnego użytkownika dziennie. Cel: >3.
- Retencja: Procent użytkowników, którzy nadal korzystają z aplikacji (co najmniej 1 wpis w tygodniu) po 1 i 4 tygodniach od instalacji. Cel: 40% po 1 tygodniu, 20% po 4 tygodniach.
