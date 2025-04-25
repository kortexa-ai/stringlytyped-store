// JavaScript implementation of the SLOP pattern
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import https from 'https';
import mkcert from 'mkcert';
import { setMcpRoutes } from './mcp.js';
import { setSlopRoutes } from './slop.js';
import { loadEnv } from './dotenv.js';

// Load environment variables from .env file
loadEnv();

// Environment settings
const nodeEnv = process.env.NODE_ENV || 'development';
const isDevelopment = nodeEnv === 'development';
const port = process.env.USE_PORT || 3002;
const useHttps = isDevelopment && process.env.USE_HTTPS === 'true';
console.log('Environment:', nodeEnv);
console.log('Port:', port);
console.log('Use HTTPS:', useHttps);

// Setup server
const app = express();

app.use(cors({
    origin: function (origin, callback) {
        // TODO: Allow all localhost and stringlytyped.com
        if (!origin) return callback(null, true);
        const allowedOrigins = [
            /^http:\/\/localhost(:[0-9]+)?$/,
            /^https:\/\/localhost(:[0-9]+)?$/,
            /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/,
            /^https:\/\/127\.0\.0\.1(:[0-9]+)?$/,
            /^https:\/\/.*\.stringlytyped\.com$/
        ];
        const allowed = allowedOrigins.some(pattern => pattern.test(origin));
        if (allowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Root endpoint
app.get('/', (_, res) => {
    res.send(`
    <h1>Stringly Typed Store</h1>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/resources">/resources</a></li>
    </ul>
  `);
});

// Set up routes
setSlopRoutes(app);
setMcpRoutes(app);

// Only create certificates in development mode
async function createCertificates() {
    try {
        // Create a certificate authority
        const ca = await mkcert.createCA({
            organization: 'kortexa.ai Dev CA',
            countryCode: 'US',
            state: 'CA',
            locality: 'San Francisco',
            validity: 365
        });

        // Create a certificate signed by the CA
        const cert = await mkcert.createCert({
            domains: ['localhost', '127.0.0.1'],
            validity: 365,
            ca: ca,
            organization: 'kortexa.ai',
            email: 'info@kortexa.ai'
        });

        return {
            key: cert.key,
            cert: cert.cert
        };
    } catch (error) {
        console.error('Error creating certificates:', error);
        return null;
    }
}

async function startServer() {
    // Only use HTTPS in development mode when explicitly enabled
    if (isDevelopment && useHttps) {
        try {
            const certificates = await createCertificates();
            if (!certificates) {
                throw new Error('Failed to create certificates');
            }

            const httpsOptions = {
                key: certificates.key,
                cert: certificates.cert
            };

            https.createServer(httpsOptions, app).listen(port, () => {
                console.log(`✨ Stringly Typed Store`);
                console.log(`Environment: ${nodeEnv}`);
                console.log(`Url: https://localhost:${port}`);
                axios.create({ baseURL: `https://localhost:${port}` });
            });
        } catch (error) {
            console.error('HTTPS setup failed:', error);
            console.log('Falling back to HTTP server...');
            startHttpServer();
        }
    } else {
        startHttpServer();
    }
}

function startHttpServer() {
    app.listen(port, () => {
        console.log(`✨ Stringly Typed Store`);
        console.log(`Environment: ${nodeEnv}`);
        console.log(`Url: http://localhost:${port}`);
        axios.create({ baseURL: `http://localhost:${port}` });
    });
}

startServer();