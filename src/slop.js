// Implementation of the SLOP (Simple Lump of Plaintext) pattern
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// File-based resource functions
const getResourceFiles = () => {
    try {
        return fs.readdirSync(dataDir)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(dataDir, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    return JSON.parse(content);
                } catch (err) {
                    console.error(`Error reading resource file ${file}:`, err);
                    return null;
                }
            })
            .filter(resource => resource !== null);
    } catch (err) {
        console.error('Error reading resource directory:', err);
        return [];
    }
};

const getResourceById = (id) => {
    const filePath = path.join(dataDir, `${id}.json`);
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        }
        return null;
    } catch (err) {
        console.error(`Error reading resource ${id}:`, err);
        return null;
    }
};

const saveResource = (resource) => {
    if (!resource || !resource.id) {
        throw new Error('Resource must have an id');
    }
    
    const filePath = path.join(dataDir, `${resource.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(resource, null, 2));
    return resource;
};

const deleteResource = (id) => {
    const filePath = path.join(dataDir, `${id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
};

// Set up SLOP-related routes
const setSlopRoutes = (app) => {
    // RESOURCES
    // - `GET /resources` - List available resources
    // - `GET /resources/:id` - Get a specific resource
    // - `POST /resources` - Create a new resource
    // - `PUT /resources/:id` - Update a resource
    // - `DELETE /resources/:id` - Delete a resource
    app.get('/resources', (_, res) => {
        const resources = getResourceFiles();
        res.json({ resources });
    });

    app.get('/resources/:id', (req, res) => {
        const resource = getResourceById(req.params.id);
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.json(resource);
    });

    app.post('/resources', (req, res) => {
        try {
            const resource = req.body;
            if (!resource.id) {
                resource.id = `resource_${Date.now()}`;
            }
            
            const saved = saveResource(resource);
            res.status(201).json(saved);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    app.put('/resources/:id', (req, res) => {
        try {
            const id = req.params.id;
            const resource = req.body;
            
            // Ensure the ID in the URL matches the resource ID
            resource.id = id;
            
            const saved = saveResource(resource);
            res.json(saved);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    app.delete('/resources/:id', (req, res) => {
        const deleted = deleteResource(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.json({ status: 'deleted' });
    });
};

export { setSlopRoutes };