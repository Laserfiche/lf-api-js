// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.


import { numeric_testables, evaluateNumericValidationExpression } from './numeric-validation-utils.js';

describe('NumericValidationUtils', () => {
  it('should validate a valid 4-digit number', () => {
    // Arrange
    const value1: string = '1000';
    const value2: string = '9999';
    const value3: string = '1536';
    const numericConstraint: string = '>=1000 &  <=9999';

    // Act
    const validate1: boolean = evaluateNumericValidationExpression(value1, numericConstraint);
    const validate2: boolean = evaluateNumericValidationExpression(value2, numericConstraint);
    const validate3: boolean = evaluateNumericValidationExpression(value3, numericConstraint);

    // Assert
    expect(validate1).toBeTruthy();
    expect(validate2).toBeTruthy();
    expect(validate3).toBeTruthy();
  });

  it('should validate an invalid 4-digit number', () => {
    // Arrange
    const threeDigit: string = '100';
    const fiveDigit: string = '99999';
    const numericConstraint: string = '>=1000 &  <=9999';

    // Act
    const validateThreeDigit: boolean = evaluateNumericValidationExpression(threeDigit, numericConstraint);
    const validateFiveDigit: boolean = evaluateNumericValidationExpression(fiveDigit, numericConstraint);

    // Assert
    expect(validateThreeDigit).toBeFalsy();
    expect(validateFiveDigit).toBeFalsy();
  });

  it('should validate a valid positive number', () => {
    // Arrange
    const value1: string = '0';
    const value2: string = '9999';
    const numericConstraint: string = '>=0';

    // Act
    const validate1: boolean = evaluateNumericValidationExpression(value1, numericConstraint);
    const validate2: boolean = evaluateNumericValidationExpression(value2, numericConstraint);

    // Assert
    expect(validate1).toBeTruthy();
    expect(validate2).toBeTruthy();
  });

  it('should validate an invalid positive number', () => {
    // Arrange
    const negative: string = '-100';
    const numericConstraint: string = '>=0';

    // Act
    const validateNegative: boolean = evaluateNumericValidationExpression(negative, numericConstraint);

    // Assert
    expect(validateNegative).toBeFalsy();
  });

  it('should validate a valid number greater than 4', () => {
    // Arrange
    const value1: string = '5';
    const value2: string = '9999';
    const numericConstraint: string = '>4';

    // Act
    const validate1: boolean = evaluateNumericValidationExpression(value1, numericConstraint);
    const validate2: boolean = evaluateNumericValidationExpression(value2, numericConstraint);

    // Assert
    expect(validate1).toBeTruthy();
    expect(validate2).toBeTruthy();
  });

  it('should validate an invalid number greater than 4', () => {
    // Arrange
    const negative: string = '-100';
    const lessThan: string = '2';
    const exactlyFour: string = '4';
    const numericConstraint: string = '>4';

    // Act
    const validateNegative: boolean = evaluateNumericValidationExpression(negative, numericConstraint);
    const validateLessThan: boolean = evaluateNumericValidationExpression(lessThan, numericConstraint);
    const validateExactlyFour: boolean = evaluateNumericValidationExpression(exactlyFour, numericConstraint);

    // Assert
    expect(validateNegative).toBeFalsy();
    expect(validateLessThan).toBeFalsy();
    expect(validateExactlyFour).toBeFalsy();
  });

  it('should validate a valid number less than or equal to 2.5', () => {
    // Arrange
    const value1: string = '-2';
    const value2: string = '0.35';
    const value3: string = '1';
    const value4: string = '2.5';
    const numericConstraint: string = '<=2.5';

    // Act
    const validate1: boolean = evaluateNumericValidationExpression(value1, numericConstraint);
    const validate2: boolean = evaluateNumericValidationExpression(value2, numericConstraint);
    const validate3: boolean = evaluateNumericValidationExpression(value3, numericConstraint);
    const validate4: boolean = evaluateNumericValidationExpression(value4, numericConstraint);

    // Assert
    expect(validate1).toBeTruthy();
    expect(validate2).toBeTruthy();
    expect(validate3).toBeTruthy();
    expect(validate4).toBeTruthy();
  });

  it('should validate an invalid number less than or equal to 2.5', () => {
    // Arrange
    const barelyAbove: string = '2.51';
    const above: string = '100';
    const numericConstraint: string = '<=2.5';

    // Act
    const validateBarelyAbove: boolean = evaluateNumericValidationExpression(barelyAbove, numericConstraint);
    const validateAbove: boolean = evaluateNumericValidationExpression(above, numericConstraint);

    // Assert
    expect(validateBarelyAbove).toBeFalsy();
    expect(validateAbove).toBeFalsy();
  });

  it('should validate a valid number NOT greater than 999', () => {
    // Arrange
    const value1: string = '5';
    const value2: string = '999';
    const value3: string = '-999';
    const numericConstraint: string = '!>999';

    // Act
    const validate1: boolean = evaluateNumericValidationExpression(value1, numericConstraint);
    const validate2: boolean = evaluateNumericValidationExpression(value2, numericConstraint);
    const validate3: boolean = evaluateNumericValidationExpression(value3, numericConstraint);

    // Assert
    expect(validate1).toBeTruthy();
    expect(validate2).toBeTruthy();
    expect(validate3).toBeTruthy();
  });

  it('should validate an invalid number NOT greater than 999', () => {
    // Arrange
    const greater: string = '1000';
    const numericConstraint: string = '!>999';

    // Act
    const validate1: boolean = evaluateNumericValidationExpression(greater, numericConstraint);

    // Assert
    expect(validate1).toBeFalsy();
  });

  it('should validate a number that has way too many ! (odd)', () => {
    // Arrange
    const greater: string = '1000';
    const numericConstraint: string = '!!!>999';

    // Act
    const validate1: boolean = evaluateNumericValidationExpression(greater, numericConstraint);

    // Assert
    expect(validate1).toBeFalsy();
  });

  it('should validate a number that has way too many ! (even)', () => {
    // Arrange
    const greater: string = '1000';
    const numericConstraint: string = '!!>999';

    // Act
    const validate1: boolean = evaluateNumericValidationExpression(greater, numericConstraint);

    // Assert
    expect(validate1).toBeTruthy();
  });

  it('should validate a valid number between 1 and 10, not including 1 and 10', () => {
    // Arrange
    const value1: string = '2';
    const value2: string = '9';
    const numericConstraint: string = '1 < & < 10';

    // Act
    const validate1: boolean = evaluateNumericValidationExpression(value1, numericConstraint);
    const validate2: boolean = evaluateNumericValidationExpression(value2, numericConstraint);

    // Assert
    expect(validate1).toBeTruthy();
    expect(validate2).toBeTruthy();
  });

  it('should validate an invalid number between 1 and 10, not including 1 and 10', () => {
    // Arrange
    const one: string = '1';
    const ten: string = '10';
    const above: string = '11';
    const below: string = '0';
    const numericConstraint: string = '1 < & < 10';

    // Act
    const validateOne: boolean = evaluateNumericValidationExpression(one, numericConstraint);
    const validateTen: boolean = evaluateNumericValidationExpression(ten, numericConstraint);
    const validateAbove: boolean = evaluateNumericValidationExpression(above, numericConstraint);
    const validateBelow: boolean = evaluateNumericValidationExpression(below, numericConstraint);

    // Assert
    expect(validateOne).toBeFalsy();
    expect(validateTen).toBeFalsy();
    expect(validateAbove).toBeFalsy();
    expect(validateBelow).toBeFalsy();
  });

  it('should validate a valid number between 100 and 200 or between 500 and 900, including 100, 200, 500 and 900', () => {
    // Arrange
    const value1: string = '100';
    const value2: string = '105';
    const value3: string = '200';
    const value4: string = '500';
    const value5: string = '600';
    const value6: string = '900';
    const numericConstraint: string = '(>=100 & <=200) | (>=500 & <=900)';

    // Act
    const validate1: boolean = evaluateNumericValidationExpression(value1, numericConstraint);
    const validate2: boolean = evaluateNumericValidationExpression(value2, numericConstraint);
    const validate3: boolean = evaluateNumericValidationExpression(value3, numericConstraint);
    const validate4: boolean = evaluateNumericValidationExpression(value4, numericConstraint);
    const validate5: boolean = evaluateNumericValidationExpression(value5, numericConstraint);
    const validate6: boolean = evaluateNumericValidationExpression(value6, numericConstraint);

    // Assert
    expect(validate1).toBeTruthy();
    expect(validate2).toBeTruthy();
    expect(validate3).toBeTruthy();
    expect(validate4).toBeTruthy();
    expect(validate5).toBeTruthy();
    expect(validate6).toBeTruthy();
  });

  it('should validate an invalid number between 100 and 200 or between 500 and 900, including 100, 200, 500 and 900', () => {
    // Arrange
    const negative: string = '-99';
    const zero: string = '0';
    const below: string = '99';
    const between: string = '205';
    const above: string = '901';
    const numericConstraint: string = '(>=100 & <=200) | (>=500 & <=900)';

    // Act
    const validateNegative: boolean = evaluateNumericValidationExpression(negative, numericConstraint);
    const validateZero: boolean = evaluateNumericValidationExpression(zero, numericConstraint);
    const validateBelow: boolean = evaluateNumericValidationExpression(below, numericConstraint);
    const validateBetween: boolean = evaluateNumericValidationExpression(between, numericConstraint);
    const validateAbove: boolean = evaluateNumericValidationExpression(above, numericConstraint);

    // Assert
    expect(validateNegative).toBeFalsy();
    expect(validateZero).toBeFalsy();
    expect(validateBelow).toBeFalsy();
    expect(validateBetween).toBeFalsy();
    expect(validateAbove).toBeFalsy();
  });

  it('should evaluate a 3-way AND chain at the same precedence level', () => {
    // Arrange: also exercises the '<>' (not-equal) comparer, which no other test covers.
    const numericConstraint: string = '>=10 & <=20 & <>15';

    // Act & Assert
    expect(evaluateNumericValidationExpression('12', numericConstraint)).toBe(true);
    expect(evaluateNumericValidationExpression('15', numericConstraint)).toBe(false);
    expect(evaluateNumericValidationExpression('25', numericConstraint)).toBe(false);
  });

  it('should evaluate a 3-way OR chain at the same precedence level', () => {
    // Arrange: also exercises the '=' (equality) comparer, which no other test covers.
    const numericConstraint: string = '=1 | =5 | =10';

    // Act & Assert
    expect(evaluateNumericValidationExpression('1', numericConstraint)).toBe(true);
    expect(evaluateNumericValidationExpression('5', numericConstraint)).toBe(true);
    expect(evaluateNumericValidationExpression('10', numericConstraint)).toBe(true);
    expect(evaluateNumericValidationExpression('7', numericConstraint)).toBe(false);
  });

  it('should reject malformed numeric literals instead of leniently parsing a valid prefix', () => {
    // Arrange: parseFloat('100.0.0') === 100 and parseFloat('150abc') === 150 -- it
    // parses a leading valid prefix and silently ignores trailing garbage. eval()
    // rejected both as a SyntaxError; the parser must replicate that strictness
    // rather than falling back to a lenient parseFloat.
    const malformedConstraint: string = '>=100.0.0';
    const malformedValue: string = '150abc';

    // Act & Assert
    expect(evaluateNumericValidationExpression('150', malformedConstraint)).toBe(false);
    expect(evaluateNumericValidationExpression(malformedValue, '>=100')).toBe(false);
  });

  it('should accept exponential notation, which both parseFloat and eval() handle unambiguously', () => {
    // Arrange: unlike '100.0.0' or '150abc', exponential notation isn't a truncation
    // risk -- '2.5e2' has one unambiguous numeric meaning. Number.prototype.toString()
    // switches to this format for very large/small magnitudes (e.g. (1e21).toString()
    // === '1e+21'), so a caller stringifying a JS number before passing it in can hit
    // this without unusual input.

    // Act & Assert
    expect(evaluateNumericValidationExpression('2.5e2', '>4')).toBe(true);
    expect(evaluateNumericValidationExpression('1e3', '>=1000 & <=9999')).toBe(true);
  });

  it('should still accept a legitimate leading + sign on the input value', () => {
    // Arrange: NumberFieldComponent's own format validator permits a leading '+' for
    // typed-in values (e.g. '+150'), so the strict numeric literal check must allow it.

    // Act & Assert
    expect(evaluateNumericValidationExpression('+150', '>=100')).toBe(true);
    expect(evaluateNumericValidationExpression('+50', '>=100')).toBe(false);
  });

  it('should tokenizeLfConstraint for >4', () => {
    // Arrange
    const constraint: string = '>4';

    // Act
    const tokenized = numeric_testables.tokenizeLfConstraint(constraint);

    // Assert
    const expected = [
      { type: numeric_testables.LFTokenType.COMPARER, value: '>', startIndex: 0 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '4', startIndex: 1 }
    ];
    expect(tokenized).toEqual(expected);
  });

  it('should tokenizeLfConstraint for !>999', () => {
    // Arrange
    const constraint: string = '!>999';

    // Act
    const tokenized = numeric_testables.tokenizeLfConstraint(constraint);

    // Assert
    const expected = [
      { type: numeric_testables.LFTokenType.NOT, value: '!', startIndex: 0 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '>', startIndex: 1 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '999', startIndex: 2 }
    ];
    expect(tokenized).toEqual(expected);
  });

  it('should tokenizeLfConstraint for 1 < & < 10', () => {
    // Arrange
    const constraint: string = '1 < & < 10';

    // Act
    const tokenized = numeric_testables.tokenizeLfConstraint(constraint);

    // Assert
    const expected = [
      { type: numeric_testables.LFTokenType.NUMERIC, value: '1', startIndex: 0 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '<', startIndex: 2 },
      { type: numeric_testables.LFTokenType.LOGICAL, value: '&', startIndex: 4 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '<', startIndex: 6 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '10', startIndex: 8 }
    ];
    expect(tokenized).toEqual(expected);
  });

  it('should tokenizeLfConstraint for (>=100 & <=200) | (>=500 & <=900)', () => {
    // Arrange
    const constraint: string = '(>=100 & <=200) | (>=500 & <=900)';

    // Act
    const tokenized = numeric_testables.tokenizeLfConstraint(constraint);

    // Assert
    const expected = [
      { type: numeric_testables.LFTokenType.PARENTHESES, value: '(', startIndex: 0 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '>=', startIndex: 1 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '100', startIndex: 3 },
      { type: numeric_testables.LFTokenType.LOGICAL, value: '&', startIndex: 7 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '<=', startIndex: 9 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '200', startIndex: 11 },
      { type: numeric_testables.LFTokenType.PARENTHESES, value: ')', startIndex: 14 },
      { type: numeric_testables.LFTokenType.LOGICAL, value: '|', startIndex: 16 },
      { type: numeric_testables.LFTokenType.PARENTHESES, value: '(', startIndex: 18 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '>=', startIndex: 19 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '500', startIndex: 21 },
      { type: numeric_testables.LFTokenType.LOGICAL, value: '&', startIndex: 25 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '<=', startIndex: 27 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '900', startIndex: 29 },
      { type: numeric_testables.LFTokenType.PARENTHESES, value: ')', startIndex: 32 }
    ];
    expect(tokenized).toEqual(expected);
  });

  it('should tokenizeLfConstraint for uppercase and lowercase AND', () => {
    // Arrange
    const constraint: string = '<999 and <999 AnD <999& <999';

    // Act
    const tokenized = numeric_testables.tokenizeLfConstraint(constraint);

    // Assert
    const expected = [
      { type: numeric_testables.LFTokenType.COMPARER, value: '<', startIndex: 0 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '999', startIndex: 1 },
      { type: numeric_testables.LFTokenType.WORD, value: 'and', startIndex: 5 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '<', startIndex: 9 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '999', startIndex: 10 },
      { type: numeric_testables.LFTokenType.WORD, value: 'and', startIndex: 14 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '<', startIndex: 18 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '999', startIndex: 19 },
      { type: numeric_testables.LFTokenType.LOGICAL, value: '&', startIndex: 22 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '<', startIndex: 24 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '999', startIndex: 25 }
    ];
    expect(tokenized).toEqual(expected);
  });

  it('should tokenizeLfConstraint for uppercase and lowercase OR', () => {
    // Arrange
    const constraint: string = '<999 oR <999 or <999OR <999 |   <999';

    // Act
    const tokenized = numeric_testables.tokenizeLfConstraint(constraint);

    // Assert
    const expected = [
      { type: numeric_testables.LFTokenType.COMPARER, value: '<', startIndex: 0 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '999', startIndex: 1 },
      { type: numeric_testables.LFTokenType.WORD, value: 'or', startIndex: 5 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '<', startIndex: 8 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '999', startIndex: 9 },
      { type: numeric_testables.LFTokenType.WORD, value: 'or', startIndex: 13 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '<', startIndex: 16 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '999', startIndex: 17 },
      { type: numeric_testables.LFTokenType.WORD, value: 'or', startIndex: 20 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '<', startIndex: 23 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '999', startIndex: 24 },
      { type: numeric_testables.LFTokenType.LOGICAL, value: '|', startIndex: 28 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '<', startIndex: 32 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '999', startIndex: 33 }
    ];
    expect(tokenized).toEqual(expected);
  });

  it('should evaluate correctly even when eval() is unavailable (e.g. blocked by a CSP disallowing unsafe-eval)', () => {
    // Arrange
    const originalEval = globalThis.eval;
    // @ts-expect-error intentionally breaking eval to simulate a CSP-restricted environment
    globalThis.eval = () => {
      throw new EvalError('eval is disabled by Content-Security-Policy');
    };

    try {
      // Act & Assert
      expect(evaluateNumericValidationExpression('126', '>=100 and <=999')).toBe(true);
      expect(evaluateNumericValidationExpression('99', '>=100 and <=999')).toBe(false);
      expect(evaluateNumericValidationExpression('5', '>=1 & <=10 | >=100 & <=200')).toBe(true);
      expect(evaluateNumericValidationExpression('50', '>=1 & <=10 | >=100 & <=200')).toBe(false);
      expect(evaluateNumericValidationExpression('50', '!(>=1 & <=10)')).toBe(true);
    } finally {
      globalThis.eval = originalEval;
    }
  });

  it('should return false for constraints with unbalanced parentheses', () => {
    // Arrange
    const missingClose: string = '>=1 & (<=5';
    const strayClose: string = '>=1) & <=5';
    const missingCloseLeadingOpen: string = '(>=1 & <=5';

    // Act & Assert
    expect(evaluateNumericValidationExpression('5', missingClose)).toBeFalsy();
    expect(evaluateNumericValidationExpression('5', strayClose)).toBeFalsy();
    expect(evaluateNumericValidationExpression('5', missingCloseLeadingOpen)).toBeFalsy();
  });

  it('should throw for a malformed JSToken sequence missing a closing parenthesis', () => {
    // Arrange: unit-tests evaluateJsTokens directly with a hand-built token array,
    // since real constraint strings that reach it always have balanced parens or
    // fail earlier during tokenization/conversion.
    const { JSTokenType, evaluateJsTokens } = numeric_testables;
    const tokens = [
      { type: JSTokenType.PARENTHESES, value: '(', startIndex: 0 },
      { type: JSTokenType.NUMERIC, value: '5', startIndex: 1 },
      { type: JSTokenType.COMPARER, value: '>=', startIndex: 2 },
      { type: JSTokenType.NUMERIC, value: '1', startIndex: 4 }
    ];

    // Act & Assert
    expect(() => evaluateJsTokens(tokens)).toThrow('Expected closing parenthesis');
  });

  it('should throw for a malformed JSToken sequence with a stray trailing token', () => {
    // Arrange
    const { JSTokenType, evaluateJsTokens } = numeric_testables;
    const tokens = [
      { type: JSTokenType.NUMERIC, value: '5', startIndex: 0 },
      { type: JSTokenType.COMPARER, value: '>=', startIndex: 1 },
      { type: JSTokenType.NUMERIC, value: '1', startIndex: 3 },
      { type: JSTokenType.PARENTHESES, value: ')', startIndex: 4 }
    ];

    // Act & Assert
    expect(() => evaluateJsTokens(tokens)).toThrow('Unexpected trailing tokens');
  });

  it('should validate a constraint with adjacent/nested parentheses (grouped into one multi-char token)', () => {
    // Arrange: tokenizeLfConstraint groups consecutive '(' or ')' characters into a
    // single token (e.g. value '((' ), which the token-walking evaluator must expand
    // back into individual parens rather than assuming one character per token.
    const numericConstraint: string = '((>=1 & <=5) | (>=10 & <=15)) & !>=12';

    // Act & Assert
    expect(evaluateNumericValidationExpression('1', numericConstraint)).toBe(true);
    expect(evaluateNumericValidationExpression('11', numericConstraint)).toBe(true);
    expect(evaluateNumericValidationExpression('12', numericConstraint)).toBe(false);
    expect(evaluateNumericValidationExpression('15', numericConstraint)).toBe(false);
    expect(evaluateNumericValidationExpression('20', numericConstraint)).toBe(false);
  });

  it('should match what eval() would compute, across a wide sweep of values and constraints', () => {
    // Arrange: evaluateJsTokens replaced a plain eval(expression) call. This
    // differential test rebuilds the same expression string that used to be eval'd
    // (via the still-exposed getJsTokensWithNumber pipeline) and treats eval() as the
    // reference oracle, so a future change to the parser can't silently drift from
    // what eval() would have done for any well-formed (or consistently-malformed)
    // constraint or value.
    const values = ['0', '1', '-1', '4', '10', '12', '15', '20', '100', '99', '100.5', '999', '1000', '-999', '0.35', '2.5', '2.51', '-2', '12345', '150abc', '+150', '2.5e2', '1e3', '-1.5e-2'];
    const constraints = [
      '>=1000 &  <=9999', '>=0', '>4', '<=2.5', '!>999', '!!!>999', '!!>999',
      '1 < & < 10', '(>=100 & <=200) | (>=500 & <=900)', '>=100 and <=999', '>=100 AND <=999',
      '!(>=1 & <=10)', 'not (>=1 and <=10)', '((>=1 & <=5) | (>=10 & <=15)) & !>=12',
      '(((>=1 & <=5)))', '!((>=1 & <=5) | (>=10 & <=15))', '((>=1) & (<=5)) | ((>=10) & (<=15))',
      '(((>=1 & <=5) | (>=10 & <=15)) & !>=12) | (>=100 & <=105)',
      '>=10 & <=20 & <>15', '=1 | =5 | =10', '>=100.0.0'
    ];

    const mismatches: string[] = [];
    for (const value of values) {
      for (const constraint of constraints) {
        const tokens = numeric_testables.getJsTokensWithNumber(value, constraint);
        const expression: string = tokens.map(token => token.value).join('');
        let expected: boolean;
        try {
          // eslint-disable-next-line no-eval
          expected = eval(expression);
        }
        catch {
          // mirrors evaluateNumericValidationExpression's own try/catch around eval()
          expected = false;
        }
        const actual: boolean = evaluateNumericValidationExpression(value, constraint);
        if (actual !== expected) {
          mismatches.push(`value=${JSON.stringify(value)} constraint=${JSON.stringify(constraint)} expression=${JSON.stringify(expression)} eval=${expected} actual=${actual}`);
        }
      }
    }

    // Assert
    expect(mismatches).toEqual([]);
  });

  it('should tokenizeLfConstraint for uppercase and lowercase NOT', () => {
    // Arrange
    const constraint: string = '!>=999 or NOT >=999 OR not>=999|nOT>=999';

    // Act
    const tokenized = numeric_testables.tokenizeLfConstraint(constraint);

    // Assert
    const expected = [
      { type: numeric_testables.LFTokenType.NOT, value: '!', startIndex: 0 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '>=', startIndex: 1 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '999', startIndex: 3 },
      { type: numeric_testables.LFTokenType.WORD, value: 'or', startIndex: 7 },
      { type: numeric_testables.LFTokenType.WORD, value: 'not', startIndex: 10 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '>=', startIndex: 14 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '999', startIndex: 16 },
      { type: numeric_testables.LFTokenType.WORD, value: 'or', startIndex: 20 },
      { type: numeric_testables.LFTokenType.WORD, value: 'not', startIndex: 23 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '>=', startIndex: 26 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '999', startIndex: 28 },
      { type: numeric_testables.LFTokenType.LOGICAL, value: '|', startIndex: 31 },
      { type: numeric_testables.LFTokenType.WORD, value: 'not', startIndex: 32 },
      { type: numeric_testables.LFTokenType.COMPARER, value: '>=', startIndex: 35 },
      { type: numeric_testables.LFTokenType.NUMERIC, value: '999', startIndex: 37 }
    ];
    expect(tokenized).toEqual(expected);
  });
});
