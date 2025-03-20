// JavaScript implementation of the SLOP pattern
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { setMcpRoutes } from './mcp.js';
import { setSlopRoutes } from './slop.js';

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

// Start server
app.listen(3000, async () => {
    console.log('✨ Stringly Typed Store running on http://localhost:3000\n');
    axios.create({ baseURL: 'http://localhost:3000' });
});