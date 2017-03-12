'use strict';

const { expect } = require('chai');
const { connect, destroy, MessageChannel } = require('../index');

let sw;

describe('messaging', () => {
  beforeEach(() => {
    sw = connect();
  });
  afterEach(() => {
    destroy();
  });

  describe('unicast', () => {
    it('should send client message to ServiceWorker', () => {
      return sw.register('self.addEventListener("message", (evt) => self.message = evt.data)\n')
        .then((registration) => sw.ready)
        .then((registration) => {
          sw.controller.postMessage({ foo: 'foo' });
          expect(sw.scope.message).to.deep.equal({ foo: 'foo' });
        });
    });
    it('should send ServiceWorker reply to client', (done) => {
      sw.register('self.addEventListener("message", (evt) => evt.ports[0].postMessage({ foo: "bar" }))\n')
        .then((registration) => sw.ready)
        .then((registration) => {
          const mc = new MessageChannel();

          mc.port1.addEventListener('message', (evt) => {
            expect(evt.data).to.deep.equal({ foo: 'bar' });
            done();
          });
          sw.controller.postMessage({ foo: 'foo' }, [mc.port2]);
        });
    });
  });

  describe('broadcast', () => {
    it('should send message to all connected clients', () => {
      const sw2 = connect();
      const data = { foo: 'foo' };
      let count = 0;

      return sw.register('\n')
        .then((registration) => sw.ready)
        .then((registration) => {
          sw.addEventListener('message', (evt) => {
            count++;
            expect(evt.data).to.equal(data);
            expect(evt.source).to.equal(sw.controller);
            expect(count).to.equal(1);
          });
          sw2.addEventListener('message', (evt) => {
            count++;
            expect(evt.data).to.equal(data);
            expect(evt.source).to.equal(sw2.controller);
            expect(count).to.equal(2);
          });
        })
        .then(() => {
          sw.scope.clients.matchAll()
            .then((all) => {
              all.map((client) => client.postMessage(data));
            });
        });
    });
  });
});