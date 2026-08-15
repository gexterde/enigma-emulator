const fs = require('fs');

const content = fs.readFileSync('server.ts', 'utf8');

const routes = `
  // Theme API
  const THEMES_FILE = path.join(process.cwd(), 'themes.json');
  function getThemes() {
    try {
      if (fs.existsSync(THEMES_FILE)) {
        return JSON.parse(fs.readFileSync(THEMES_FILE, 'utf8'));
      }
    } catch (e) {
      console.error('Error reading themes:', e);
    }
    return [];
  }
  function saveThemes(themes) {
    try {
      fs.writeFileSync(THEMES_FILE, JSON.stringify(themes, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing themes:', e);
    }
  }

  app.get("/api/themes", (req, res) => {
    res.json(getThemes());
  });

  app.post("/api/themes", (req, res) => {
    const newTheme = req.body;
    if (!newTheme || !newTheme.id) {
      return res.status(400).json({ error: 'Invalid theme' });
    }
    const themes = getThemes();
    const existingIndex = themes.findIndex(t => t.id === newTheme.id);
    if (existingIndex >= 0) {
      themes[existingIndex] = newTheme;
    } else {
      themes.push(newTheme);
    }
    saveThemes(themes);
    res.json({ success: true, theme: newTheme });
  });

  app.delete("/api/themes/:id", (req, res) => {
    const { id } = req.params;
    let themes = getThemes();
    themes = themes.filter(t => t.id !== id);
    saveThemes(themes);
    res.json({ success: true });
  });
`;

const updatedContent = content.replace(
  '  app.get("/api/health", (req, res) => {',
  routes + '\n  app.get("/api/health", (req, res) => {'
);

const fsImport = `import fs from "fs";\nimport path from "path";`;
let finalContent = updatedContent;
if (!finalContent.includes('import fs from "fs";')) {
  finalContent = finalContent.replace('import path from "path";', fsImport);
}

fs.writeFileSync('server.ts', finalContent, 'utf8');
