import fs from 'fs';
import path from 'path';
import { getDataDir } from './utils.js';

const dataDir = getDataDir();

// Helper functions for working with notes
export function getAllNoteIds() {
    try {
        return fs.readdirSync(dataDir)
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''));
    } catch (err) {
        console.error('Error reading notes directory:', err);
        return [];
    }
};

export function getNoteState(id) {
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

export function getNoteContent(id) {
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

export function saveNote(id, content) {
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
