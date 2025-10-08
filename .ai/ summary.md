<conversation_summary>
<decisions>

Grupa docelowa MVP: Programiści front-end i back-end. Na tym etapie nie zakłada się istotnych różnic w ich potrzebach.

Platforma MVP: Wyłącznie macOS.

Główna funkcjonalność (Zapisywanie): Aplikacja działa w tle i wyświetla okno pop-up w celu zapisywania aktywności. Użytkownik może wyłączyć aplikację, aby zatrzymać powiadomienia.

Mechanizm Zapisywania: Wpisy dodawane są w oknie pop-up, które zawiera: pole tekstowe, przycisk "Zapisz" (aktywny po wpisaniu tekstu) oraz przycisk "To samo" (z etykietą zawierającą treść ostatniego wpisu). Dodatkowo, dostępny jest globalny skrót klawiszowy.

Główna funkcjonalność (Podsumowania): W wersji MVP dostępne będą tylko automatyczne, cotygodniowe podsumowania generowane przez AI. Funkcja jest dostępna wyłącznie dla zalogowanych użytkowników.

Widok historii zapisów: Użytkownik będzie przeglądał swoje zapisy w formie listy kart. Każda karta będzie reprezentować jeden dzień, zawierając w tytule datę i dzień tygodnia, a w treści listę wszystkich zapisów z tego dnia.

Technologia AI: Do generowania podsumowań zostanie wykorzystane API openrouter.ai.

Limit: Użytkownicy zalogowani będą mieli limit 5 automatycznych podsumowań miesięcznie w celu ochrony systemu przed nadużyciami.

Przechowywanie danych: Dane są przechowywane lokalnie. Wpisy są wysyłane do chmury w celu przetworzenia przez AI tylko dla uwierzytelnionych użytkowników, którzy zaakceptowali regulamin.

Uwierzytelnianie (Logowanie): Logowanie odbywać się będzie przez e-mail i hasło za pośrednictwem Supabase.

Interfejs i UX: Użytkownik będzie mógł skonfigurować częstotliwość pop-upów oraz zdefiniować własny skrót klawiszowy.

Onboarding: Przy pierwszym uruchomieniu użytkownik zobaczy okno z informacją o działaniu aplikacji. Po jego zamknięciu pojawi się pierwszy pop-up zachęcający do dokonania zapisu.

</decisions>

<matched_recommendations>

Fokus na jednej platformie: Decyzja o skupieniu się wyłącznie na macOS w wersji MVP jest zgodna z rekomendacją, aby przyspieszyć dostarczenie produktu na rynek.

Kontrola użytkownika nad pop-upami: Zaakceptowano rekomendację, aby dać użytkownikom możliwość konfiguracji częstotliwości wyskakujących okienek (od 30 min do 4 godzin).

Uproszczone tagowanie: Zgodnie z sugestią, zamiast pełnych integracji, MVP pozwoli na proste tagowanie wpisów za pomocą hasztagów.

Przejrzysta komunikacja o AI: Przyjęto model informowania o przetwarzaniu danych w chmurze poprzez zapis w regulaminie oraz ikonę przy wygenerowanym podsumowaniu.

Wizualizacja powtarzalnych zadań: Zaakceptowano pomysł, aby w liście wpisów agregować powtórzenia zadania i oznaczać je mnożnikiem (np. x3).

Zdefiniowany proces onboardingu: Proces wprowadzenia nowego użytkownika opiera się na rekomendacji "pokaż, nie opowiadaj" – krótki modal z informacjami, a następnie natychmiastowa akcja (pierwszy pop-up).
</matched_recommendations>

<prd_planning_summary>
Poniższe podsumowanie stanowi podstawę do stworzenia dokumentu wymagań produktowych (PRD) dla wersji MVP aplikacji MindReel.

a. Główne wymagania funkcjonalne produktu:

Aplikacja desktopowa dla macOS: Natywna aplikacja działająca w tle.

System zapisywania aktywności:

Konfigurowalne, cykliczne powiadomienia (pop-up) z pytaniem "Nad czym teraz pracujesz?".

Interfejs pop-upu z polem tekstowym, przyciskiem "Zapisz" i przyciskiem "To samo". Dodatkowo kilka ostatnich wpisów w formie przycisku, aby uzytkownik mógl latwo zapisać to co juz robil np 3 wpisy temu jezeli wrocil do tego zadania.

