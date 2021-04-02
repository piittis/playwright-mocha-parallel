import { Browser, BrowserContext, Page } from 'playwright';

type Session =
| 'user1'
| 'user2'

export const testContext = {
  // Initialized in rootHooks.
  browser: null as unknown as Browser,
  sessions: {} as Partial<Record<Session, BrowserContext>>
}

/**
 * Get a blank page in a new context.
 */
export async function getPage() {
  const page = await testContext.browser.newPage();
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(5000);
  return page;
}

export async function withPage(func: (page: Page) => Promise<any>): Promise<void> {
  const page = await getPage();
  try {
    await func(page);
  } catch (err) {
    await page.close();
    throw err;
  }
  await page.close();
}

/**
 * Get a page that uses a given session.
 * Sessions are initialized lazily and reused after that.
 */
export async function getSession(session: Session) {
  const context = await getSessionContext(session);
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(5000);
  return page;
}

export async function withSession(session: Session, func: (page: Page) => Promise<any>) {
  const page = await getSession(session);
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(5000);
  try {
    await func(page);
  } catch (err) {
    await page.close();
    throw err;
  }
}

async function getSessionContext(session: Session) {
  if (!testContext.sessions[session]) {
    const browserContext = await testContext.browser.newContext();
    const page = await browserContext.newPage();
    try {
      // Initialize session, by logging in etc.

    } finally {
      page.close();
    }

    testContext.sessions[session] = browserContext;
  }
  return testContext.sessions[session]!;
}