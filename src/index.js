import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import parse from './parsers.js';
import changeFormatter from './formatters/index';

const getAst = (objFirstFile, objSecondFile) => {
  const iter = (data1, data2, key) => {
    const valueFirst = data1[key];
    const valueSecond = data2[key];
    const name = key;
    if (!_.has(data2, key)) return { name, value: valueFirst, status: 'removed' };
    if (!_.has(data1, key)) return { name, value: valueSecond, status: 'added' };
    if (valueFirst instanceof Object && valueSecond instanceof Object) {
      return { name, children: getAst(valueFirst, valueSecond), status: 'nested' };
    }
    if (valueFirst === valueSecond) {
      return { name, value: valueFirst, status: 'notChanged' };
    }
    return { name, value: { old: valueFirst, new: valueSecond }, status: 'changed' };
  };

  const keysFiles = _.union(Object.keys(objFirstFile), Object.keys(objSecondFile)).sort();
  return keysFiles.map((key) => iter(objFirstFile, objSecondFile, key));
};

const compareResult = (firstPath, secondPath, format) => {
  const dataFirst = fs.readFileSync(firstPath, 'utf-8');
  const dataSecond = fs.readFileSync(secondPath, 'utf-8');

  const typeFirst = path.extname(firstPath).slice(1);
  const typeSecond = path.extname(secondPath).slice(1);

  const beforeObj = parse(dataFirst, typeFirst);
  const afterObj = parse(dataSecond, typeSecond);

  const ast = getAst(beforeObj, afterObj);
  return changeFormatter(ast, format);
};

export default compareResult;
