// store.js
let currentUser = null;
let currentKey = null;

export function setCurrentUser(user) {
    currentUser = user;
}

export function getCurrentUser() {
    return currentUser;
}

export function setCurrentKey(key) {
    currentKey = key;
}

export function getCurrentKey() {
    return currentKey;
}