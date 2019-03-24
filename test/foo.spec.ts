import { Foo } from '../src/foo';

describe('Foo', () => {
    it('bar', () => {
        expect(typeof Foo.bar).toEqual('function');
        expect(Foo.bar()).toEqual('bar');
    });
});
