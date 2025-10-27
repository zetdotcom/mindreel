# Plan testów - MindReel

## Kontekst projektu

MindReel to aplikacja desktopowa na macOS (Electron + React) służąca do zapisywania aktywności zawodowej i generowania tygodniowych podsumowań AI. Dane przechowywane są lokalnie (SQLite), a funkcje AI wymagają uwierzytelnienia (Supabase).

## Zakres testowania

### 1. Testy jednostkowe (Unit Tests)
Framework: Vitest

#### 1.1. Model warstwy - repositories
**Lokalizacja**: `src/sqlite/repositories/`, `src/features/*/model/repository.ts`

**Przypadki testowe**:
- **entriesRepository.ts**
  - Dodawanie nowego wpisu z poprawnymi danymi
  - Aktualizacja istniejącego wpisu
  - Usuwanie wpisu z bazy
  - Pobieranie wpisów dla konkretnego zakresu dat
  - Grupowanie powtarzających się wpisów bezpośrednio po sobie
  - Obsługa pustej bazy danych
  - Walidacja danych wejściowych (puste pole content)

- **summariesRepository.ts**
  - Zapis nowego podsumowania z kluczem tygodnia (weekKey format: YYYY-Wnn)
  - Pobieranie podsumowania dla danego tygodnia
  - Aktualizacja treści istniejącego podsumowania
  - Sprawdzenie niemożności usunięcia podsumowania
  - Prawidłowe obliczanie iso_year i week_of_year dla dat granicznych

- **settingsRepository.ts**
  - Zapis i odczyt częstotliwości pop-upów (30min - 4h)
  - Zapis i odczyt globalnego skrótu klawiszowego
  - Walidacja zakresu wartości częstotliwości

#### 1.2. Utility i pomocnicze funkcje
**Lokalizacja**: `src/sqlite/dateUtils.ts`, `src/lib/utils.ts`

**Przypadki testowe**:
- **dateUtils.ts**
  - Konwersja daty na weekKey (YYYY-Wnn)
  - Obsługa tygodni granicznych (np. tydzień 53, tydzień 01 między latami)
  - Określanie początku i końca tygodnia (pon-niedz)
  - Formatowanie dat w różnych strefach czasowych

- **aiGeneration.ts** (logika przygotowania promptu)
  - Prawidłowe formatowanie wpisów z tygodnia dla AI
  - Obsługa pustej listy wpisów
  - Sanityzacja danych przed wysłaniem do API

#### 1.3. Hooki React (z użyciem React Testing Library)
**Lokalizacja**: `src/features/*/model/*.ts`

**Przypadki testowe**:
- **useEntries.ts**
  - Poprawne ładowanie wpisów przy montowaniu komponentu
  - Dodawanie wpisu i automatyczna aktualizacja listy
  - Edycja wpisu i odświeżenie stanu
  - Usuwanie wpisu i aktualizacja UI

- **useAuth.ts**
  - Sprawdzenie statusu uwierzytelnienia przy starcie
  - Login z poprawnymi danymi
  - Obsługa błędnych danych logowania
  - Rejestracja nowego użytkownika (MVP: bez weryfikacji email)
  - Wylogowanie i czyszczenie kontekstu

- **useCapture.ts**
  - Pobieranie ostatniego wpisu do przycisku "To samo"
  - Pobieranie listy ostatnich unikalnych wpisów
  - Zapis nowego wpisu przez popup

- **useCurrentWeekSummary.ts**
  - Sprawdzenie istnienia podsumowania dla bieżącego tygodnia
  - Generowanie nowego podsumowania (mock API)
  - Obsługa błędu API (nie zmniejsza limitu)
  - Obsługa osiągnięcia limitu (5/28 dni)

### 2. Testy komponentów (Component Tests)
Framework: Vitest + React Testing Library

#### 2.1. Komponenty UI podstawowe
**Lokalizacja**: `src/components/ui/`

**Przypadki testowe**:
- **Input, Textarea, Button**
  - Renderowanie z różnymi wariantami
  - Obsługa stanów (disabled, error, focus)
  - Dostępność (aria-labels, keyboard navigation)

- **Card, Badge, Alert**
  - Renderowanie treści
  - Zastosowanie różnych stylów (neubrutalism)

#### 2.2. Komponenty feature - Auth
**Lokalizacja**: `src/features/auth/ui/`

