# Specyfikacja architektury uwierzytelniania i zarządzania kontem użytkownika (MindReel)

Dokument opisuje architekturę funkcjonalności rejestracji, logowania, weryfikacji e‑mail, resetu i zmiany hasła oraz wylogowania dla aplikacji MindReel (US-002, US-003 + rozszerzenie: zmiana hasła). Specyfikacja w języku polskim; komunikaty interfejsu (UX copy) w języku angielskim – krótkie, zwięzłe frazy.

## 1. Zakres

Obejmuje:

- Modal logowania / rejestracji / resetu hasła / ustawienia nowego hasła po recovery / zmiany hasła (wspólna architektura, przełączanie stanów).
- Integracja z Supabase Auth (email + password).
- Przechowywanie session (access/refresh token) w localStorage.
- Obsługa weryfikacji adresu e‑mail (blokada funkcji AI do czasu potwierdzenia).
- Mechanizm resetu hasła korzystający ze standardowego procesu Supabase „password recovery” (link w e‑mailu → ustawienie nowego hasła).
- Mechanizm dobrowolnej zmiany hasła dla zalogowanego użytkownika.
- Decyzje dotyczące integracji w środowisku Electron (renderer-first approach).
- Gating funkcji premium (generowanie podsumowań AI).

Poza zakresem: SSO, social logins, wielokrotne konta, synchronizacja wpisów do chmury.

## 2. Założenia i kontekst

- Aplikacja lokal-first: wpisy i podsumowania przechowywane lokalnie w SQLite.
- Użytkownik niezalogowany może dodawać i przeglądać wpisy.
- Funkcja generowania cotygodniowego podsumowania AI jest dostępna tylko dla zalogowanego i zweryfikowanego użytkownika z zaakceptowanym regulaminem.
- Monokonto: jeden aktywny użytkownik na instancję aplikacji.
- Edge Function `generate_weekly_summary` wywoływana z nagłówkiem `Authorization: Bearer <access_token>`.
- Sesja utrzymywana przez supabase-js; auto-refresh tokenów.
- Offline: jeśli sesja ważna, użytkownik może korzystać z aplikacji; generowanie podsumowania wymaga połączenia.
- Reset hasła nie korzysta z żadnych custom Edge Functions – tylko natywny mechanizm Supabase.
- Deep link: aplikacja obsługuje schemat `mindreel://` do przechwycenia powrotu z linku recovery (pośrednio przez stronę redirect).

## 3. Decyzje architektoniczne (kluczowe)

1. Klient Supabase inicjalizowany w warstwie renderer (React + TypeScript).
2. Brak IPC abstrakcji dla Auth w MVP – prostota > dodatkowa izolacja (możliwa późniejsza migracja).
3. Session przechowywana w localStorage (`supabase.auth.getSession()`).
4. Brak lokalnej kopii użytkownika w SQLite – user state tylko w pamięci + localStorage.
5. Modal Auth jako pojedynczy komponent zawierający state machine: `login | register | email_verification_pending | password_reset_request | password_set_new | password_change`.
6. Reset hasła: wykorzystujemy standard `supabase.auth.resetPasswordForEmail(email, { redirectTo })` (link recovery). Po kliknięciu linku Supabase emituje zdarzenie `PASSWORD_RECOVERY`, aplikacja przełącza się do stanu „Ustaw nowe hasło”.
7. Weryfikacja e‑mail: po rejestracji użytkownik otrzymuje mail weryfikacyjny; do czasu potwierdzenia blokada premium.
8. Zmiana hasła (dla zalogowanego) – stan `password_change` w tym samym modalu.
9. Błędy: prezentujemy czytelne komunikaty; nie ujawniamy istnienia konta przy resetach.

## 4. Interfejs użytkownika

### 4.1. Lokalizacja modalu

- Modal jako portal do głównego drzewa React.
- Najwyższy z-index; pop-up wpisów może być wstrzymany gdy modal otwarty.

### 4.2. Komponenty UI (wysokopoziomowo)

- `AuthModal`
- `AuthModalHeader`
- `AuthFormLogin`
- `AuthFormRegister`
- `AuthEmailVerificationNotice`
- `AuthFormPasswordResetRequest`
- `AuthFormPasswordSetNew` (nowe hasło po recovery)
- `AuthFormPasswordChange` (dobrowolna zmiana dla zalogowanego)
- `AuthFooter`
- `FormField`
- `RegulationsModal`
- `LoadingOverlay`
- `AuthErrorBanner`
- `ProtectedFeatureGate`

### 4.3. Stany modalu (AuthState)

- `login`
- `register`
- `email_verification_pending`
- `password_reset_request` (formularz prośby o link)
- `password_set_new` (wejście po zdarzeniu recovery – ustawienie nowego hasła)
- `password_change` (dobrowolna zmiana)

