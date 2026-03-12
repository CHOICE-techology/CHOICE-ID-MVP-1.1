import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// CHOICE iD MVP entry point
createRoot(document.getElementById("root")!).render(<App />);
