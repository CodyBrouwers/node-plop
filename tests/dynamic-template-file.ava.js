import fs from 'fs';
import path from 'path';
import AvaTest from './_base-ava-test.js';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const {test, mockPath, testSrcPath, nodePlop} = new AvaTest(__filename);


var plop;
var dynamicTemplateAdd;
test.before(async () => {
	plop = await nodePlop(`${mockPath}/plopfile.js`);
	dynamicTemplateAdd = plop.getGenerator('dynamic-template-add');
	await dynamicTemplateAdd.runActions({name: 'this is a test', kind: 'LineChart'});
});

test('Check that the file has been created', t => {
	const filePath = path.resolve(testSrcPath, 'this-is-a-test.txt');
	t.true(fs.existsSync(filePath));
});

test('Test file this-is-a-test.txt has been rendered from line-chart.txt', t => {
	const filePath = path.resolve(testSrcPath, 'this-is-a-test.txt');
	const content = fs.readFileSync(filePath).toString();

	t.true(content.includes('this is a line chart'));
	t.true(content.includes('name: this is a test'));
});

test('Test file change-me.txt has been updated with line-chart.txt', t => {
	const filePath = path.resolve(testSrcPath, 'change-me.txt');
	const content = fs.readFileSync(filePath).toString();

	t.true(content.includes('this is a line chart'));
	t.true(content.includes('name: this is a test'));
});
