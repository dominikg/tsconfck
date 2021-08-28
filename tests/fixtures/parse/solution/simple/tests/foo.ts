import { foo } from '../src/foo.js';
import * as assert from 'assert';

function test() {
	const actual = foo();
	const expected = 'foo';
	assert.strictEqual(actual, expected);
}
test();
