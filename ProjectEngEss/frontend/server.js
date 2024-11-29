import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Define __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from "public"
app.use(express.static("public"));

// Serve "HTML/index.html" for the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "registerPage.html"));
});

app.get("/battlePage", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "html", "battlePage.html"));
  });

const PORT = 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Frontend Server ready at http://localhost:${PORT}`);
});