Przejścia:

- `register` -> sukces -> `email_verification_pending`
- `login` (email niezweryfikowany) -> `email_verification_pending`
- `password_reset_request` -> po wysłaniu -> `login` (komunikat informacyjny)
- Deep link / zdarzenie recovery -> `password_set_new`
- `password_set_new` -> po sukcesie -> zamknięcie modalu
- `password_change` -> po sukcesie -> zamknięcie modalu

### 4.4. Walidacje (frontend)

Email:

- Regex uproszczony: `^[^@\s]+@[^@\s]+\.[^@\s]+$`
- Błąd: `Invalid email address`

Password (rejestracja, ustawienie nowego, zmiana):

- Min długość: 8
- Błąd: `Password is too short (min 8 chars)`

Confirm password:

- Błąd: `Passwords do not match`

Checkbox regulaminu:

- Błąd: `You must accept Terms of Service`

Ogólny błąd sieci:

- `Network error, please try again`

Błędne dane logowania (Supabase):

- `Invalid credentials`

Email już istnieje:

- `Email already registered`

Niezweryfikowany email przy próbie premium:

- `Please verify your email to access this feature`

Reset hasła – wysyłka:

- Sukces (zawsze): `If the account exists, password recovery instructions were sent`

Ustawienie nowego hasła (po recovery):

- Sukces: `Password updated`
- Błąd: `Could not update password`

Zmiana hasła (dobrowolna):

- Sukces: `Password updated`
- Błąd: `Could not update password`

### 4.5. Scenariusze (kluczowe)

1. Rejestracja:
   - Użytkownik wypełnia email, hasło, akceptuje regulamin → `signUp`.
   - Stan `email_verification_pending`.
   - Po weryfikacji (manual „I verified” + `getUser()`) → zamknięcie modalu.

2. Logowanie:
   - `signInWithPassword({ email, password })`.
   - Błąd → banner.
   - Jeśli niezweryfikowany → `email_verification_pending`.
   - Zweryfikowany → zamknięcie modalu.

3. Reset hasła (inicjacja):
   - Link „Forgot password?” → `password_reset_request`.
   - Formularz email → `resetPasswordForEmail(email, { redirectTo })`.
   - Komunikat sukcesu (bez ujawniania istnienia konta).
   - Powrót do `login`.

4. Ustawienie nowego hasła (po linku recovery):
   - Aplikacja otwiera się przez deep link (lub wykrywa event).
   - Modal w stanie `password_set_new`.
   - Użytkownik wpisuje nowe hasło + confirm → `updateUser({ password: newPassword })`.
   - Sukces → zamknięcie modalu.

5. Zmiana hasła (zalogowany):
   - Stan `password_change` z polami current/new/confirm (opcjonalny current jeśli zdecydujemy).
   - `updateUser({ password: newPassword })`.
   - Sukces → zamknięcie + toast.

6. Weryfikacja e‑mail:
   - Poll lub manual „Check again”.
   - Po potwierdzeniu → zamknięcie modalu.

### 4.6. Dostępność (A11y)

- Focus trap, aria roles, Escape zamyka modal (z wyjątkiem gdy krytyczny stan? – dla recovery można pozwolić na zamknięcie, bo użytkownik zaloguje się po ustawieniu hasła).
- Labels powiązane z inputami.

## 5. Warstwa danych (frontend)

`AuthStore` (React context + hook `useAuth()`):

- Fields: `session`, `user`, `status`, `isEmailVerified`
- Methods: `login(email, password)`, `register(email, password, consent)`, `logout()`, `refreshUser()`, `requestPasswordReset(email)`, `setNewPassword(newPassword)`, `changePassword(current, next)`
- Mechanizm `supabase.auth.onAuthStateChange((event, session) => ...)` (obsługa zmian sesji; event `PASSWORD_RECOVERY` przełącza UI – bez publikowania tokenów poza store).
- LocalStorage klucze (sterowane przez supabase-js): `sb-<project-ref>-auth-token`.

Feature gating:

- `canGenerateSummary = user && isEmailVerified`.
- Jeśli brak → `ProtectedFeatureGate` (CTA).

## 6. Backend / Integracja z Supabase

### 6.1. Klient

- Inicjalizacja w pliku `src/supabase/rendererClient.ts`. - juz istnieje

### 6.2. Rejestracja

- `signUp`
- Wymagana weryfikacja email (Supabase dashboard: Require email confirmation).

### 6.3. Logowanie

- `signInWithPassword`
- Odczyt użytkownika, ustawienie flag w store.

### 6.4. Reset hasła – standardowy mechanizm Supabase (password recovery)

Flow:

