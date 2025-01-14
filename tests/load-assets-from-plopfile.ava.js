// import fs from 'fs';
import path from 'path';
import AvaTest from './_base-ava-test.js';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const {test, mockPath, nodePlop} = (new AvaTest(__filename));
const plopfilePath = path.join(mockPath, 'plopfile.js');

/////
// test the various ways to import all or part of a plopfile
//
test('plop.load should include all generators by default', async function (t) {
	const plop = await nodePlop();
	await plop.load(plopfilePath);

	t.is(plop.getGeneratorList().length, 3);
	t.is(plop.getHelperList().length, 0);
	t.is(plop.getPartialList().length, 0);
});

test('plop.load should be able to include a subset of generators', async function (t) {
	const plop = await nodePlop();
	await plop.load(plopfilePath, {}, {generators: ['generator1']});

	t.is(plop.getGeneratorList().length, 1);
	t.is(plop.getGeneratorList()[0].name, 'generator1');
	t.is(plop.getHelperList().length, 0);
	t.is(plop.getPartialList().length, 0);
});

test('plop.load last in wins', async function (t) {
	const plop = await nodePlop();

	plop.setGenerator('generator1', { description: 'local' });
	t.is(plop.getGenerator('generator1').description, 'local');

	await plop.load(plopfilePath, {}, {generators: ['generator1']});

	t.is(plop.getGeneratorList().length, 1);
	t.is(plop.getGeneratorList()[0].name, 'generator1');
	t.is(plop.getGenerator('generator1').description, undefined);
});

test('plop.load can rename loaded assets', async function (t) {
	const plop = await nodePlop();

	plop.setGenerator('generator1', { description: 'local' });
	t.is(plop.getGenerator('generator1').description, 'local');

	await plop.load(plopfilePath, {}, {
		generators: {
			'generator1':'gen1',
			'generator3':'bob',
		}
	});

	const gNameList = plop.getGeneratorList().map(g => g.name);
	t.is(gNameList.length, 3);
	t.true(gNameList.includes('generator1'));
	t.is(plop.getGenerator('generator1').description, 'local');
	t.true(gNameList.includes('gen1'));
	t.is(plop.getGenerator('gen1').description, undefined);
	t.true(gNameList.includes('bob'));
});

test('plop.load passes a config object that can be used to change the plopfile output', async function (t) {
	const plop = await nodePlop();
	await plop.load(plopfilePath, {prefix: 'test-'}, {
		generators: true,
		helpers: true,
		partials: true,
		actionTypes: true
	});

	const gNameList = plop.getGeneratorList().map(g => g.name);
	t.is(gNameList.length, 3);
	t.is(plop.getHelperList().length, 3);
	t.is(plop.getPartialList().length, 3);
	t.is(plop.getActionTypeList().length, 1);
	t.true(gNameList.includes('test-generator1'));
	t.true(plop.getHelperList().includes('test-helper2'));
	t.true(plop.getPartialList().includes('test-partial3'));
	t.true(plop.getActionTypeList().includes('test-actionType1'));
});

test('plop.load should import functioning assets', async function (t) {
	const plop = await nodePlop();
	await plop.load(plopfilePath, {prefix: 'test-'}, {
		generators: true,
		helpers: true,
		partials: true,
		actionTypes: true
	});

	t.is(plop.getHelper('test-helper2')('test'), 'helper 2: test');
	t.is(plop.getPartial('test-partial3'), 'partial 3: {{name}}');
	t.is(plop.getActionType('test-actionType1')(), 'test');
});

test('plop.load can include only helpers', async function (t) {
	const plop = await nodePlop();
	await plop.load(plopfilePath, null, { helpers: true });

	const gNameList = plop.getGeneratorList().map(g => g.name);
	t.is(gNameList.length, 0);
	t.is(plop.getHelperList().length, 3);
	t.is(plop.getPartialList().length, 0);
});

test('plop.load can include only certain helpers', async function (t) {
	const plop = await nodePlop();
	await plop.load(plopfilePath, null, { helpers: ['helper1'] });
	t.is(plop.getHelperList().length, 1);
	t.is(plop.getHelperList()[0], 'helper1');
});

test('plop.load can include and rename helpers', async function (t) {
	const plop = await nodePlop();
	await plop.load(plopfilePath, null, { helpers: {'helper1': 'h1'} });
	t.is(plop.getHelperList().length, 1);
	t.is(plop.getHelperList()[0], 'h1');
});

test('plop.load can include only partials', async function (t) {
	const plop = await nodePlop();
	await plop.load(plopfilePath, null, { partials: true });

	const gNameList = plop.getGeneratorList().map(g => g.name);
	t.is(gNameList.length, 0);
	t.is(plop.getHelperList().length, 0);
	t.is(plop.getPartialList().length, 3);
});

test('plop.load can include only certain partials', async function (t) {
	const plop = await nodePlop();
	await plop.load(plopfilePath, null, { partials: ['partial1'] });
	t.is(plop.getPartialList().length, 1);
	t.is(plop.getPartialList()[0], 'partial1');
});

test('plop.load can include and rename partials', async function (t) {
	const plop = await nodePlop();
	await plop.load(plopfilePath, null, { partials: {'partial1': 'p1'} });
	t.is(plop.getPartialList().length, 1);
	t.is(plop.getPartialList()[0], 'p1');
});
