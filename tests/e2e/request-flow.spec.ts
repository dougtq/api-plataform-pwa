import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('Abrir app -> Criar Request -> Receber 200 OK via IPC', async () => {
  const electronApp = await electron.launch({
    args: [join(__dirname, '../../dist/main/index.js')],
  });

  const window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');
  // console.log('Window found, waiting for UI...');

  // 0. Click "New Request" button to create an active tab
  // Use a more resilient selector
  const newRequestBtn = window.locator('button[title="New Request"]');
  await newRequestBtn.waitFor({ state: 'visible', timeout: 15000 });
  await newRequestBtn.click();
  // console.log('Clicked New Request');

  // Wait for the app to be ready (input should appear now)
  const urlInput = window.locator('input[placeholder="https://api.example.com/v1/resource"]');
  await urlInput.waitFor({ state: 'visible', timeout: 15000 });
  await urlInput.fill('https://jsonplaceholder.typicode.com/todos/1');

  // 2. Click Send
  const sendButton = window.locator('button:has-text("Send")');
  await sendButton.click();

  // 3. Verify 200 OK
  const statusElement = window.locator('span:has-text("200 OK")');
  await expect(statusElement).toBeVisible({ timeout: 10000 });

  await electronApp.close();
});
