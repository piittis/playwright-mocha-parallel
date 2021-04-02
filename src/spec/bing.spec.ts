import { Bing } from '../interactors/Bing';
import { getPage } from '../testContext';
import { sleep } from '../utils';

describe('bing', () => {
  it('search', async () => {
    const page = await getPage();
    const bing = new Bing(page);
    await bing.goto();
    await sleep(5000);
    await page.close();
  });
});