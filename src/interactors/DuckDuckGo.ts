import { Page } from 'playwright';

export class DuckDuckGo {
  public constructor(private page: Page) { }

  public async goto() {
    await this.page.goto('https://www.duckduckgo.com')
  }
}