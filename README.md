# ASCII Image Converter

Conversor de imagens para  ASCII feito em JavaScript puro, executado no navegador.
O projeto utiliza a Canvas API para processamento de imagem e gera arte ASCII em tempo real a partir de imagens locais.

## Funcionalidades

Upload de imagens locais (PNG, JPEG, WebP, SVG)

Ajuste de brilho

Inversão de cores

Controle da densidade de caracteres

Conversão para ASCII em tempo real

Copiar arte ASCII para a área de transferência

Exportar a arte ASCII como imagem PNG

## Funcionamento Geral

A imagem é carregada via input de arquivo

A imagem original é desenhada em um canvas de preview

Filtros de brilho e inversão são aplicados pixel a pixel

A imagem é redimensionada com compensação de aspecto para caracteres ASCII

Os pixels em escala de cinza são convertidos em caracteres ASCII com base na intensidade

O resultado final é exibido em um elemento "pre" e pode ser copiado ou exportado

## Principais Funções

### drawOriginalImageToPreview(img, cache)

Desenha a imagem original no canvas de preview
Quando o parâmetro cache é verdadeiro, armazena os dados originais da imagem (ImageData) para permitir reaplicação de filtros sem perda de qualidade

### renderASCII()

Função central do pipeline de renderização e coordena todo o fluxo de processamento

Redesenha a imagem original

Aplica filtros

Redimensiona a imagem para ASCII

Converte para escala de cinza

Gera o texto ASCII final

Utiliza requestAnimationFrame para evitar renderizações desnecessárias

### applyFilters(canvas, brightness, invertColors)

Aplica filtros de brilho e inversão de cores diretamente nos pixels do canvas usando ImageData
Sempre parte da imagem original armazenada para evitar acúmulo de erros visuais

### resizeCanvasForASCII(source, targetWidth)

Redimensiona a imagem para a largura desejada em caracteres, mantendo o aspecto visual correto para arte ASCII
Compensa a proporção dos caracteres (altura maior que largura)

### imageToGrayscale(canvas)

Converte a imagem para escala de cinza utilizando ponderação RGB:

0.299 R

0.587 G

0.114 B

Retorna o ImageData em tons de cinza

### mapGrayToChar(gray)

Mapeia um valor de cinza (0–255) para um caractere ASCII com base em uma string de densidade, do mais claro ao mais escuro

### convertImageDataToASCII(imageData)

Percorre os pixels da imagem em escala de cinza e gera a arte ASCII linha por linha, respeitando a largura e altura do canvas processado

### generateAndDownloadPNG()

Renderiza o texto ASCII em um canvas oculto e exporta o resultado como uma imagem PNG, mantendo espaçamento e proporção corretos do texto monoespaçado

## Tecnologias Utilizadas

HTML

CSS

JavaScript

Canvas API
