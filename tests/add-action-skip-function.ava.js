import fs from 'fs';
import path from 'path';
import AvaTest from './_base-ava-test.js';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);

/**
 * We are creating files in each test,
 * but Ava runs tests in parallel by default,
 * which can make the tests unreliable,
 * so we need to implement the these tests with test.serial.
 *
 * Also we need to clean before each test, b/c we are creating files in each test.
 * (AvaTest only cleans once before and after the test file)
 */
const avaTest = new AvaTest(__filename);
const { test, testSrcPath, nodePlop, clean } = avaTest;
test.beforeEach(clean.bind(avaTest));

var plop;
test.before(async () => {
	plop = await nodePlop();
});

const genName = 'add-action';
const fileName = 'fileName';

const addAction = {
	type: 'add',
	template: '{{name}}',
	path: `${testSrcPath}/{{name}}.txt`
};

test.serial('action runs as expected without skip function', async function(t) {
	const filePath = path.resolve(testSrcPath, fileName + '.txt');
	const action = plop.setGenerator(genName, {
		actions: [addAction]
	});

	const results = await action.runActions({ name: fileName });

	// Check action ran ok
	t.true(results.changes.length === 1, 'action was skipped');
	t.not(results.changes[0].type, 'skip', 'type should not be skip');
	t.true(results.failures.length === 0, 'action failed');

	// Check that the file was not created
	t.true(fs.existsSync(filePath), 'file was not created');
});

test.serial('action throws if action.skip is not a function', async function(
	t
) {
	const filePath = path.resolve(testSrcPath, fileName + '.txt');
	const action = plop.setGenerator(genName, {
		actions: [
			{
				...addAction,
				skip: true
			}
		]
	});

	const results = await action.runActions({ name: fileName });

	// Check action ran ok
	t.true(results.changes.length === 0, 'action was not skipped');
	t.true(results.failures.length > 0, 'action did not fail');

	// Check that the file was not created
	t.false(fs.existsSync(filePath), 'file was wrongly created');
});

test.serial('skip function receives correct arguments', async function(t) {
	const mainData = { fileName, a: 1 };
	const configData = { a: 'a', b: 2 };

	const action = plop.setGenerator(genName, {
		actions: [
			{
				...addAction,
				async skip(...args) {
					t.is(args.length, 1);
					// Main data should be overwritten by config data
					t.deepEqual(args[0], {...mainData, ...configData});

					return 'Just checking arguments';
				},
				data: configData
			}
		]
	});

	await action.runActions(mainData);
});

test.serial(
	'action executes if async skip function resolves void',
	async function(t) {
		const filePath = path.resolve(testSrcPath, fileName + '.txt');
		const action = plop.setGenerator(genName, {
			actions: [
				{
					...addAction,
					async skip() {
						return;
					}
				}
			]
		});

		const results = await action.runActions({ name: fileName });

		// Check action ran ok
		t.true(results.changes.length > 0, 'action was skipped');
		t.true(results.failures.length === 0, 'action failed');

		// Check that the file was created
		t.true(fs.existsSync(filePath), 'file was created');
	}
);

test.serial('action executes if skip function returns void', async function(t) {
	const filePath = path.resolve(testSrcPath, fileName + '.txt');
	const action = plop.setGenerator(genName, {
		actions: [
			{
				...addAction,
				skip() {
					return;
				}
			}
		]
	});

	const results = await action.runActions({ name: fileName });

	// Check action ran ok
	t.true(results.changes.length > 0, 'action was skipped');
	t.not(results.changes[0].type, 'skip', 'type should not be skip');
	t.true(results.failures.length === 0, 'action failed');

	// Check that the file was created
	t.true(fs.existsSync(filePath), 'file was created');
});

test.serial('action skips if async skip function returns a string', async function(t) {
	const message = 'We should skip this one!';
	const filePath = path.resolve(testSrcPath, fileName + '.txt');
	const action = plop.setGenerator(genName, {
		actions: [
			{
				...addAction,
				async skip() {
					return message;
				}
			}
		]
	});

	const results = await action.runActions({ name: fileName });

	// Check action ran ok
	t.true(results.changes.length > 0, 'action was not skipped');
	t.is(results.changes[0].type, 'skip', 'type should be "skip"');
	t.true(results.changes[0].path === message, 'message was not used');
	t.true(results.failures.length === 0, 'action failed');

	// Check that the file was not created
	t.false(fs.existsSync(filePath), 'file was wrongly created');
});

test.serial('action skips if async skip function rejects', async function(t) {
	const filePath = path.resolve(testSrcPath, fileName + '.txt');
	const action = plop.setGenerator(genName, {
		actions: [
			{
				...addAction,
				async skip() {
					throw new Error('Whoops');
				}
			}
		]
	});

	const results = await action.runActions({ name: fileName });

	// Check action ran ok
	t.true(results.changes.length === 0, 'action was not skipped');
	t.true(results.failures.length > 0, 'action did not fail');

	// Check that the file was not created
	t.false(fs.existsSync(filePath), 'file was wrongly created');
});

test.serial('action skips if skip function returns a string', async function(t) {
	const message = 'We should skip this one!';
	const filePath = path.resolve(testSrcPath, fileName + '.txt');
	const action = plop.setGenerator(genName, {
		actions: [
			{
				...addAction,
				skip() {
					return message;
				}
			}
		]
	});

	const results = await action.runActions({ name: fileName });

	// Check action ran ok
	t.true(results.changes.length > 0, 'action was not skipped');
	t.is(results.changes[0].type, 'skip', 'type is not skip');
	t.true(results.changes[0].path === message, 'message was not used');
	t.true(results.failures.length === 0, 'there were one or more failures');

	// Check that the file was not created
	t.false(fs.existsSync(filePath), 'file was wrongly created');
});

test.serial('action skips if skip function throws', async function(t) {
	const filePath = path.resolve(testSrcPath, fileName + '.txt');
	const action = plop.setGenerator(genName, {
		actions: [
			{
				...addAction,
				skip() {
					throw new Error('Whoops');
				}
			}
		]
	});

	const results = await action.runActions({ name: fileName });

	// Check action ran ok
	t.true(results.changes.length === 0, 'action was not skipped');
	t.true(results.failures.length > 0, 'there were no failures');

	// Check that the file was not created
	t.false(fs.existsSync(filePath), 'file was wrongly created');
});
