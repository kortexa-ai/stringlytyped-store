// MCP Server implementation for Stringly Typed Store
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');

// Helper functions for working with notes
export const getAllNoteIds = () => {
    try {
        return fs.readdirSync(dataDir)
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''));
    } catch (err) {
        console.error('Error reading notes directory:', err);
        return [];
    }
};

export const getNoteState = async (id) => {
    try {
        const filePath = path.join(dataDir, `${id}.json`);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const note = JSON.parse(content);
            return {
                id,
                status: 'available',
                ...note
            };
        }
        return null;
    } catch (err) {
        console.error(`Error reading note ${id}:`, err);
        return null;
    }
};

export const getNoteContent = async (id) => {
    try {
        const filePath = path.join(dataDir, `${id}.json`);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const note = JSON.parse(content);
            return note.content || '';
        }
        return null;
    } catch (err) {
        console.error(`Error reading note content ${id}:`, err);
        return null;
    }
};

export const saveNote = async (id, content) => {
    try {
        const filePath = path.join(dataDir, `${id}.json`);
        const note = {
            id,
            content,
            updated_at: new Date().toISOString()
        };
        fs.writeFileSync(filePath, JSON.stringify(note, null, 2));
        return note;
    } catch (err) {
        console.error(`Error saving note ${id}:`, err);
        return null;
    }
};

// Set up MCP routes for Express
export function setMcpRoutes(app) {
    const mcpServer = new McpServer({
        name: 'stringlytyped-store',
        version: "1.0.0",
    }, {
        capabilities: {
            resources: {
                subscribe: true,
                listChanged: true,
            }
        }
    });

    // Define the note resource template
    mcpServer.resource(
        "note",
        new ResourceTemplate("notes://{noteId}", {
            list: async () => {
                // Get IDs of all notes
                const noteIds = getAllNoteIds();
                
                // Request state for each note (in parallel)
                const notePromises = noteIds.map(id => getNoteState(id));
                
                // Wait for all requests to complete
                const notes = await Promise.all(notePromises);
                
                // Filter out null values and map to resource format
                return {
                    resources: notes
                        .filter(note => note !== null)
                        .map(note => ({
                            uri: `notes://${note.id}`,
                            name: `Note: ${note.id}`,
                            metadata: {
                                updated_at: note.updated_at || new Date().toISOString()
                            }
                        }))
                };
            }
        }),
        async (uri, { noteId }) => {
            // Get specific note content
            let noteIdString = '';
            if (Array.isArray(noteId) && noteId.length > 0) {
                noteIdString = noteId[0];
            } else if (noteId) {
                noteIdString = noteId.toString();
            }

            // Get note content from the file system
            const noteContent = await getNoteContent(noteIdString);
            
            if (!noteContent) {
                return {
                    contents: [{
                        uri: uri.href,
                        text: `Note ${noteIdString} not found`,
                    }]
                };
            }
            
            return {
                contents: [{
                    uri: uri.href,
                    text: noteContent,
                }]
            };
        }
    );

    // Add tool for creating/updating notes
    mcpServer.tool("createNote", {
        description: "Create or update a note",
        parameters: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "ID of the note to create or update"
                },
                content: {
                    type: "string",
                    description: "Content of the note"
                }
            },
            required: ["id", "content"]
        },
        execute: async ({ id, content }) => {
            try {
                const note = await saveNote(id, content);
                if (note) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Note ${id} saved successfully.`
                            }
                        ]
                    };
                } else {
                    return {
                        isError: true,
                        content: [
                            {
                                type: "text",
                                text: `Failed to save note ${id}.`
                            }
                        ]
                    };
                }
            } catch (error) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: `Error saving note: ${error.message}`
                        }
                    ]
                };
            }
        }
    });

    // Map to store transports by session ID
    const transports = new Map();
    
    // Set up SSE routes
    const sseRouter = express.Router();

    sseRouter.get('/', (_req, res) => {
        // Create new transport for this session
        const transport = new SSEServerTransport("/sse/messages", res);
        
        // Connect transport to MCP server
        mcpServer.server.connect(transport);
        
        // Extract sessionId after connection (it's generated by SSEServerTransport internally)
        const sessionId = transport.sessionId;
        if (sessionId) {
            console.log(`New SSE session established: ${sessionId}`);
            transports.set(sessionId, transport);
            
            // Clean up when connection closes
            res.on('close', () => {
                console.log(`SSE session closed: ${sessionId}`);
                transports.delete(sessionId);
            });
        } else {
            console.error("Failed to get sessionId from transport");
        }
    });

    sseRouter.post('/messages', (req, res) => {
        const sessionId = req.query.sessionId;
        
        if (!sessionId) {
            res.status(400).send('Missing sessionId parameter');
            return;
        }
        
        const transport = transports.get(sessionId);
        
        if (!transport) {
            console.warn(`No active transport for session ${sessionId}`);
            res.status(404).send(`No active session: ${sessionId}`);
            return;
        }
        
        console.log(`Received message for sessionId ${sessionId}`);

        try {
            transport.handlePostMessage(req, res, req.body);
        } catch (error) {
            console.error(`Error in /message route for session ${sessionId}:`, error);
            res.status(500).json({ error: error.message });
        }
    });

    // Mount the SSE router
    app.use('/sse', sseRouter);
    
    return mcpServer;
}
