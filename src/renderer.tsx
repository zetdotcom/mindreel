import { createRoot } from "react-dom/client";
import "./index.css";

// HashRouter is required for Electron apps because they use file:// protocol
// in production builds. BrowserRouter only works with http:// URLs.
import { HashRouter } from "react-router";
import { AuthProvider } from "@/features/auth";
import { Main } from "./views/Main/Main";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container #root not found");
}

const root = createRoot(container);
root.render(
  <HashRouter>
    <AuthProvider>
      <Main />
    </AuthProvider>
  </HashRouter>,
);
