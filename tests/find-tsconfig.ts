import { test } from 'uvu';
import * as assert from 'uvu/assert';
// @ts-ignore
// eslint-disable-next-line node/no-missing-import
import * as dist from '../dist/index.cjs';
const { find } = dist;
test('find', async () => {
	assert.type(find, 'function');
	assert.is(await find('x'), 'found');
});

test.run();
