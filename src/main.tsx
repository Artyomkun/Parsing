import * as React from 'react';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { App } from '@/renderer/MyApp/MyApp';

// Функция проверки типа ошибки
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// Функция диагностики CSS
function logStylesheets() {
  try {
    console.log('===== CSS DIAGNOSTICS START =====');
    
    console.log('Loaded stylesheets:');
    Array.from(document.styleSheets).forEach((sheet, index) => {
      console.log(`[${index + 1}] ${sheet.href || 'inline styles'}`);
      
      try {
        const ruleCount = sheet.cssRules ? sheet.cssRules.length : 0;
        console.log(`  Rules: ${ruleCount}`);
        
        if (sheet.href && sheet.href.includes('index.css')) {
          const testElement = document.createElement('div');
          testElement.className = 'css-test-element';
          testElement.style.display = 'none';
          testElement.innerHTML = 'CSS Test Element';
          document.body.appendChild(testElement);
          
          const styles = window.getComputedStyle(testElement);
          console.log('  Test element styles:', {
            color: styles.color,
            fontSize: styles.fontSize
          });
          
          testElement.remove();
        }
      } catch (sheetError) {
        if (isError(sheetError)) {
          console.error(`  Cannot access stylesheet: ${sheetError.message}`);
        } else {
          console.error('  Unknown error accessing stylesheet');
        }
      }
    });
    
    console.log('Environment mode:', process.env.NODE_ENV);
    console.log('===== CSS DIAGNOSTICS END =====');
  } catch (globalError) {
    if (isError(globalError)) {
      console.error('Global CSS diagnostic error:', globalError.message);
    } else {
      console.error('Unknown global error in CSS diagnostics');
    }
  }
}

// Запуск диагностики после загрузки DOM
function initDiagnostics() {
  if (document.readyState === 'complete') {
    logStylesheets();
  } else {
    window.addEventListener('load', logStylesheets);
  }
}

// Функция для запуска приложения
function runApp() {
  initDiagnostics();
}

// Получаем root-элемент с проверкой
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <StrictMode>
      <App onParse={function (config: { type: string; data: string; }): Promise<string> {
        throw new Error('Function not implemented.');
      } } loading={false} />
    </StrictMode>
  );
  
  // Запуск диагностики после рендеринга
  setTimeout(runApp, 1000);
} else {
  console.error('Failed to find the root element');
}