Możliwość dodawania zapisów za pomocą globalnego skrótu klawiszowego.

Automatyczne podsumowania AI:

Dostępne tylko dla uwierzytelnionych użytkowników (Supabase).

Raz w tygodniu system automatycznie zbiera zapisy użytkownika i wysyła je do API openrouter.ai.

AI generuje zwięzłe podsumowanie pracy z całego tygodnia w formie listy punktowanej.

Użytkownik ma nałożony limit 5 podsumowań miesięcznie.

Widok historii zapisów:

Interfejs do przeglądania przeszłych zapisów.

Prezentacja danych w formie listy kart, gdzie każda karta to osobny dzień.

Tytuł karty zawiera datę i dzień tygodnia.

Podsumowanie musi sie odznaczać od innych wpisów. W tytule bedzie data poczatku i końca tygodnia i numer tygodnia w roku. np 6/10/2025 - 12/10/2025. Tydzien 35. Podsumowanie będzie wyświetalne zawsze po niedzieli.

Podsumowania będą podsumowywac wpisy od poniedzialku do niedzieli. W kolejnych wersjach bedzie mozna ustalic czestotliwosc i zakres podsumowywanych dni.

Przechowywanie i prywatność danych:

Domyślne przechowywanie wszystkich zapisów lokalnie na komputerze użytkownika.

Wyraźna zgoda użytkownika (akceptacja regulaminu) jest wymagana do wysłania danych do chmury w celu analizy przez AI.

b. Kluczowe historie użytkownika i ścieżki korzystania:

Pierwsze uruchomienie (Onboarding): Jako nowy użytkownik, po instalacji aplikacji widzę proste okno wyjaśniające jej działanie. Po jego zamknięciu, od razu pojawia się pierwszy pop-up, dzięki czemu mogę natychmiast dokonać swojego pierwszego zapisu i zrozumieć podstawową funkcjonalność.

Codzienna praca (Zapisywanie): Jako programista, w trakcie dnia otrzymuję dyskretne powiadomienia i w kilka sekund zapisuję swoje zadania (np. "Praca nad #feature-login"). Kiedy kontynuuję zadanie, używam przycisku "To samo". Do zadań ad-hoc używam skrótu klawiszowego, aby nie odrywać rąk od klawiatury.

Przeglądanie historii: Jako użytkownik, chcę sprawdzić, co robiłem w zeszły poniedziałek. Otwieram główne okno aplikacji i przewijam listę kart do karty z tytułem "Poniedziałek, [data]", gdzie widzę wszystkie moje zapisy z tego dnia.

Tygodniowy przegląd (Podsumowanie): Jako uwierzytelniony użytkownik, pod koniec tygodnia otrzymuję automatycznie wygenerowane podsumowanie moich dokonań. Otwieram aplikację, przeglądam czytelną listę punktowaną.

Jedna z opcji dodawania wpisu bedzie przycisk w glównym oknie aplikacji 'dodaj wpis'. Po otworzeniu aplikacji kilkam przycisk dodaj wpis abym dodac nad czym teraz pracuje.

Wpisy codziennie będą mialy możliwość edycji i usuwania. W podsumowaniach tez będzie możliwość edycji, ale nie będzie opcji usuwania.

c. Ważne kryteria sukcesu i sposoby ich mierzenia:

Wskaźnik "North Star" (Główny cel): Procent uwierzytelnionych użytkowników, którzy co tydzień otwierają i przeglądają swoje automatycznie wygenerowane podsumowanie.

Aktywacja: Procent użytkowników, którzy dokonali co najmniej jednego zapisu w ciągu pierwszych 24 godzin od instalacji.

Zaangażowanie: Średnia liczba zapisów dodawanych przez aktywnego użytkownika dziennie.

Retencja: Procent użytkowników, którzy nadal korzystają z aplikacji po 1 i 4 tygodniach od instalacji.

Limit podsumowań: gdy AI wygeneruje podsumowanie, to będzie zapisane w bazie danych. Gdy użytkownik osiągnie limit 5 podsumowań w miesiącu, przy próbie wygenerowania kolejnego podsumowania, pojawi się komunikat informujący o osiągnięciu limitu i zachęcający do odczekania do następnego miesiąca.

Podsumowania będą generowane o 23.00 w nocy w niedzielę.

</prd_planning_summary>

</conversation_summary>
