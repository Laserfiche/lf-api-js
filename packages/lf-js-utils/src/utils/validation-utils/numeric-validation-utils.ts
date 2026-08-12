// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

enum JSTokenType {
  COMPARER,
  LOGICAL,
  NUMERIC,
  PARENTHESES,
  NOT
}

enum LFTokenType {
  COMPARER,
  LOGICAL,
  NUMERIC,
  WORD,
  PARENTHESES,
  NOT
}

interface JSToken {
  type: JSTokenType;
  value: string;
  startIndex: number;
}

interface LFToken {
  type: LFTokenType;
  value: string;
  startIndex: number;
}

/**
 * Given a string representing a Laserfiche numeric field, and a check constraint, 
 * determines if the numeric field satisfies the constraint
 * @param value - a number represented in string
 * @param numericConstraint - e.g. '\>=100 and \<=999'. Please reference the laserfiche documentation
 * for more information:
 * https://www.laserfiche.com/support/webhelp/Laserfiche/10/en-US/administration/#../Subsystems/
 * LFAdmin/Content/Restricting_Field_Data_to_a_Specific_Format.htm?Highlight=constraintformat
 * @returns true if value satisfies the numeric constraint
 * @example
 * ```typescript
 *  evaluateNumericValidationExpression('1000', '>=1000 &  <=9999');  // true
 *  evaluateNumericValidationExpression('100000', '>=1000 &  <=9999');  // false
 * ```
 */
export function evaluateNumericValidationExpression(value: string, numericConstraint: string): boolean {
  const valueAsNumber: number = parseFloat(value);
  if (isNaN(valueAsNumber)) {
    return false;
  }
  else {
    try {
      const jsTokensWithNumber: JSToken[] = getJsTokensWithNumber(value, numericConstraint);
      const isValid: boolean = evaluateJsTokens(jsTokensWithNumber);
      return isValid;
    }
    catch (error) {
      console.warn('Invalid numeric constraint: ', error);
      return false;
    }
  }
}

function getJsTokensWithNumber(value: string, numericConstraint: string): JSToken[] {
  const lfTokens: LFToken[] = tokenizeLfConstraint(numericConstraint);
  const jsTokens: JSToken[] = convertLfTokensToJsTokens(lfTokens);
  return insertInputIntoExpression(jsTokens, value);
}

/**
 * Evaluates a fully-resolved JSToken expression (comparisons joined by &&/|| and !,
 * grouped by parentheses) without eval(), so this works under a CSP that disallows
 * unsafe-eval (e.g. Office Add-in WebViews).
 *
 * Grammar (lowest to highest precedence):
 *   orExpr  := andExpr ('||' andExpr)*
 *   andExpr := notExpr ('&&' notExpr)*
 *   notExpr := '!'* primary
 *   primary := '(' orExpr ')' | NUMBER COMPARER NUMBER
 */
