import { getCurrentUser, getCurrentKey } from './store.js';
import { loadData, saveData } from './dataManager.js';

export async function handleAddNote() {
    const noteText = prompt('Enter your note:');
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    if (noteText) {
        try {
            const data = await loadData(currentUser, currentKey) || {};
            const notes = data.notes || [];
            notes.push({ id: Date.now(), text: noteText });
            await saveData(currentUser, { ...data, notes }, currentKey);
            loadNotes();
        } catch (error) {
            alert('Failed to add note: ' + error.message);
        }
    }
}

export async function loadNotes() {
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    try {
        const data = await loadData(currentUser, currentKey);
        const notes = data && data.notes ? data.notes : [];
        const notesHtml = notes.map(note => `
            <div class="note-item">
                <p>${note.text}</p>
                <div class="note-actions">
                    <button onclick="editNote(${note.id})">Edit</button>
                    <button onclick="deleteNote(${note.id})">Delete</button>
                </div>
            </div>
        `).join('');
        document.getElementById('notesList').innerHTML = notesHtml;
    } catch (error) {
        console.error('Failed to load notes:', error);
    }
}

export async function editNote(noteId) {
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    try {
        const data = await loadData(currentUser, currentKey);
        const note = data.notes.find(n => n.id === noteId);
        if (note) {
            const newText = prompt('Edit your note:', note.text);
            if (newText !== null) {
                note.text = newText;
                await saveData(currentUser, data, currentKey);
                loadNotes();
            }
        }
    } catch (error) {
        alert('Failed to edit note: ' + error.message);
    }
}

export async function deleteNote(noteId) {
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    if (confirm('Are you sure you want to delete this note?')) {
        try {
            const data = await loadData(currentUser, currentKey);
            data.notes = data.notes.filter(n => n.id !== noteId);
            await saveData(currentUser, data, currentKey);
            loadNotes();
        } catch (error) {
            alert('Failed to delete note: ' + error.message);
        }
    }
}