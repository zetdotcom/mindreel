<tech_stack>
**Electron v38**
Framework do budowy wieloplatformowych aplikacji desktopowych przy użyciu technologii webowych (HTML, CSS, JavaScript/TypeScript). Został wybrany, aby stworzyć natywną aplikację na macOS, która spełnia wymagania PRD (ikona na pasku menu, globalne skróty klawiszowe), jednocześnie umożliwiając łatwe przeniesienie aplikacji na systemy Windows i Linux w przyszłości przy użyciu tej samej bazy kodu.

**React v19**
Biblioteka JavaScript do budowy interfejsów użytkownika. Wybrany ze względu na architekturę opartą na komponentach, która idealnie nadaje się do tworzenia modułowego i łatwego w utrzymaniu UI (np. widok historii, okna pop-up). Przyspiesza rozwój i zapewnia wysoką wydajność renderowania.

**TypeScript v5.9**
Nadbiór języka JavaScript, który dodaje statyczne typowanie. Został wybrany, aby zwiększyć jakość i niezawodność kodu. Pozwala na wyłapywanie błędów na wczesnym etapie rozwoju, ułatwia refaktoryzację i sprawia, że kod jest bardziej zrozumiały i łatwiejszy w utrzymaniu w miarę wzrostu projektu.

**Tailwind CSS v4**
Framework CSS typu "utility-first", który umożliwia szybkie stylowanie interfejsu bezpośrednio w kodzie HTML/JSX. Został wybrany, aby drastycznie przyspieszyć proces tworzenia UI, zapewnić spójność wizualną i uniknąć pisania dużej ilości dedykowanego kodu CSS.

**SQLite v5**
Lekki, bezserwerowy silnik bazy danych SQL działający w oparciu o pliki. Został wybrany jako idealne rozwiązanie do realizacji wymagania PRD dotyczącego przechowywania wszystkich danych użytkownika lokalnie na jego komputerze. Jest szybki, niezawodny i nie wymaga żadnej konfiguracji.

**Node.js**
Środowisko uruchomieniowe dla JavaScript, które jest integralną częścią Electrona i napędza jego proces główny (backend aplikacji). Został wybrany, ponieważ zapewnia dostęp do systemu plików (dla SQLite), umożliwia wykonywanie zapytań sieciowych (do API Supabase i openrouter.ai) oraz zarządza wszystkimi interakcjami z systemem operacyjnym.

**Vite v7**
Nowoczesne narzędzie do budowania projektu (bundler) i serwer deweloperski. Został wybrany ze względu na ekstremalną szybkość działania (natychmiastowy Hot Module Replacement), co znacząco przyspiesza proces deweloperski. Upraszcza konfigurację, zwłaszcza w kontekście wielu punktów wejścia potrzebnych dla okien Electrona.

**react-router v7**
Standardowa biblioteka do routingu w aplikacjach React. Została wybrana do zarządzania różnymi widokami wewnątrz okien aplikacji (np. przełączanie między ekranem logowania a widokiem historii). Umożliwia implementację chronionych ścieżek (dostępnych tylko dla zalogowanych użytkowników) i zapewnia skalowalną architekturę nawigacji.

**Biome v2**
Zintegrowany zestaw narzędzi (linter i formatter) napisany w Rust. Został wybrany, aby zastąpić tradycyjny duet ESLint + Prettier jednym, ekstremalnie szybkim i prostym w konfiguracji narzędziem. Poprawia to komfort pracy i upraszcza zależności projektu, zapewniając jednocześnie wysoką jakość i spójność kodu.
</tech_stack>