**Przypadki testowe**:
- **AuthFormLogin.tsx**
  - Renderowanie formularza
  - Walidacja email (format)
  - Walidacja hasła (minimalna długość)
  - Aktywacja przycisku "Zaloguj" dopiero po wypełnieniu obu pól
  - Obsługa błędu logowania (wyświetlenie komunikatu)
  - Pomyślne logowanie (wywołanie callback)

- **AuthFormRegister.tsx**
  - Walidacja email i hasła
  - Checkbox akceptacji regulaminu (required)
  - Przycisk nieaktywny bez akceptacji regulaminu
  - Komunikat o pomyślnej rejestracji
  - MVP: brak weryfikacji email - użytkownik od razu zalogowany

- **AuthFormPasswordChange.tsx**
  - Pola: obecne hasło, nowe hasło, powtórz nowe hasło
  - Walidacja zgodności nowych haseł
  - Komunikat o błędnym obecnym haśle
  - Potwierdzenie zmiany hasła

- **ProtectedFeatureGate.tsx**
  - Blokada dostępu dla niezalogowanych
  - Wyświetlenie komunikatu o konieczności logowania
  - Przepuszczenie zalogowanych użytkowników

#### 2.3. Komponenty feature - Capture
**Lokalizacja**: `src/features/capture/ui/`

**Przypadki testowe**:
- **CapturePopup.tsx**
  - Renderowanie pola tekstowego
  - Przycisk "Zapisz" nieaktywny dla pustego pola
  - Przycisk "To samo" z etykietą ostatniego wpisu
  - Lista ostatnich unikalnych wpisów jako przyciski
  - Zapis wpisu po kliknięciu "Zapisz"
  - Zamknięcie okna po zapisaniu
  - Zamknięcie okna klawiszem Escape bez zapisu

#### 2.4. Komponenty feature - Entries
**Lokalizacja**: `src/features/entries/ui/`

**Przypadki testowe**:
- **EntryForm.tsx**
  - Dodawanie nowego wpisu z głównego okna
  - Walidacja pustego pola
  - Potwierdzenie zapisu

- **EntryList.tsx**
  - Wyświetlanie listy wpisów z danego dnia
  - Grupowanie powtarzających się wpisów (etykieta x3)
  - Rozdzielenie grup przez inne wpisy
  - Ikona edycji i usuwania przy każdym wpisie
  - Edycja wpisu (inline lub modal)
  - Potwierdzenie usunięcia wpisu (dialog)

#### 2.5. Komponenty feature - Summaries
**Lokalizacja**: `src/features/summaries/ui/`

**Przypadki testowe**:
- **CurrentWeekSummarySection.tsx**
  - Wyświetlenie istniejącego podsumowania
  - Tytuł w formacie: "YYYY-Wnn: DD/MM/YYYY - DD/MM/YYYY"
  - Treść jako lista punktowana
  - Możliwość edycji treści
  - Brak przycisku usuwania
  - Komunikat o osiągnięciu limitu (5/28 dni)
  - Loading state podczas generowania

#### 2.6. Komponenty feature - Onboarding
**Lokalizacja**: `src/features/onboarding/ui/`

**Przypadki testowe**:
- **OnboardingModal.tsx**
  - Wyświetlenie przy pierwszym uruchomieniu
  - Czytelny opis działania aplikacji
  - Zamknięcie modalu
  - Wyświetlenie pierwszego pop-upu po zamknięciu

#### 2.7. Widoki (Views)
**Lokalizacja**: `src/views/`

**Przypadki testowe**:
- **HistoryPageView.tsx**
  - Wyświetlenie listy kart dni
  - Sortowanie chronologiczne (od najnowszych)
  - Tytuł karty: "Poniedziałek, DD/MM/YYYY"
  - Podsumowanie wyświetlane po niedzieli
  - Przycisk "+ Dodaj wpis"

- **CaptureWindowView.tsx**
  - Renderowanie CapturePopup
  - Obsługa global shortcut (test e2e)

- **SettingsView.tsx**
  - Wybór częstotliwości pop-upów (dropdown)
  - Konfiguracja globalnego skrótu klawiszowego
  - Zapis ustawień

### 3. Testy integracyjne (Integration Tests)
Framework: Vitest

#### 3.1. IPC Handlers (main process)
**Lokalizacja**: `src/ipc/`

**Przypadki testowe**:
- **databaseHandlers.ts**
  - Komunikacja renderer -> main dla operacji DB
  - Poprawne zwracanie danych z SQLite
  - Obsługa błędów bazy danych

