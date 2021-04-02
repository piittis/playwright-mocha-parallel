import { Page } from 'playwright';

export class Google {
  public constructor(private page: Page) { }

  public async goto() {
    await this.page.goto('https://www.google.com')
  }
}