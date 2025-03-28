const express = require('express');
const path = require('path');
const app = express();

// Servir arquivos estáticos
app.use(express.static(__dirname));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
const PORT = 5500;
app.listen(PORT, () => {
  console.log(`Servidor frontend rodando em http://localhost:${PORT}`);
}); 