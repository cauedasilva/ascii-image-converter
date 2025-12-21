let originalImage = null;
let originalImageData = null;
let rafId = null;
let buttonRef = true;

const imageInput = document.getElementById('image-input');
const imageName = document.getElementById("image-rendered-name");
const imageTypeText = document.getElementById("image-type");
const asciiArt = document.getElementById("ascii-art");
const imageRenderedCanvas = document.getElementById("image-rendered");
const imageRenderedContainer = document.getElementById("image-rendered-container");
const hiddenCanvas = document.getElementById("ascii-art-canvas");

imageInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    const fileName = event.target.files[0].name;

    if (file && file.type.startsWith('image/')) {
        const imageReader = new FileReader();

        imageReader.onload = async function (e) {
            const imageType = await determineImageType(file);

            if (imageType == "image/png") {
                imageTypeText.textContent = "PNG";
            } else if (imageType == "image/jpeg") {
                imageTypeText.textContent = "JPEG";
            } else if (imageType == "image/webp") {
                imageTypeText.textContent = "WEBP";
            } else if (imageType == "image/svg+xml") {
                imageTypeText.textContent = "SVG";
            } else {
                imageTypeText.textContent = "DESCONHECIDO";
            }

            const img = new Image();

            img.onload = () => {
                originalImage = img;
                drawOriginalImageToPreview(img, true);
                renderASCII();
            };

            imageName.textContent = fileName;
            img.src = e.target.result;
            addButtons();

        }

        imageReader.onerror = function () {
            alert("Erro ao ler a imagem. Tente novamente.");
        };

        imageReader.readAsDataURL(file);

    } else {
        alert("Selecione um arquivo válido.");
        previewImage.src = "";
    }
})

async function determineImageType(file) {
    if (await isSVG(file)) {
        return "image/svg+xml";
    }

    return new Promise((resolve) => {
        const imageReader = new FileReader();

        imageReader.onload = function () {
            const bytes = new Uint8Array(imageReader.result);
            let type = "unknown";

            // PNG: 89 50 4E 47
            if (
                bytes[0] === 0x89 &&
                bytes[1] === 0x50 &&
                bytes[2] === 0x4e &&
                bytes[3] === 0x47
            ) {
                type = "image/png";
            }
            // JPEG: FF D8 FF
            else if (
                bytes[0] === 0xff &&
                bytes[1] === 0xd8 &&
                bytes[2] === 0xff
            ) {
                type = "image/jpeg";
            }
            // WEBP: RIFF
            else if (
                bytes[0] === 0x52 &&
                bytes[1] === 0x49 &&
                bytes[2] === 0x46 &&
                bytes[3] === 0x46
            ) {
                type = "image/webp";
            }

            resolve(type);
        };

        imageReader.readAsArrayBuffer(file.slice(0, 4));
    });

}

function isSVG(file) {
    return new Promise((resolve) => {
        const imageReader = new FileReader();

        imageReader.onload = () => {
            const text = imageReader.result.trim().slice(0, 500);
            const isSvg = text.startsWith("<svg") || text.includes("<svg");
            resolve(isSvg);
        };

        imageReader.readAsText(file);
    });
}

function drawOriginalImageToPreview(img, cache = false) {
    const canvas = document.getElementById("image-preview");
    const ctx = canvas.getContext("2d");

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (cache) {
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
}

function renderASCII() {
    if (!originalImage || rafId) return;

    const canvasPreview = document.getElementById("image-preview");

    rafId = requestAnimationFrame(() => {
        rafId = null;
        drawOriginalImageToPreview(originalImage, false);
        applyFilters(
            canvasPreview,
            +sliderBrightness.value,
            +sliderColor.value
        );

        const resizedCanvas = resizeCanvasForASCII(
            canvasPreview,
            +sliderCharacters.value
        );

        const imageData = imageToGrayscale(resizedCanvas);
        asciiArt.textContent = convertImageDataToASCII(
            imageData,
            resizedCanvas.width
        ).replace(/^\n+/, "");
    });
}

function applyFilters(canvas, brightness = 100, invertColors = 0) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(originalImageData);
    imageData.data.set(originalImageData.data);
    const data = imageData.data;
    const brightnessOffset = brightness - 100
    const invertColorsRatio = invertColors / 100;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        r += brightnessOffset;
        g += brightnessOffset;
        b += brightnessOffset;

        r = r * (1 - invertColorsRatio) + (255 - r) * invertColorsRatio;
        g = g * (1 - invertColorsRatio) + (255 - g) * invertColorsRatio;
        b = b * (1 - invertColorsRatio) + (255 - b) * invertColorsRatio;

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imageData, 0, 0);
}

function imageToGrayscale(canvas) {
    if (canvas.width === 0 || canvas.height === 0) return;

    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(
            0.299 * data[i] +
            0.587 * data[i + 1] +
            0.114 * data[i + 2]
        );

        data[i] = data[i + 1] = data[i + 2] = gray;
    }

    ctx.putImageData(imageData, 0, 0);
    return imageData;
}

