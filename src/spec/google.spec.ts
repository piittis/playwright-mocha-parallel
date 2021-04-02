import { Google } from '../interactors/Google';
import { getPage } from '../testContext';
import { sleep } from '../utils';

describe('google', () => {
  it('search', async () => {
    const page = await getPage();
    const google = new Google(page);
    await google.goto();
    await sleep(5000);
    await page.close();
  });
});