function evaluateJsTokens(rawTokens: JSToken[]): boolean {
  // tokenizeLfConstraint groups consecutive same-type characters into one token, so
  // adjacent parentheses like "((" or "))" arrive as a single multi-character
  // PARENTHESES token. eval() doesn't care (it just re-parses the raw string), but
  // this parser matches parens one character at a time, so expand them first.
  const tokens: JSToken[] = [];
  for (const token of rawTokens) {
    if (token.type === JSTokenType.PARENTHESES && token.value.length > 1) {
      for (const char of token.value) {
        tokens.push({ type: JSTokenType.PARENTHESES, value: char, startIndex: token.startIndex });
      }
    }
    else {
      tokens.push(token);
    }
  }
  let index = 0;
  const peek = (): JSToken | undefined => tokens[index];
  const consume = (): JSToken | undefined => tokens[index++];

  function parseOr(): boolean {
    let result = parseAnd();
    while (peek() && peek()!.type === JSTokenType.LOGICAL && peek()!.value === '||') {
      consume();
      result = parseAnd() || result;
    }
    return result;
  }

  function parseAnd(): boolean {
    let result = parseNot();
    while (peek() && peek()!.type === JSTokenType.LOGICAL && peek()!.value === '&&') {
      consume();
      result = parseNot() && result;
    }
    return result;
  }

  function parseNot(): boolean {
    let negate = false;
    while (peek() && peek()!.type === JSTokenType.NOT) {
      consume();
      negate = !negate;
    }
    const result = parsePrimary();
    return negate ? !result : result;
  }

  function parsePrimary(): boolean {
    const token = peek();
    if (token && token.type === JSTokenType.PARENTHESES && token.value === '(') {
      consume();
      const result = parseOr();
      const closing = consume();
      if (!closing || closing.type !== JSTokenType.PARENTHESES || closing.value !== ')') {
        throw new Error('Expected closing parenthesis');
      }
      return result;
    }
    return parseComparison();
  }

  // parseFloat() parses a leading valid numeric prefix and silently ignores trailing
  // garbage (e.g. parseFloat('100.0.0') === 100, parseFloat('150abc') === 150). eval()
  // would have rejected these as a SyntaxError; this replicates that strictness by
  // requiring the entire token to be a well-formed number. Leading '+' is allowed
  // since NumberFieldComponent's own format validator permits it for typed-in values.
  function parseStrictNumericLiteral(value: string): number {
    if (!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(value)) {
      throw new Error(`Not a valid numeric literal: ${value}`);
    }
    return parseFloat(value);
  }

  function parseComparison(): boolean {
    const left = consume();
    if (!left || left.type !== JSTokenType.NUMERIC) {
      throw new Error(`Expected number, got ${left ? left.value : 'end of expression'}`);
    }
    const comparer = consume();
    if (!comparer || comparer.type !== JSTokenType.COMPARER) {
      throw new Error(`Expected comparer, got ${comparer ? comparer.value : 'end of expression'}`);
    }
    const right = consume();
    if (!right || right.type !== JSTokenType.NUMERIC) {
      throw new Error(`Expected number, got ${right ? right.value : 'end of expression'}`);
    }
    const leftNum: number = parseStrictNumericLiteral(left.value);
    const rightNum: number = parseStrictNumericLiteral(right.value);
    switch (comparer.value) {
      case '<': return leftNum < rightNum;
      case '<=': return leftNum <= rightNum;
      case '>': return leftNum > rightNum;
      case '>=': return leftNum >= rightNum;
      case '==': return leftNum === rightNum;
      case '!=': return leftNum !== rightNum;
      default: throw new Error(`Unexpected comparer: ${comparer.value}`);
    }
  }

  const result = parseOr();
  if (index !== tokens.length) {
    throw new Error('Unexpected trailing tokens');
  }
  return result;
}

function insertInputIntoExpression(jsTokens: JSToken[], numericValue: string): JSToken[] {
  const newJsTokens: JSToken[] = [];
  jsTokens.forEach(jsToken => {
    if (jsToken.type === JSTokenType.COMPARER) {
      const isPreviousTokenNumber: boolean = newJsTokens.length > 0 && newJsTokens[newJsTokens.length - 1].type === JSTokenType.NUMERIC;
      if (isPreviousTokenNumber) {
        newJsTokens.push(jsToken);
        newJsTokens.push({ type: JSTokenType.NUMERIC, value: numericValue, startIndex: -1 });
      }
      else {
        newJsTokens.push({ type: JSTokenType.NUMERIC, value: numericValue, startIndex: -1 });
        newJsTokens.push(jsToken);
      }
    }
    else {
      newJsTokens.push(jsToken);
    }
  });
  return newJsTokens;
}

function getLFTokenType(c: string): LFTokenType | undefined {
  if (c === '-' || c === '.' || !isNaN(parseInt(c, 10))) {
    return LFTokenType.NUMERIC;
  }
  else if (c === '(' || c === ')') {
    return LFTokenType.PARENTHESES;
  }
  else if (c === '<' || c === '>' || c === '=') {
    return LFTokenType.COMPARER;
  }
  else if (c === '|' || c === '&') {
    return LFTokenType.LOGICAL;
  }
  else if (c === '!') {
    return LFTokenType.NOT;
  }
  else if (c === 'a' || c === 'n' || c === 'd' || c === 'o' || c === 'r' || c === 't') {
    return LFTokenType.WORD;
  }
  else {
    return undefined;
  }
}

function tokenizeLfConstraint(constraint: string) {
  const tokens: LFToken[] = [];
  let currentIndex: number = 0;
  let currentToken: LFToken | undefined;
  while (currentIndex < constraint.length) {
    const currentChar: string = constraint.charAt(currentIndex).toLowerCase();
    currentIndex++;
    if (currentChar === ' ') {
      if (currentToken) {
        tokens.push(currentToken);
      }
      currentToken = undefined;
      continue;
    }
    const currentCharType: LFTokenType | undefined = getLFTokenType(currentChar);
    if (currentCharType === undefined) {
      throw new Error(`Unexpected character at index ${currentIndex - 1}: ${currentChar}`);
    }
    if (currentToken?.type === currentCharType) {
      currentToken.value += currentChar;
    }
    else {
      if (currentToken) {
        tokens.push(currentToken);
      }
      currentToken = {
        type: currentCharType,
        value: currentChar,
        startIndex: currentIndex - 1
      };
    }
  }
  if (currentToken) {
    tokens.push(currentToken);
  }
  return tokens;
}

