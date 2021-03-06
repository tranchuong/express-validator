const { expect } = require('chai');
const selectFields = require('./select-fields');

describe('check: field selection', () => {
  it('is done in all given request locations', () => {
    const req = {
      body: { foo: 'a' },
      params: { foo: 'b' },
      query: { foo: 'c' }
    };

    const instances = selectFields(req, {
      locations: ['body', 'query'],
      fields: ['foo']
    });

    expect(instances).to.have.length(2);
    expect(instances).to.deep.include({
      location: 'body',
      path: 'foo',
      value: 'a'
    });
    expect(instances).to.deep.include({
      location: 'query',
      path: 'foo',
      value: 'c'
    });
  });

  it('accepts multiple fields using array', () => {
    const req = {
      query: { a: 'ASD', b: 'BCA' }
    };

    const instances = selectFields(req, {
      fields: ['a', 'b'],
      locations: ['query']
    });

    expect(instances).to.have.length(2);
    expect(instances).to.deep.include({
      location: 'query',
      path: 'a',
      value: 'ASD'
    });
    expect(instances).to.deep.include({
      location: 'query',
      path: 'b',
      value: 'BCA'
    });
  });

  it('is done in nested locations using dot-notation and square brackets', () => {
    const req = {
      body: { foo: [{ bar: 'a' }] }
    };

    const instances = selectFields(req, {
      fields: ['foo[0].bar'],
      locations: ['body']
    });

    expect(instances).to.have.length(1);
    expect(instances).to.deep.include({
      path: 'foo[0].bar',
      location: 'body',
      value: 'a'
    });
  });

  it('expands "*" wildcards shallowly', () => {
    const req = {
      body: {
        foo: [{ a: 123, b: 456 }]
      }
    };

    const instances = selectFields(req, {
      // Note that the first expression matches both "a" and "b",
      // so there's some deduplication expected
      fields: ['*[0].*', 'foo.*.b'],
      locations: ['body']
    });

    expect(instances).to.have.length(2);
    expect(instances).to.deep.include({
      path: 'foo[0].a',
      location: 'body',
      value: 123
    });
    expect(instances).to.deep.include({
      path: 'foo[0].b',
      location: 'body',
      value: 456
    });
  });

  describe('optional context', () => {
    it('ignores fields which are not present in case of checkFalsy = false', () => {
      const instances = selectFields({
        params: { bar: 0 }
      }, {
        optional: { checkFalsy: false },
        locations: ['params'],
        fields: ['foo', 'bar']
      });

      expect(instances).to.have.length(1);
      expect(instances).to.deep.include({
        location: 'params',
        path: 'bar',
        value: 0
      });
    });

    it('ignores fields which are falsy in case of checkFalsy = true', () => {
      const instances = selectFields({
        params: { bar: 0 }
      }, {
        optional: { checkFalsy: true },
        locations: ['params'],
        fields: ['foo', 'bar']
      });

      expect(instances).to.have.length(0);
    });
  });

  describe('when there are multiple locations', () => {
    it('ignores those which do not have value in case others do', () => {
      const req = {
        body: { foo: 'a' },
        query: {}
      };

      const instances = selectFields(req, {
        fields: ['foo'],
        locations: ['body', 'query']
      });

      expect(instances).to.have.length(1);
      expect(instances).to.deep.include({
        location: 'body',
        path: 'foo',
        value: 'a'
      });
    });

    it('includes at least one in case none have value', () => {
      const req = {
        body: {},
        query: {}
      };

      const instances = selectFields(req, {
        fields: ['foo'],
        locations: ['body', 'query']
      });

      expect(instances).to.have.length(1);
      expect(instances).to.deep.include({
        location: 'body',
        path: 'foo',
        value: undefined
      });
    });
  });
});