import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { Browser, chromium, firefox, webkit } from 'playwright';
import { testContext } from './testContext';

async function getBrowser(): Promise<Browser> {
  const wsEndpoint = await readFile(resolve(__dirname, '.browser-endpoint')).then(b => b.toString());
  const browser = process.env.BROWSER;
  switch (browser) {
    case 'firefox':
      return firefox.connect({wsEndpoint});
    case 'webkit':
      return webkit.connect({wsEndpoint});
    case 'chromium':
      return chromium.connect({wsEndpoint});
    default:
      throw new Error('process.env.BROWSER not set');
  }
}

export const mochaHooks = {
  beforeAll: async () => {
    if (!testContext.browser ) {
      testContext.browser = await getBrowser();
    }
  },
  beforeEach: async () => {

  },
  afterEach: async () => {

  }
};