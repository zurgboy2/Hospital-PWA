import { getCurrentUser, getCurrentKey } from './store.js';
import { loadData, saveData } from './dataManager.js';
import { __ } from './i18n.js';  // Import the translation function

export async function handleAddNote() {
    const noteText = prompt(__('enterYourNote'));
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
            alert(__('errorMessages.noteAddFailed') + ': ' + error.message);
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
                    <button onclick="editNote(${note.id})">${__('editNote')}</button>
                    <button onclick="deleteNote(${note.id})">${__('deleteNote')}</button>
                </div>
            </div>
        `).join('');
        document.getElementById('notesList').innerHTML = notesHtml;
    } catch (error) {
        console.error(__('errorMessages.noteLoadFailed'), error);
    }
}

export async function editNote(noteId) {
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    try {
        const data = await loadData(currentUser, currentKey);
        const note = data.notes.find(n => n.id === noteId);
        if (note) {
            const newText = prompt(__('editYourNote'), note.text);
            if (newText !== null) {
                note.text = newText;
                await saveData(currentUser, data, currentKey);
                loadNotes();
            }
        }
    } catch (error) {
        alert(__('errorMessages.noteEditFailed') + ': ' + error.message);
    }
}

export async function deleteNote(noteId) {
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    if (confirm(__('confirmDeleteNote'))) {
        try {
            const data = await loadData(currentUser, currentKey);
            data.notes = data.notes.filter(n => n.id !== noteId);
            await saveData(currentUser, data, currentKey);
            loadNotes();
        } catch (error) {
            alert(__('errorMessages.noteDeleteFailed') + ': ' + error.message);
        }
    }
}