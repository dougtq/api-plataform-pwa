import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import { join } from 'path';

test('Abrir app -> Criar Request -> Receber 200 OK via IPC', async () => {
  const electronApp = await electron.launch({
    args: [join(__dirname, '../../dist/main/index.js')],
  });

  const window = await electronApp.firstWindow();
  
  // Wait for the app to be ready
  await window.waitForSelector('input[placeholder="https://api.example.com/v1/resource"]', { timeout: 10000 });

  // 1. Enter URL
  const urlInput = window.locator('input[placeholder="https://api.example.com/v1/resource"]');
  await urlInput.fill('https://jsonplaceholder.typicode.com/todos/1');

  // 2. Click Send
  const sendButton = window.locator('button:has-text("Send")');
  await sendButton.click();

  // 3. Verify 200 OK
  const statusElement = window.locator('span:has-text("200 OK")');
  await expect(statusElement).toBeVisible({ timeout: 10000 });

  await electronApp.close();
});
