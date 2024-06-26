import ts from 'typescript';

const [major, minor] = ts.version.split('.', 3).map((n) => Number(n));
export const FEAT_$CONFIGDIR = major > 5 || (major === 5 && minor >= 5);
