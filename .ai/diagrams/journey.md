<user_journey_analysis>
1. Ścieżki użytkownika (zidentyfikowane z PRD + auth-spec + user stories):
- Pierwsze uruchomienie (US-001): Intro → Pierwszy pop-up → Dodawanie wpisu (bez konta).
- Niezalogowany użytkownik: Korzysta z podstawowych funkcji (zapisywanie aktywności lokalnie), próba dostępu do podsumowania tygodniowego → Gate (CTA: Zaloguj / Zarejestruj).
- Rejestracja (US-002): Formularz (email, hasło, zgoda) → Sukces → Stan oczekiwania na weryfikację email (`email_verification_pending`) → Kliknięcie linku w mailu → Weryfikacja → Zalogowany (premium odblokowane).
- Logowanie (US-003): Formularz login → Walidacja → (email zweryfikowany? Tak → Zalogowany / Nie → `email_verification_pending`).
- Autologin przy starcie: getSession() → (Sesja istnieje? Tak → Zalogowany / Nie → Niezalogowany).
- Reset hasła (inicjacja): Z poziomu `login` wybór „Forgot password?” → `password_reset_request` → Wysłanie maila → Komunikat neutralny → Powrót do `login`.
- Ustawienie nowego hasła (recovery): Deep link / event `PASSWORD_RECOVERY` → `password_set_new` → Ustawienie nowego hasła → Zalogowany.
- Zmiana hasła (dobrowolna): Stan `password_change` (current/new/confirm) → Sukces → Zalogowany (potwierdzenie).
- Wylogowanie: `logout()` → Niezalogowany (wpisy lokalne pozostają).
- Dostęp do funkcji premium (Podsumowanie tygodniowe, US-010): 
  * Stan „Gated” (niezalogowany) → CTA logowania/rejestracji.
  * Stan „Email niezweryfikowany” → CTA weryfikacji.
  * Stan „Pending” (przed niedzielą 23:00) → informacja oczekiwania.
  * Stan „Generowanie” (niedziela 23:00 lub catch-up przy starcie).
  * Wyniki: „Sukces” (karta z listą), „Limit osiągnięty” (quota_exceeded), „Błąd provider / sieć” (retry), „Brak danych tygodnia” (neutralne).
- Próba premium bez weryfikacji: Gate „Zweryfikuj email”.
- Quota (US-011): Po przekroczeniu limitu → komunikat limitu + data odnowienia.
- Catch-up po nieobecności w czasie automatycznego generowania: Przy starcie aplikacji sprawdzenie czy miniona niedziela bez wygenerowanego podsumowania → Trigger generowania.

2. Główne podróże i stany:
A. Podróż Autentykacji:
   - StartAplikacji
   - Niezalogowany
   - Rejestracja
   - EmailVerificationPending
   - Logowanie
   - PasswordResetRequest
   - PasswordSetNew
   - PasswordChange
   - Zalogowany
   - Wylogowanie
B. Podróż Podsumowania:
   - GatedLoginRegister
   - GatedVerifyEmail
   - Pending
   - Generowanie
   - Sukces
   - LimitOsiagniety
   - BladProvider / BladWalidacji / BladSieci (scalone jako BłądGenerowania)
C. Podstawowe funkcje (Entry Capture):
   - DodawanieWpisuPopup
   - DodawanieWpisuShortcut
   - DodawanieWpisuGlowneOkno
   - HistoriaDnia / EdycjaWpisu / UsuwanieWpisu (pomocnicze – w diagramie agregowane)

3. Punkty decyzyjne / alternatywne ścieżki:
- Autologin: if_sesja
- Po logowaniu: if_email_verified
- Po rejestracji: weryfikacja email ręczna → if_email_verified (poll / przycisk „Sprawdziłem”)
- Reset hasła: if_recovery_link (event) → `password_set_new`
- Próba dostępu do premium: if_auth_status (brak sesji / brak weryfikacji / quota)
- Generowanie podsumowania: if_moment_generacji (niedziela 23:00 / catch-up) → if_quota → if_result (sukces / provider_error / validation_error / quota_exceeded)
- Zmiana hasła: if_zmiana_poprawna (poprawne walidacje)
- Wylogowanie: brak kontynuacji premium, powrót do stanu Niezalogowany.

