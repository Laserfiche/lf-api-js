// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import * as PKCEUtils from './PKCEUtils';

/**
 * Unit Tests
 *
 * @group UnitTests
 */

describe('PKCEUtils', () => {

  // TODO: the tests are excluded from jest.jsdom.config.js
  // they don't work for now as jsdom and TextEncoder are not supported in jsdom
  // https://github.com/jsdom/jsdom/issues/1612
  // https://github.com/jsdom/jsdom/issues/2524
  it('generateCodeVerifier generates a random string of length 43-128', () => {
    const code_verifier = PKCEUtils.generateCodeVerifier();
    expect((code_verifier.length <= 128 && code_verifier.length >= 43)).toBeTruthy();
  });

  it('generateCodeVerifier generates a random string of 0-9, a-z, A-Z, -._~', () => {
    const code_verifier = PKCEUtils.generateCodeVerifier();
    expect(/[\w\-.\~]*/.test(code_verifier)).toEqual(true);
  });

  it('generateCodeChallenge transforms the result of generateCodeVerifier to a output string using SHA-256 hash function', async () => {
    const code_verifier = PKCEUtils.generateCodeVerifier();
    const code_challenge_1 = await PKCEUtils.generateCodeChallengeAsync(code_verifier);
    const code_challenge_2 = await PKCEUtils.generateCodeChallengeAsync(code_verifier);
    expect(code_challenge_1).toEqual(code_challenge_2);
  });

});