1. Użytkownik w modalu wybiera „Forgot password?”.
2. Podaje email → wywołanie `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
3. Aplikacja pokazuje neutralny komunikat sukcesu (brak różnicowania czy konto istnieje).
4. Użytkownik otrzymuje e‑mail z linkiem recovery.
5. Link kieruje do strony `redirectTo` (hostowanej HTTPS), która przekierowuje do deep linku `mindreel://auth/recovery#...` (lub używa parametru w hash/query).
6. Aplikacja przechwytuje otwarcie (deep link) i Supabase dostarcza stan recovery (event).
7. Modal przełącza się na `password_set_new` (formularz ustawienia nowego hasła).
8. Użytkownik ustawia nowe hasło → `supabase.auth.updateUser({ password })`.
9. Po sukcesie użytkownik jest zalogowany z nową sesją.

Bezpieczeństwo:

- Brak wysyłki tymczasowego hasła plaintext.
- Token recovery jednorazowy i czasowo ograniczony przez Supabase.
- Neutralna odpowiedź przy inicjacji → ochrona przed enumeracją kont.

Konfiguracja:

- Konieczne ustawienie `SITE_URL` oraz strony pośredniej (jeśli bezpośredni custom scheme nieobsługiwany).
- Opcjonalna personalizacja szablonu maila „Reset Password” w Supabase.

### 6.5. Zmiana hasła

- Zalogowany użytkownik: `supabase.auth.updateUser({ password: newPassword })`.
- Walidacje lokalne (długość, confirm).
- Brak flag wymuszających zmianę.

### 6.6. Weryfikacja e‑mail

- Standard Supabase (link w mailu).
- Aplikacja manualnie odświeża user → potwierdzenie → odblokowanie premium.

### 6.7. Wylogowanie

- `supabase.auth.signOut()`.
- Czyścimy stan w `AuthStore`; wpisy lokalne pozostają.

### 6.8. Edge Function `generate_weekly_summary`

- Wywołanie z `Authorization: Bearer <access_token>`.

## 7. Mechanizmy walidacji wejścia

Front:

- Szybka walidacja formularzy (email, password, confirm).
  Back:
- Supabase waliduje format email / politykę haseł (długość itd.).
  Reset:
- Brak custom backend walidacji – tylko Supabase.
  Zmiana hasła:
- Walidacja długości i zgodności.

## 8. Obsługa błędów

Typy:

- Walidacja frontend.
- Auth Supabase (mapowanie na krótkie komunikaty).
- Sieć (`Network error, please try again`).
- Timeout weryfikacji email (poll): `Verification not detected yet`.

Strategia:

- Każdy formularz ma `AuthErrorBanner`.
- W trakcie wysyłki disabled przyciski.

## 9. Bezpieczeństwo

- Brak service role key w kliencie.
- Reset hasła używa natywnego mechanizmu – brak ekspozycji hasła w mailu.
- localStorage przechowuje token – kontrola nad kodem w Electron ogranicza ryzyko XSS (wciąż audyt zależności).
- Brak integracji z Keychain w MVP (rozszerzenie przyszłe).
- Neutralne komunikaty → trudniejsza enumeracja kont.
- Deep link powinien być prosty (walidacja formatu aby uniknąć wstrzyknięcia danych w URI).

## 10. Komponenty (szczegóły odpowiedzialności)

- `AuthModal`: zarządza stanami.
- `AuthFormLogin`: logowanie.
- `AuthFormRegister`: rejestracja + ToS.
- `AuthEmailVerificationNotice`: instrukcje + odświeżenie.
- `AuthFormPasswordResetRequest`: wysłanie maila recovery.
- `AuthFormPasswordSetNew`: ustawienie nowego hasła po recovery.
- `AuthFormPasswordChange`: dobrowolna zmiana hasła (current/new/confirm – current opcjonalny).
- `ProtectedFeatureGate`: gating premium.
- `RegulationsModal`: regulamin.
- `AuthErrorBanner`: błędy.

## 11. Kontrakty (interfejsy – koncept)

Interface `AuthState`:

- `login | register | email_verification_pending | password_reset_request | password_set_new | password_change`

Interface `AuthStore` (wybrane pola/metody):

- `session?: SupabaseSession`
- `user?: SupabaseUser`
- `status: 'idle' | 'loading' | 'error'`
- `error?: string`
- `login(email: string, password: string): Promise<void>`
- `register(email: string, password: string, tosAccepted: boolean): Promise<void>`
- `requestPasswordReset(email: string): Promise<void>`
- `setNewPassword(newPassword: string): Promise<void>`
- `changePassword(current: string | null, next: string): Promise<void>`
- `logout(): Promise<void>`
- `refreshUser(): Promise<void>`

## 12. Przepływy (pseudokrok)

Rejestracja:

1. Validate.
2. `signUp`.
3. Stan `email_verification_pending`.
4. Odświeżenie -> verified -> zamknięcie.

Logowanie:

1. Validate.
2. `signInWithPassword`.
3. Jeśli niezweryfikowany -> `email_verification_pending`.
4. W przeciwnym razie zamknięcie.

Reset hasła (inicjacja):

1. Użytkownik wpisuje email.
2. `resetPasswordForEmail`.
3. Komunikat neutralny.
4. Stan -> `login`.

Ustawienie nowego hasła:

1. Aplikacja wykrywa kontekst recovery.
2. Stan `password_set_new`.
3. Validate + `updateUser({ password })`.
4. Zamknięcie.

Zmiana hasła:

1. Validate (current opcjonalny).
2. `updateUser`.
3. Toast + zamknięcie.

Weryfikacja email:

1. Poll / manual.
2. Po sukcesie zamknięcie.

## 13. Mechanizm wykrywania weryfikacji email

- Poll co 5s (max ~1 min).
- Manual „Check again” → `getUser()`.
- Sukces: toast `Email verified` + zamknięcie.

## 14. Integracja z generowaniem podsumowań AI

Warunek:

```
if (!canGenerateSummary) {
  showGate()
} else {
  callEdgeFunction()
}
```

Wywołanie:

```
fetch('/functions/v1/generate_weekly_summary', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})
```

## 15. Testy akceptacyjne (mapowanie na US-002, US-003 + nowe)

- Rejestracja bez zaakceptowania ToS -> blokada.
- Rejestracja poprawna -> stan `email_verification_pending`.
- Logowanie niezweryfikowanego konta -> stan `email_verification_pending`.
- Logowanie po weryfikacji -> dostęp do funkcji AI.
- Reset hasła:
  - Wysłanie prośby → komunikat neutralny.
  - Kliknięcie linku w mailu → aplikacja przechodzi do `password_set_new`.
  - Ustawienie nowego hasła → ponowny dostęp (logowanie automatyczne).
- Próba generowania podsumowania bez logowania -> bramka (login CTA).
- Próba generowania podsumowania po logowaniu ale bez weryfikacji -> bramka (verify CTA).
- Zmiana hasła (dobrowolna) -> hasło aktualne, sesja zachowana.
- Offline: próba generowania – błąd sieci -> komunikat.

(Usunięto testy dotyczące tymczasowego hasła i wymuszonej zmiany.)

## 16. Ryzyka

- Deep link może nie zadziałać w nietypowych konfiguracjach systemu (mitigacja: prosta strona pośrednia + instrukcja).
- Możliwa enumeracja adresów email przez timing ataków (mitigacja: neutralne komunikaty, brak różnic w czasach – docelowo throttle).
- localStorage podatne na potencjalny XSS (mitigacja: audyt zależności, przyszłościowo CSP / sandbox).
- Użytkownik może nie zrozumieć konieczności kliknięcia linku (mitigacja: jasny komunikat po wysłaniu requestu).
- Brak Keychain (mitigacja: przyszła integracja).

## 17. Rozszerzenia przyszłościowe (out-of-scope)

- Migracja sesji do Keychain.
- WebAuthn / Passkeys.
- Social login (GitHub, Google).
- Scoring siły hasła + HaveIBeenPwned API.
- Magic links (passwordless).
- Telemetria zdarzeń.
- Izolacja Auth przez główny proces (IPC bridge).

## 18. Style i UI (wysokopoziomowo)

- Tailwind.
- Szerokość modalu ~420px.
- Input states: focus ring, disabled opacity.
- Błędy: czerwony border + label poniżej.

## 19. Konfiguracja środowiska

ENV (renderer):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Reset hasła:

- Brak dodatkowych kluczy (mechanizm natywny).
- Wymagana konfiguracja `SITE_URL` + strona redirect (statyczny hosting).

Edge Functions:

- Service Role Key tylko w środowisku funkcji (nie w rendererze).

## 20. Zmiany wymagane w istniejącym kodzie Edge Function `generate_weekly_summary`

- Weryfikacja nagłówka Authorization (odkomentowanie).

## 21. Monitorowanie i logowanie (MVP)

- Konsola (dev).
- Krytyczne błędy auth: prosty console log.
- Brak zewnętrznej analityki w MVP.

## 22. Podsumowanie

Specyfikacja definiuje spójny modal Auth z wieloma stanami, integrację z Supabase w rendererze, standardowy reset hasła poprzez link recovery (bez wysyłki tymczasowego hasła), ustawianie nowego hasła wewnątrz aplikacji oraz gating funkcji AI według kryteriów (zalogowany, zweryfikowany, zaakceptowany regulamin). Architektura pozostaje zgodna z lokal-first i minimalnym zakresem backendu (tylko istniejąca Edge Function). Ryzyka głównie dotyczą UX linku recovery i bezpieczeństwa warstwy renderer – mitigacje opisane.

--- END OF SPEC ---