function convertLfTokensToJsTokens(lfTokens: LFToken[]): JSToken[] {
  const jsTokens: JSToken[] = [];
  lfTokens.forEach(lfToken => {
    switch (lfToken.type) {
      case LFTokenType.PARENTHESES: {
        jsTokens.push({ type: JSTokenType.PARENTHESES, value: lfToken.value, startIndex: lfToken.startIndex });
        break;
      }
      case LFTokenType.NUMERIC: {
        if (!isNaN(parseFloat(lfToken.value))) {
          jsTokens.push({ type: JSTokenType.NUMERIC, value: lfToken.value, startIndex: lfToken.startIndex });
        }
        else {
          throw new Error(`Unexpected operator at index ${lfToken.startIndex}: ${lfToken.value}`);
        }
        break;
      }
      case LFTokenType.LOGICAL: {
        if (lfToken.value === '&') {
          jsTokens.push({ type: JSTokenType.LOGICAL, value: '&&', startIndex: lfToken.startIndex });
        }
        else if (lfToken.value === '|') {
          jsTokens.push({ type: JSTokenType.LOGICAL, value: '||', startIndex: lfToken.startIndex });
        }
        else {
          throw new Error(`Unexpected operator at index ${lfToken.startIndex}: ${lfToken.value}`);
        }
        break;
      }
      case LFTokenType.WORD: {
        if (lfToken.value === 'and') {
          jsTokens.push({ type: JSTokenType.LOGICAL, value: '&&', startIndex: lfToken.startIndex });
        }
        else if (lfToken.value === 'or') {
          jsTokens.push({ type: JSTokenType.LOGICAL, value: '||', startIndex: lfToken.startIndex });
        }
        else if (lfToken.value === 'not') {
          addOrAnnihilateNot(jsTokens, lfToken);
        }
        else {
          throw new Error(`Unexpected operator at index ${lfToken.startIndex}: ${lfToken.value}`);
        }
        break;
      }
      case LFTokenType.NOT: {
        const shouldAddNot: boolean = lfToken.value.length % 2 === 1;
        if (shouldAddNot) {
          addOrAnnihilateNot(jsTokens, lfToken);
        }
        break;
      }
      case LFTokenType.COMPARER: {
        switch (lfToken.value) {
          case '<': {
            addComparer(jsTokens, '<', '>=', lfToken.startIndex);
            break;
          }
          case '<=': {
            addComparer(jsTokens, '<=', '>', lfToken.startIndex);
            break;
          }
          case '>': {
            addComparer(jsTokens, '>', '<=', lfToken.startIndex);
            break;
          }
          case '>=': {
            addComparer(jsTokens, '>=', '<', lfToken.startIndex);
            break;
          }
          case '<>': {
            addComparer(jsTokens, '!=', '==', lfToken.startIndex);
            break;
          }
          case '=': {
            addComparer(jsTokens, '==', '!=', lfToken.startIndex);
            break;
          }
          default:
            throw new Error(`Unexpected operator at index ${lfToken.startIndex}: ${lfToken.value}`);
        }
        break;
      }
      default: {
        throw new Error(`Unexpected operator at index ${lfToken.startIndex}: ${lfToken.value}`);
      }
    }
  });
  return jsTokens;
}

function addOrAnnihilateNot(jsTokens: JSToken[], lfToken: LFToken) {
  const isPreviousTokenNot: boolean = jsTokens.length > 0 && jsTokens[jsTokens.length - 1].type === JSTokenType.NOT;
  if (isPreviousTokenNot) {
    jsTokens.pop();
  }
  else {
    jsTokens.push({ type: JSTokenType.NOT, value: '!', startIndex: lfToken.startIndex });
  }
}

function addComparer(jsTokens: JSToken[], value: string, notValue: string, startIndex: number): void {
  const isPreviousTokenNot: boolean = jsTokens.length > 0 && jsTokens[jsTokens.length - 1].type === JSTokenType.NOT;
  if (isPreviousTokenNot) {
    jsTokens.pop();
    jsTokens.push({ type: JSTokenType.COMPARER, value: notValue, startIndex });
  }
  else {
    jsTokens.push({ type: JSTokenType.COMPARER, value, startIndex });
  }
}

/** @internal */
export const numeric_testables = {
  JSTokenType,
  LFTokenType,
  insertInputIntoExpression,
  getLFTokenType,
  tokenizeLfConstraint,
  convertLfTokensToJsTokens,
  addOrAnnihilateNot,
  addComparer,
  getJsTokensWithNumber,
  evaluateJsTokens
};