4. Opis celu każdego stanu (skrót):
- StartAplikacji: Inicjalizacja, próba autologinu.
- Niezalogowany: Dostęp tylko do lokalnych wpisów.
- Rejestracja: Utworzenie konta + zgoda.
- EmailVerificationPending: Bramka premium – oczekiwanie na potwierdzenie.
- Logowanie: Dostarczenie poświadczeń istniejącego konta.
- PasswordResetRequest: Wysłanie maila z linkiem recovery (bez ujawniania istnienia konta).
- PasswordSetNew: Ustawienie nowego hasła po recovery (automatyczne logowanie).
- PasswordChange: Zmiana hasła z poziomu zalogowanego użytkownika (bez utraty sesji).
- Zalogowany: Pełny dostęp (weryfikacja wymagana dla premium).
- Wylogowanie: Kończenie sesji – powrót do funkcji podstawowych.
- GatedLoginRegister: CTA logowania/rejestracji dla premium.
- GatedVerifyEmail: CTA weryfikacji email (premium zablokowane).
- Pending: Oczekiwanie na cykl tygodniowy (przed generowaniem).
- Generowanie: Proces tworzenia podsumowania (niedziela 23:00 lub catch-up).
- Sukces: Prezentacja wygenerowanego podsumowania (edycja możliwa).
- LimitOsiagniety: Komunikat o osiągnięciu limitu w cyklu.
- BłądGenerowania: Informacja o błędzie – możliwość ponowienia (retry).
- DodawanieWpisuPopup / Shortcut / GlowneOkno: Różne wejścia dodania wpisu.
- Historia: Przegląd, edycja, usuwanie wpisów (lokalne dane).
</user_journey_analysis>

