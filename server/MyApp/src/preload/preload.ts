import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Define the ParserAPI interface
interface ParserAPI {
  parseHtml: (url: string, selector: string) => Promise<any>;
  parseDynamic: (url: string, selector: string) => Promise<any>;
  parseData: (config: ParseConfig) => Promise<any>;
  onError: (callback: (error: string) => void) => () => void;
}

// Define the ParseConfig interface (add this if missing)
interface ParseConfig {
  type: string;
  data: string;
  options?: any;
}

// Create the parserAPI implementation
const parserAPI: ParserAPI = {
  parseHtml: (url: string, selector: string) =>
    ipcRenderer.invoke('parse:html', url, selector),

  parseDynamic: (url: string, selector: string) =>
    ipcRenderer.invoke('parse:dynamic', url, selector),

  parseData: (config: ParseConfig) =>
    ipcRenderer.invoke('parse:data', config),

  onError: (callback: (error: string) => void) => {
    const handler = (event: IpcRendererEvent, error: string) => {
      // Log the sender ID for debugging purposes
      console.log('Received error event from senderId=', (event.sender as any)?.id);
      callback(error);
    };
    ipcRenderer.on('global-error', handler);
    return () => ipcRenderer.removeListener('global-error', handler);
  }
};

// Expose the parser API to the main world
contextBridge.exposeInMainWorld('parser', parserAPI);

declare global {
  interface Window {
    parser: ParserAPI;
  }
}

const disableAutofillForElement = (el: Element) => {
  if (!(el instanceof HTMLElement)) return;

  // Disable autofill for form elements
  if (el instanceof HTMLFormElement) {
    el.setAttribute('autocomplete', 'off');
  }

  // Disable autofill for input/select elements
  const inputElement = el as HTMLInputElement;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    if (inputElement.type === 'password') {
      inputElement.setAttribute('autocomplete', 'new-password');
    } else {
      inputElement.setAttribute('autocomplete', 'off');
    }
    inputElement.setAttribute('autocorrect', 'off');
    inputElement.setAttribute('autocapitalize', 'off');
    inputElement.setAttribute('spellcheck', 'false');
  }
};

const disableAutofillOnDocument = () => {
  document.querySelectorAll('form').forEach(disableAutofillForElement);
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select')
    .forEach(disableAutofillForElement);
};

const observeDomForAutofillDisabling = () => {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes.length > 0) {
        m.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            disableAutofillForElement(node);
            node.querySelectorAll('form, input, textarea, select').forEach(disableAutofillForElement);
          }
        });
      }
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
  });
  return observer;
};

// Initialize autofill disabling on DOMContentLoaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    try {
      disableAutofillOnDocument();
      observeDomForAutofillDisabling();
    } catch (err) {
      console.warn('Autofill disable failed', err);
    }
  }, { once: true });
}