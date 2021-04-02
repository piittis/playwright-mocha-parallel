# playwright-mocha-parallel
Minimal example of parallel browser tests with `Playwright` and `Mocha`. Many users use your app at the same time, so why not make use of your beefy dev machine and run tests parallel as well, and save significant time.

- `globalHooks`: Runs before mocha boots up. Starts up the browses.
- `rootHooks`: Connects each mocha worker process to the browser.
- `outsideWorld`: Some helpers to mock the outside world for your app. Can intercept outgoing data and send fake incoming data to your app.
- `testContext`: Helpers to reuse user sessions accross different tests.
