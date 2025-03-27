# Amate Ninja - Jogo

Este é um jogo de plataforma estilo "stick hero" que pode ser facilmente hospedado na Vercel e incorporado em uma loja Shopify através de iframe.

## Por que usar Vercel + Shopify?

O Shopify tem algumas limitações para a reprodução de áudio em aplicações diretamente hospedadas na plataforma. Ao hospedar o jogo na Vercel e incorporá-lo via iframe no Shopify, podemos contornar essas limitações, permitindo que os sons do jogo funcionem corretamente.

## Estrutura do Projeto

- `index.html` - O arquivo HTML principal do jogo
- `index.js` - O código JavaScript que controla a lógica do jogo
- `index.css` - Estilos CSS para o jogo
- `howling-wind.mp3`, `click.mp3`, `fall.mp3` - Arquivos de áudio
- `vercel.json` - Configuração para deploy na Vercel
- `shopify-iframe.html` - Exemplo de código para incorporar o jogo no Shopify

## Como fazer o deploy na Vercel

1. **Crie uma conta na Vercel**
   - Acesse [vercel.com](https://vercel.com) e crie uma conta gratuita

2. **Crie um repositório Git**
   - Crie um repositório no GitHub, GitLab ou Bitbucket
   - Faça upload de todos os arquivos do jogo para o repositório

3. **Conecte o repositório à Vercel**
   - No painel da Vercel, clique em "New Project"
   - Selecione o repositório que contém os arquivos do jogo
   - Clique em "Import"
   - Mantenha as configurações padrão (o arquivo vercel.json já contém as configurações necessárias)
   - Clique em "Deploy"

4. **Anote a URL do seu projeto**
   - Após o deploy, a Vercel fornecerá uma URL para o seu projeto (por exemplo, `https://amate-ninja.vercel.app`)
   - Esta URL será usada para incorporar o jogo no Shopify

## Como incorporar o jogo no Shopify

1. **Acesse o painel administrativo do Shopify**
   - Faça login em sua conta Shopify

2. **Crie uma nova página**
   - Vá para "Online Store" > "Pages"
   - Clique em "Add page"
   - Dê um nome à página (por exemplo, "Jogo Amate Ninja")

3. **Adicione o código HTML**
   - No editor de página, clique em "Show HTML"
   - Cole o código do arquivo `shopify-iframe.html`
   - **Importante:** Substitua `https://seu-projeto.vercel.app` pela URL real do seu projeto na Vercel

4. **Salve e publique a página**
   - Clique em "Save" e depois em "Publish"

5. **Acesse a página para testar o jogo**
   - Certifique-se de que o jogo está funcionando corretamente, incluindo os sons

## Solução de Problemas

### O jogo não aparece no iframe
- Verifique se a URL do projeto na Vercel está correta
- Verifique se o projeto foi implantado com sucesso na Vercel

### Os sons não funcionam
- Certifique-se de que o usuário interagiu com o iframe antes da reprodução do som (clicou, tocou, etc.)
- Verifique se os arquivos de áudio foram carregados corretamente na Vercel

### O jogo não se adapta bem a diferentes tamanhos de tela
- Ajuste os valores de altura no CSS do arquivo `shopify-iframe.html`

## Customização

Você pode personalizar o jogo alterando os seguintes aspectos:

- Substitua os sons por outros arquivos de áudio
- Modifique as cores e estilos no arquivo `index.css`
- Ajuste a dificuldade do jogo no arquivo `index.js`

## Créditos

Jogo original criado por Hunor Borbely. Adaptações e implementação por Vrz Studio.

---

Para qualquer dúvida ou suporte adicional, entre em contato. 