- **captureWindowHandlers.ts**
  - Otwieranie okna capture
  - Wysyłanie danych z capture window do main window
  - Zamykanie okna po zapisaniu

- **globalShortcutManager.ts**
  - Rejestracja globalnego skrótu
  - Wyzwalanie okna capture
  - Zmiana skrótu w runtime
  - Obsługa konfliktów skrótów

#### 3.2. Supabase API - Edge Functions
**Lokalizacja**: `supabase/functions/generate_weekly_summary/`

**Przypadki testowe**:
- Uwierzytelnienie użytkownika przed wywołaniem
- Walidacja zakresu dat (poniedziałek-niedziela)
- Sprawdzenie limitu quota przed wywołaniem AI
- Wysłanie wpisów do OpenRouter API
- Zapis wygenerowanego podsumowania (tylko lokalnie)
- Inkrementacja quota po udanym generowaniu
- Brak inkrementacji quota po błędzie API
- Obsługa błędów sieci/timeout

#### 3.3. Integracja Auth + Database
**Przypadki testowe**:
- Rejestracja użytkownika zapisuje dane w Supabase
- Login pobiera sesję i zapisuje w AuthContext
- Wylogowanie czyści lokalną sesję
- Sprawdzenie sesji przy starcie aplikacji
- Refresh token przy wygasłej sesji

### 4. Testy End-to-End (E2E)
Framework: Playwright (dla aplikacji Electron)

#### 4.1. Scenariusze użytkownika

**US-001: Pierwsze uruchomienie**
1. Uruchom aplikację po raz pierwszy
2. Sprawdź wyświetlenie OnboardingModal
3. Zamknij modal
4. Sprawdź wyświetlenie pierwszego CapturePopup

**US-002/003: Rejestracja i logowanie**
1. Otwórz modal rejestracji
2. Wypełnij email, hasło
3. Zaakceptuj regulamin
4. Zarejestruj się
5. Sprawdź automatyczne zalogowanie (MVP)
6. Wyloguj się
7. Zaloguj ponownie z tymi samymi danymi

**US-004: Zapisywanie aktywności przez pop-up**
1. Poczekaj na automatyczny pop-up (lub wywołaj shortcut)
2. Wpisz treść zadania
3. Sprawdź aktywację przycisku "Zapisz"
4. Zapisz wpis
5. Sprawdź zamknięcie pop-upu
6. Otwórz główne okno
7. Sprawdź pojawienie się wpisu w historii

**US-005: Zapisywanie powtarzalnej aktywności**
1. Dodaj wpis "Praca nad logowaniem"
2. Poczekaj na następny pop-up
3. Sprawdź przycisk "To samo" z etykietą
4. Kliknij "To samo"
5. Sprawdź dodanie drugiego wpisu

**US-006: Skrót klawiszowy**
1. Zmień globalny skrót w ustawieniach
2. Użyj nowego skrótu (aplikacja w tle)
3. Sprawdź wyświetlenie pop-upu

**US-007: Przeglądanie historii**
1. Dodaj wpisy w różne dni
2. Otwórz widok historii
3. Sprawdź karty dni z datami
4. Sprawdź sortowanie chronologiczne
5. Sprawdź grupowanie powtarzających się wpisów (x2, x3)

**US-008/009: Edycja i usuwanie wpisów**
1. Kliknij ikonę edycji przy wpisie
2. Zmień treść
3. Zapisz
4. Sprawdź aktualizację
5. Kliknij ikonę usuwania
6. Potwierdź w dialogu
7. Sprawdź usunięcie wpisu

**US-010: Automatyczne podsumowanie**
1. Dodaj wpisy przez cały tydzień (pon-niedz)
2. Zmień systemowy czas na niedzielę 23:00 (lub wywołaj ręcznie funkcję)
3. Zaloguj się jako użytkownik
4. Sprawdź wygenerowanie podsumowania
5. Sprawdź tytuł: "YYYY-Wnn: DD/MM/YYYY - DD/MM/YYYY"
6. Sprawdź treść jako listę punktowaną
7. Sprawdź możliwość edycji
8. Sprawdź brak przycisku usuwania

**US-011: Limit podsumowań**
1. Wygeneruj 5 podsumowań w ciągu 28 dni
2. Próbuj wygenerować 6. podsumowanie
3. Sprawdź komunikat o osiągnięciu limitu
4. Sprawdź datę odnowienia cyklu

