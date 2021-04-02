import { Page } from 'playwright';

export class Bing {
  public constructor(private page: Page) { }

  public async goto() {
    await this.page.goto('https://www.bing.com')
  }
}