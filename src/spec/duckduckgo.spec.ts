import { DuckDuckGo } from '../interactors/DuckDuckGo';
import { getPage } from '../testContext';
import { sleep } from '../utils';

describe('duckduckgo', () => {
  it('search', async () => {
    const page = await getPage();
    const ddg = new DuckDuckGo(page);
    await ddg.goto();
    await sleep(5000);
    await page.close();
  });
});