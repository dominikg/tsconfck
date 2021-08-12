import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { find } from '../src/find-tsconfig';

test('find', () => {
	assert.type(find, 'function');
	assert.is(find('x'), 'foo');
});

test.run();
