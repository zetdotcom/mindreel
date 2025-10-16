import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { HistoryPageView } from "./views/History";
import Main from "./views/Main/Main";
import { BrowserRouter } from "react-router";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container #root not found");
}

const root = createRoot(container);
root.render(
  <BrowserRouter>
    <Main />
  </BrowserRouter>,
);