function resizeCanvasForASCII(source, targetWidth) {
    const ctx = imageRenderedCanvas.getContext("2d");

    const srcW = source.width || source.naturalWidth;
    const srcH = source.height || source.naturalHeight;

    const r = srcH / srcW;
    const charAspect = 0.75;
    const targetHeight = Math.max(
        1,
        Math.floor(targetWidth * r * charAspect)
    );

    imageRenderedCanvas.width = targetWidth;
    imageRenderedCanvas.height = targetHeight;

    ctx.clearRect(0, 0, imageRenderedCanvas.width, imageRenderedCanvas.height);
    ctx.drawImage(source, 0, 0, imageRenderedCanvas.width, imageRenderedCanvas.height);

    return imageRenderedCanvas;
}

function mapGrayToChar(gray) {
    const density = "      .'`^,:;Il!i><~+_-?][}{1)(|\\/tfrxnuvczXYUJCLQ0OZmwpqdbkhao*#MW&8%B@$";
    const n = density.length;
    const k = Math.floor(gray / 256 * n);
    return density[n - 1 - k];
}

function convertImageDataToASCII(imageData) {
    const data = imageData.data;
    const imgW = imageData.width;
    const imgH = imageData.height;

    let ascii = "";

    for (let y = 0; y < imgH; y++) {
        let rowIndex = y * imgW * 4;

        for (let x = 0; x < imgW; x++) {
            const gray = data[rowIndex];
            ascii += mapGrayToChar(gray);
            rowIndex += 4;
        }

        ascii += "\n";
    }

    return ascii.trimEnd();
}

function addButtons() {
    if (buttonRef) {
        const newDiv = document.createElement("div");
        newDiv.classList.add("ascii-button-container");
        const firstButton = document.createElement("button");
        const secondButton = document.createElement("button");
        firstButton.classList.add("button");
        firstButton.textContent = "Copiar ASCII";
        firstButton.id = "copy-ascii";
        secondButton.classList.add("button");
        secondButton.textContent = "Baixar ASCII em PNG";
        secondButton.id = "download-ascii";
        newDiv.appendChild(firstButton);
        newDiv.appendChild(secondButton);
        imageRenderedContainer.appendChild(newDiv);
    }

    buttonRef = false;
}

const sliderCharacters = document.getElementById("slider-characters");
const sliderCharactersValue = document.getElementById("slider-characters-value");
const sliderBrightness = document.getElementById("slider-brightness");
const sliderBrightnessValue = document.getElementById("slider-brightness-value");
const sliderColor = document.getElementById("slider-color");
const sliderColorValue = document.getElementById("slider-color-value");

sliderCharacters.addEventListener('input', function (event) {
    sliderCharactersValue.textContent = event.target.value;
    renderASCII();
});

sliderBrightness.addEventListener('input', function (event) {
    sliderBrightnessValue.textContent = event.target.value;
    renderASCII();
});

sliderColor.addEventListener('input', function (event) {
    sliderColorValue.textContent = event.target.value;
    renderASCII();
});

const resetButton = document.getElementById("slider-reset-button");

resetButton.addEventListener('click', function (event) {
    sliderCharacters.value = 100;
    sliderCharactersValue.textContent = 100;
    sliderBrightness.value = 100;
    sliderBrightnessValue.textContent = 100;
    sliderColor.value = 0;
    sliderColorValue.textContent = 0;
    renderASCII();
})

document.addEventListener('click', function (event) {
    if (event.target && event.target.id === "copy-ascii") {
        navigator.clipboard.writeText(asciiArt.textContent).then(() => {
            alert('Texto copiado para a área de transferência.');
        }).catch(err => {
            console.error('Não foi possível copiar: ', err);
        });
    }
})

function generateAndDownloadPNG() {
    const text = asciiArt.textContent;
    if (!text.trim()) return;

    const lines = text.split("\n");
    const fontSize = 10;
    const lineHeight = fontSize * 0.75;
    const font = `${fontSize}px monospace`;
    const ctx = hiddenCanvas.getContext("2d");
    ctx.font = font;

    const maxWidth = Math.max(
        ...lines.map(line => ctx.measureText(line).width)
    );

    hiddenCanvas.width = Math.ceil(maxWidth);
    hiddenCanvas.height = Math.ceil(lines.length * lineHeight);

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);

    ctx.fillStyle = "black";
    ctx.font = font;
    ctx.textBaseline = "top";

    lines.forEach((line, i) => {
        ctx.fillText(line, 0, i * lineHeight);
    });

    const dataURL = hiddenCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "ascii.png";
    link.href = dataURL;
    link.click();
}


document.addEventListener('click', function (event) {
    if (event.target && event.target.id === "download-ascii") {
        generateAndDownloadPNG();
    }
})