**US-012: Konfiguracja ustawień**
1. Otwórz ustawienia
2. Zmień częstotliwość pop-upów na 2h
3. Zapisz
4. Sprawdź nowy interwał

### 5. Testy wydajnościowe i bezpieczeństwa

#### 5.1. Wydajność SQLite
- Dodanie 10 000 wpisów i pomiar czasu zapisu
- Odczyt 10 000 wpisów i pomiar czasu ładowania
- Grupowanie powtarzających się wpisów dla dużej ilości danych

#### 5.2. Bezpieczeństwo
- Sprawdzenie braku logowania kluczy API w konsoli
- Weryfikacja, że klucz OpenRouter nie jest dostępny w renderer process
- Sprawdzenie, że hasła nie są logowane ani przechowywane w plain text
- Walidacja XSS w polach tekstowych (escape HTML)
- Sprawdzenie SQL injection w queries (parametryzowane zapytania)

### 6. Testy dostępności (a11y)

- Nawigacja klawiaturą we wszystkich formułach
- Aria-labels dla wszystkich interaktywnych elementów
- Obsługa screen readerów (VoiceOver na macOS)
- Kontrast kolorów zgodny z WCAG 2.1 AA
- Focus states dla wszystkich elementów

## Priorytetyzacja testów

### Krytyczne (P0) - Must have przed release
- Testy jednostkowe repositories (entries, summaries, settings)
- Testy komponentów Auth (login, register)
- Testy komponentów Capture (popup, zapis)
- E2E: Pierwsze uruchomienie, rejestracja, zapisywanie aktywności
- Bezpieczeństwo: brak wycieków kluczy API

### Wysokie (P1) - Ważne dla UX
- Testy komponentów Entries (lista, edycja, usuwanie)
- Testy komponentów Summaries (generowanie, wyświetlanie)
- E2E: Przeglądanie historii, edycja/usuwanie wpisów
- Testy IPC handlers
- Testy dostępności podstawowe

### Średnie (P2) - Nice to have
- Testy utils i dateUtils
- E2E: Ustawienia, zmiana skrótu klawiszowego
- Testy wydajnościowe dla dużych zbiorów danych
- Testy dostępności zaawansowane

### Niskie (P3) - Opcjonalne
- Testy snapshots UI (inline snapshots)
- Testy wizualne (porównanie screenshotów)
- Dodatkowe testy edge cases

## Konfiguracja testów

### Vitest config
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**'
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70
      }
    }
  }
})
```

### Setup file
```typescript
// src/tests/setup.ts
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Electron IPC
global.window.electron = {
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    send: vi.fn()
  }
}

// Mock Supabase
vi.mock('@/supabase/rendererClient', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn()
    }
  }
}))
```

## Metryki sukcesu testowania

- **Pokrycie kodu (code coverage)**: minimum 70% dla kodu krytycznego (repositories, auth, capture)
- **Czas wykonania testów jednostkowych**: < 30s
- **Czas wykonania testów E2E**: < 5 min
- **Zero błędów bezpieczeństwa** wykrytych w testach
- **100% przypadków P0** zielonych przed release

## Narzędzia i środowisko

- **Vitest**: testy jednostkowe i komponentów
- **React Testing Library**: testy komponentów React
- **Playwright/Spectron**: testy E2E dla Electron
- **better-sqlite3**: mockowanie bazy danych w testach
- **MSW (Mock Service Worker)**: mockowanie API calls
- **axe-core**: automatyczne testy dostępności

## Plan wdrożenia testów

1. **Sprint 1**: Setup infrastructure (Vitest, RTL, setup files)
2. **Sprint 2**: Testy jednostkowe P0 (repositories, utils)
3. **Sprint 3**: Testy komponentów P0 (Auth, Capture)
4. **Sprint 4**: Testy integracyjne (IPC, Supabase Edge Functions)
5. **Sprint 5**: Testy E2E P0 (główne scenariusze użytkownika)
6. **Sprint 6**: Testy P1 i P2, testy bezpieczeństwa
7. **Sprint 7**: Testy wydajnościowe i dostępności

## Utrzymanie testów

- **Code review**: każda zmiana kodu wymaga aktualizacji/dodania testów
- **CI/CD**: automatyczne uruchamianie testów przy każdym PR
- **Monitoring**: tracking flaky tests i ich naprawa
- **Dokumentacja**: aktualizacja planu testów przy zmianach w PRD
