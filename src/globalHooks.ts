import { writeFile, unlink } from 'fs/promises';
import { resolve } from 'path';
import { BrowserServer, chromium, firefox, webkit } from 'playwright';

async function getBrowser(): Promise<BrowserServer> {
  const browser = process.env.BROWSER;
  switch (browser) {
    case 'firefox':
      return firefox.launchServer({
        headless: process.env.HEADLESS === 'true',
        logger: {
          isEnabled: (_name, _severity) => false,
          log: (name, severity, message, _args) => console.log(`${name} ${message}`)
        }
      });
    case 'webkit':
      return webkit.launchServer({
        headless: process.env.HEADLESS === 'true',
        logger: {
          isEnabled: (_name, _severity) => false,
          log: (name, _severity, message, _args) => console.log(`${name} ${message}`)
        }
      });
    case 'chromium':
      return chromium.launchServer({
        headless: process.env.HEADLESS === 'true',
        args: ['--disable-dev-shm-usage'],
        logger: {
          isEnabled: (_name, _severity) => false,
          log: (name, _severity, message, _args) => console.log(`${name} ${message}`)
        }
      });
    default:
      throw new Error('process.env.BROWSER not set');
  }
}
export async function mochaGlobalSetup(this: any) {
  console.log('---- GLOBAL SETUP ----')
  this.browser = await getBrowser();
  await writeFile(resolve(__dirname, '.browser-endpoint'), this.browser.wsEndpoint());

  // Do database seed etc.
}

export async function mochaGlobalTeardown(this: any) {
  console.log('---- GLOBAL TEARDOWN ----')
  await this.browser.close();
  await unlink(resolve(__dirname, '.browser-endpoint'));
}