import bodyParser from 'body-parser';
import { randomBytes } from 'crypto';
import express from 'express';
import http from 'http';
import _ from 'lodash';
import request from 'superagent';
import { sleep } from './utils';

/**
 * Provides helpers to:
 * - Intercept and verify outgoing requests.
 * - Mock incoming requests from external parties.
 */

 let emailId = 1;

// How test runner reaches mock server and api.
const OUTSIDEWORLD = 'http://localhost:8020';
const API = 'api';

export interface Email {
  From: string;
  To: string;
  Subject: string;
  Body?: string;
}

export interface OutgoingRequest<T> {
  headers?: any;
  body?: T;
}

interface mockedEndpointArgs {
  method: 'GET' | 'POST' | 'DELETE';
  url: string;
  payloadMatch?: any;
  textMatch?: string;
  returnBody?: any;
  returnStatus?: number;
}

function startMockServer() {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  let mockedEndpoints: Array<mockedEndpointArgs & {id: string}> = [];
  const interceptedPayloads = new Map<string, OutgoingRequest<any>>();

  /*
  This server runs alongside your other services in docker-compose.
  here you can mock any outside endpoints that your other services will use.
  Just configure your apps to route the requests here.
  */

  app.post('/service1/auth', (req, res, next) => {
    res.send({
      access_token: 'test_token',
      expires_in: 3600
    });
  });

  app.get('/service1/get-data', (req, res, next) => {
    res.send({
      foo: 'bar'
    });
  });

  app.post('/__mock__/:id/', (req, res) => {
    const id = req.params.id as string;
    const args = req.body as mockedEndpointArgs;
    const endPoint = {id, ...args};
    console.log('MOCKED', endPoint);
    mockedEndpoints.push(endPoint);
    res.sendStatus(200);
  });

  app.get('/__mock__/:id/', async (req, res) => {
    const timeout = Date.now() + 10000;
    while (true) {
      if (Date.now() > timeout) {
        return res.sendStatus(400);
      }
      const sent = interceptedPayloads.get(req.params.id);
      if (sent) {
        return res.send(sent);
      } else {
        await sleep(100);
      }
    }
  });

  app.all('*', (req, res, next) => {
    const method = req.method;
    const url = req.path;
    const endPoint = _.findLast(mockedEndpoints,
                            e => e.url === url &&
                            e.method === method &&
                            (!e.payloadMatch || _.isMatch(req.body, e.payloadMatch)) &&
                            (!e.textMatch || JSON.stringify(req.body).includes(e.textMatch)));
    if (endPoint) {
      console.log('MATCH', endPoint);
      interceptedPayloads.set(endPoint.id, {headers: _.clone(req.headers), body: req.body});
      // All mocked endpoints are single use, remove it.
      mockedEndpoints = mockedEndpoints.filter(e => e !== endPoint);
      res.status(endPoint.returnStatus ?? 200).send(endPoint.returnBody);
    } else {
      next();
    }
  });

  app.all('*', (req, res) => {
    console.log('no match for', req.method, req.path, req.body);
    res.sendStatus(404);
  });

  http.createServer(app).listen(8020);
  console.log('Outside world listening on 8020');
}

if (!module.parent) {
  void startMockServer();
}

class MockedEndpoint<T> {
  public active: Promise<MockedEndpoint<T>>;
  private id: string;

  public constructor(private args: mockedEndpointArgs) {
    const id = randomBytes(16).toString('hex');
    this.id = id
    this.active = (async() => {
      await request.post(`${OUTSIDEWORLD}/__mock__/${id}/`).send(this.args)
      return this;
    })();
  }

  public async getOutgoingRequest(): Promise<OutgoingRequest<T>> {
    try {
      const sent = await request.get(`${OUTSIDEWORLD}/__mock__/${this.id}/`);
      return sent.body;
    } catch (err) {
      throw new Error(`No outgoing request could be intercepted for: ${JSON.stringify(this.args, null, 2)}`);
    }
  }
}

/**
 * functions to intercept outgoing messages.
 */
export const interceptor = {
  email(to: string, subject: string) {
    return new MockedEndpoint<Email>({
      method: 'POST',
      url: '/email-endpoint',
      payloadMatch: {To: to, Subject: subject},
      returnStatus: 200,
      returnBody: {ErrorCode: 0, MessageID: (emailId++).toString()}
    });
  }
};

/**
 * Functions to simulate incoming external requests.
 */
export const external = {
  async incomingWebhook(payload: any) {
    await request.post(`${API}/api/incoming-webhook`).send(payload);
  }
};

/**
 * Setup an intercept, then execute some provided actions and resolve with the intercepted request.
 */
 export async function withIntercept<T = any>(args: [intercept: MockedEndpoint<T>, action: PromiseLike<any>]): Promise<OutgoingRequest<T>> {
  await args[0].active;
  await args[1];
  return args[0].getOutgoingRequest();
}

type MockedEndpointTypes<Endpoints extends [...MockedEndpoint<any>[]]> = {
  [P in keyof Endpoints]: Endpoints[P] extends MockedEndpoint<infer T> ? OutgoingRequest<T> : never;
};

/**
 * Setup multiple intercepts, then execute some provided action and resolve with the intercepted requests.
 */
 export async function withIntercepts<T extends MockedEndpoint<any>[]>(intercepts: T, action: PromiseLike<any>): Promise<MockedEndpointTypes<T>> {
  await Promise.all(intercepts.map(i => i.active));
  await action;
  return Promise.all(intercepts.map(i => i.getOutgoingRequest())) as any;
}