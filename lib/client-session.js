'use client';

// iOS Safari throws on localStorage when the user has site data blocked, and a
// throw inside a React effect takes the whole page down with a bare
// "client-side exception". Every access goes through these helpers instead.
export function readStored(key) {
  try {
    const value = localStorage.getItem(key);
    return value && value !== 'undefined' && value !== 'null' ? value : null;
  } catch (error) {
    console.error(`Could not read "${key}" from storage:`, error);
    return null;
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Could not save "${key}" to storage:`, error);
  }
}

export function removeStored(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Could not clear "${key}" from storage:`, error);
  }
}

export function clearStoredSession() {
  removeStored('adminToken');
  removeStored('adminEmail');
  removeStored('customerToken');
  removeStored('customerEmail');
  removeStored('customerName');
}

// A token that has expired still sits in storage, so the layout lets the page
// render and only the API call fails. Clear it and start a fresh sign-in rather
// than feeding an error object into code that expects a list.
export function handleUnauthorized() {
  clearStoredSession();
  window.location.href = '/login';
}