<mermaid_diagram>
```mermaid
stateDiagram-v2

[*] --> StartAplikacji

state "Autentykacja" as Autentykacja {
  [*] --> StartAplikacji
  StartAplikacji --> if_sesja: getSession()
  state if_sesja <<choice>>
  if_sesja --> Niezalogowany: brak sesji
  if_sesja --> Zalogowany: sesja ok

  Niezalogowany --> Rejestracja: Klik "Zarejestruj"
  Niezalogowany --> Logowanie: Klik "Zaloguj"
  Niezalogowany --> PodstawoweFunkcje

  Rejestracja --> WalidacjaRejestracji: Submit [email+hasło+zgoda ok]
  Rejestracja --> Rejestracja: Submit [błąd walidacji]
  WalidacjaRejestracji --> EmailVerificationPending: signUp success
  EmailVerificationPending --> SprawdzenieWeryfikacji: Klik "Sprawdziłem"
  SprawdzenieWeryfikacji --> if_email_verified
  state if_email_verified <<choice>>
  if_email_verified --> Zalogowany: email zweryfikowany
  if_email_verified --> EmailVerificationPending: niezweryfikowany

  Logowanie --> WalidacjaLogowania: Submit [email+hasło]
  WalidacjaLogowania --> if_login_verified
  state if_login_verified <<choice>>
  if_login_verified --> EmailVerificationPending: konto niezweryfikowane
  if_login_verified --> Zalogowany: login + email ok
  WalidacjaLogowania --> Logowanie: błąd (Invalid credentials)

  Logowanie --> PasswordResetRequest: "Forgot password?"
  PasswordResetRequest --> WysylkaResetu: Submit email
  WysylkaResetu --> Logowanie: Komunikat sukcesu (neutralny)

  state "RecoveryLink" as RecoveryLink {
    [*] --> OczekiwanieLinku
    OczekiwanieLinku --> PasswordSetNew: Event PASSWORD_RECOVERY / Deep link
  }
  PasswordSetNew --> UstawianieNowegoHasla: Submit [hasło+confirm]
  UstawianieNowegoHasla --> if_set_new
  state if_set_new <<choice>>
  if_set_new --> Zalogowany: Sukces
  if_set_new --> PasswordSetNew: Błąd aktualizacji

  Zalogowany --> PasswordChange: Akcja "Zmień hasło"
  PasswordChange --> WalidacjaZmiany: Submit [current/new/confirm]
  WalidacjaZmiany --> if_password_change
  state if_password_change <<choice>>
  if_password_change --> Zalogowany: Hasło zaktualizowane
  if_password_change --> PasswordChange: Błąd zmiany

  Zalogowany --> Wylogowanie: Klik "Wyloguj"
  Wylogowanie --> Niezalogowany

  PodstawoweFunkcje: Lokalny zapis aktywności (pop-up, skrót, główne okno)
  EmailVerificationPending: Premium zablokowane do czasu weryfikacji

  state "Panel użytkownika" as Panel {
    [*] --> Historia
    state Historia <<history>>
  }
}

state "Podsumowanie Tygodniowe" as Podsumowanie {
  [*] --> GatedDecyzja

  state GatedDecyzja <<choice>>
  GatedDecyzja --> GatedLoginRegister: brak sesji
  GatedDecyzja --> GatedVerifyEmail: email niezweryfikowany
  GatedDecyzja --> Pending: sesja ok + zweryfikowany

  ZegarNiedziela: Niedziela 23:00 (automatyczny trigger)
  StartAplikacji --> CatchUpCheck: Autologin zakończony
  CatchUpCheck --> Generowanie: Brak podsumowania minionego tygodnia

  Pending --> Generowanie: ZegarNiedziela
  Generowanie --> if_quota
  state if_quota <<choice>>
  if_quota --> LimitOsiagniety: quota_exceeded
  if_quota --> ProcesGenerowania: quota dostępny

  state "Proces Generowania" as ProcesGenerowania {
    [*] --> ZbieranieDanych
    ZbieranieDanych --> WysylkaEdge: Komplet wpisów (Pon-Ndz)
    WysylkaEdge --> Wynik: Odpowiedź funkcji
    Wynik --> if_result
    state if_result <<choice>>
    if_result --> Sukces: summary ok
    if_result --> BladGenerowania: provider_error / validation_error / sieć
    if_result --> LimitOsiagniety: quota_exceeded
  }

  BladGenerowania --> Generowanie: Retry [warunek dostępności]
  LimitOsiagniety: Komunikat + data odnowienia cyklu
  Sukces: Karta tygodnia (edycja tekstu dozwolona)
}

StartAplikacji --> Autentykacja
Autentykacja --> Podsumowanie
Autentykacja --> Panel

state "Dodawanie Wpisów" as Wpisy {
  [*] --> Popup
  Popup --> ZapisPopup: Klik "Zapisz" [niepuste]
  ZapisPopup --> Popup: Kolejny pop-up (cykliczny)
  Popup --> ToSamo: Klik "To samo"
  ToSamo --> Popup: Zapis powtarzalny
  Popup --> SzybkiWpis: Klik unikalny ostatni wpis
  SzybkiWpis --> Popup
  GlobalnySkrót --> Popup: Skrót klawiszowy
  GlowneOkno --> Popup: "+ Dodaj wpis"
}
Autentykacja --> Wpisy
Wpisy --> Panel

state if_premium_access <<choice>>
Autentykacja --> if_premium_access: Próba użycia funkcji premium
if_premium_access --> Podsumowanie: sesja + email verified
if_premium_access --> GatedLoginRegister: brak sesji
if_premium_access --> GatedVerifyEmail: email nieweryfikowany

note right of Rejestracja
  Pola: email, hasło, zgoda (ToS)
  Walidacje: format email, min długość hasła
end note

note right of EmailVerificationPending
  Użytkownik oczekuje na kliknięcie linku
  Możliwość manualnego odświeżenia statusu
end note

note right of PasswordResetRequest
  Neutralny komunikat – brak ujawnienia istnienia konta
end note

note right of LimitOsiagniety
  Blokada generowania do odnowienia cyklu
end note

note right of Sukces
  Lista punktów podsumowania
  Edycja treści dozwolona
end note

[*] --> StartAplikacji
Panel --> [*]: Zamknięcie aplikacji
</mermaid_diagram>