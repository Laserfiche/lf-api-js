// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { LfLocalizationService } from './lf-localization.service.js';
require('isomorphic-fetch');

describe('LfLocalizationService', () => {
  let lfLocalizationService: LfLocalizationService;

  const resourcesFolder =
    'https://lfxstatic.com/npm/@laserfiche/lf-resource-library@5/resources/laserfiche-base';

  it('currentResource is undefined if language file does not exist in constructor and is not provided with initResourcesFromUrlAsync', () => {
    lfLocalizationService = new LfLocalizationService();
    expect(lfLocalizationService.currentResource).toEqual(undefined);
  });

  it('setLanguage does not set currentResource if no resources were passed in constructor and initResourcesFromUrlAsync has not been called', () => {
    lfLocalizationService = new LfLocalizationService();
    lfLocalizationService.setLanguage('fr-CA');

    expect(lfLocalizationService.currentResource).toEqual(undefined);
  });

  it('constructor should throw if provided map does not include English', () => {
    const resources = new Map([['test', { TEST_STRING: 'test string' }]]);
    const error =
      'Required language resource en-US is not found in provided map.';

    expect(() => {
      lfLocalizationService = new LfLocalizationService(resources);
    }).toThrow(error);
  });

  it('setLanguage assigns currentResource to the default language English if specified does not exist', () => {
    const resources = new Map([
      ['test', { TEST_STRING: 'test string' }],
      ['en-US', { TEST_STRING: 'test string' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);
    lfLocalizationService.setLanguage('fr-CA');

    expect(lfLocalizationService.currentResource?.language).toEqual('en-US');
  });

  it('setLanguage assigns specified language if specified exist', async () => {
    lfLocalizationService = new LfLocalizationService();
    lfLocalizationService.setLanguage('fr-FR');
    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);

    expect(lfLocalizationService.currentResource?.language).toEqual('fr-FR');
  });

  it('setLanguage assigns default language if specified does not exist, but default exist', async () => {
    lfLocalizationService = new LfLocalizationService();
    lfLocalizationService.setLanguage('nonexistent');
    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);

    expect(lfLocalizationService.currentResource?.language).toEqual('en-US');
  });

  it('setLanguage assigns language without area code if specified does not exist, but language without area code exists', async () => {
    lfLocalizationService = new LfLocalizationService();
    lfLocalizationService.setLanguage('es-XX');
    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);

    expect(lfLocalizationService.currentResource?.language).toEqual('es-MX');
  });

  it('calling setLanguage after calling initResourcesFromUrlAsync should not set specified language', async () => {
    lfLocalizationService = new LfLocalizationService();
    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);
    lfLocalizationService.setLanguage('fr-FR');

    expect(lfLocalizationService.currentResource?.language).toEqual('en-US');
  });

  it('calling setLanguage before calling initResourcesFromUrlAsync should set specified language', async () => {
    lfLocalizationService = new LfLocalizationService();
    lfLocalizationService.setLanguage('fr-FR');
    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);

    expect(lfLocalizationService.currentResource?.language).toEqual('fr-FR');
  });

  it('getString should return key when no map has been specified', () => {
    // Arrange
    lfLocalizationService = new LfLocalizationService();
    const stringKey: string = 'INVALID_FIELD_REQUIRED_FIELD_EMPTY';
    const expectedString: string = '<< INVALID_FIELD_REQUIRED_FIELD_EMPTY >>';

    // Assert
    expect(lfLocalizationService.getString(stringKey)).toEqual(expectedString);
  });

  it('getString with two parameters to be substituted', async () => {
    // Arrange
    lfLocalizationService = new LfLocalizationService();
    const stringKey: string = '0_OF_1';
    const expectedValue: string = 'five of ten';

    // Act
    lfLocalizationService.setLanguage('en-US');
    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);
    const localizedString = lfLocalizationService.getString(stringKey, [
      'five',
      'ten',
    ]);

    // Assert
    expect(localizedString).toEqual(expectedValue);
  });

  it('getString gets Spanish when spanish is specified', async () => {
    // Arrange
    lfLocalizationService = new LfLocalizationService();
    const stringKey: string = 'THIS_FOLDER_IS_EMPTY';
    const spanishValue: string = 'Esta carpeta está vacía.';

    // Act
    lfLocalizationService.setLanguage('es-MX');
    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);
    const localizedString = lfLocalizationService.getString(stringKey);

    // Assert
    expect(localizedString).toEqual(spanishValue);
  });

  it(`getString gets pt-BR when pt-BR is specified`, async () => {
    // Arrange
    lfLocalizationService = new LfLocalizationService();
    const stringKey: string = 'THIS_FOLDER_IS_EMPTY';
    const spanishValue: string = 'Esta pasta está vazia.';

    // Act
    lfLocalizationService.setLanguage('pt-BR');
    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);
    const localizedString = lfLocalizationService.getString(stringKey);

    // Assert
    expect(localizedString).toEqual(spanishValue);
  });

  it('getString gets english when selected language does not exist', async () => {
    // Arrange
    lfLocalizationService = new LfLocalizationService();
    const stringKey: string = 'THIS_FOLDER_IS_EMPTY';
    const englishValue: string = 'This folder is empty.';

    // Act
    lfLocalizationService.setLanguage('nonexistent');
    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);

    const localizedString = lfLocalizationService.getString(stringKey);

    // Assert
    expect(localizedString).toEqual(englishValue);
  });

  it('setLanguage gets English when current language is not English and requested language is unavailable', async () => {
    // Arrange
    const resources = new Map([
      ['es-MX', { TEST_STRING: 'spanish string' }],
      ['en-US', { TEST_STRING: 'test string' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);
    lfLocalizationService.setLanguage('es-MX');

    // Act
    lfLocalizationService.setLanguage('unknown');

    // Assert
    expect(lfLocalizationService.currentResource?.language).toEqual('en-US');
  });

  it(`getString should return key when selected language map exists,
   but string does not exist in neither selected language or default language`, async () => {
    // Arrange
    lfLocalizationService = new LfLocalizationService();
    const stringKey: string = 'NON_EXISTENT_STRING';
    const notFoundValue: string = '<< NON_EXISTENT_STRING >>';

    // Act
    lfLocalizationService.setLanguage('zh-Hant');
    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);
    const localizedString = lfLocalizationService.getString(stringKey);

    // Assert
    expect(localizedString).toEqual(notFoundValue);
  });

  it('initResourcesFromUrlAsync should return error when getting default language returns HTTP error 403', async () => {
    // Arrange
    lfLocalizationService = new LfLocalizationService();
    const message = `Required language resource en-US is not found in ${resourcesFolder}nonexistent/en-US.json.`;

    try {
      await lfLocalizationService.initResourcesFromUrlAsync(
        `${resourcesFolder}nonexistent`,
      );
    } catch (e) {
      const msg = (<Error>e).message;
      expect(msg.includes(message)).toBeTruthy();
    }
  });

  it('initResourcesFromUrlAsync should return error when getting HTTP error other than 403', async () => {
    // Arrange
    lfLocalizationService = new LfLocalizationService();
    const mockedResponse = new Response(null, { status: 500 });
    const globalFetch = global.fetch;
    global.fetch = jest.fn(() => Promise.resolve(mockedResponse));
    const resUrl = `${resourcesFolder}/en-US.json`;

    try {
      await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);
    } catch (e) {
      const msg = (<Error>e).message;
      expect(msg.includes('500')).toBeTruthy();
      expect(msg.includes(resUrl)).toBeTruthy();
    } finally {
      global.fetch = globalFetch;
    }
  });

  it('should be able to set custom json', () => {
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['es-MX', { TEST_STRING: 'prueba' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('es-MX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('prueba');
  });

  it('should be able to set custom json, default to English if translation does not exist', () => {
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['es-MX', { TEST_STRING: 'prueba' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('ar-EG');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');
  });

  it('should be able to set custom json, fr-FR will default to fr-CA if fr-FR does not exist', () => {
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['fr-CA', { TEST_STRING: 'french test' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('fr-FR');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('french test');
  });

  it('should be able to set custom json, fr-FR should use fr-FR if exists', () => {
    const testFrFrString = 'french FR test';
    const testFrCAString = 'french CA test';
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['fr-FR', { TEST_STRING: testFrFrString }],
      ['fr-CA', { TEST_STRING: testFrCAString }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('fr-FR');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual(testFrFrString);

    lfLocalizationService.setLanguage('fr-CA');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual(testFrCAString);
  });

  it('should be able to set custom json, fr-CA will default to en if no fr-CA or no fr', () => {
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['es-MX', { TEST_STRING: 'prueba' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('fr-CA');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');
  });

  it('should create pseudo language in debug mode for english', async () => {
    lfLocalizationService = new LfLocalizationService();
    lfLocalizationService.debugMode = true;
    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);

    expect(
      lfLocalizationService.getString(
        'DO_YOU_WANT_TO_APPLY_YOUR_FIELD_CHANGES',
      ),
    ).toEqual('_Ḓǿ ẏǿŭ ẇȧƞŧ ŧǿ ȧƥƥŀẏ ẏǿŭř ƒīḗŀḓ ƈħȧƞɠḗş?_');
  });

  it('should create pseudo language in debug mode for spanish', async () => {
    lfLocalizationService = new LfLocalizationService();
    lfLocalizationService.debugMode = true;
    lfLocalizationService.setLanguage('es');

    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);

    expect(
      lfLocalizationService.getString(
        'DO_YOU_WANT_TO_APPLY_YOUR_FIELD_CHANGES',
      ),
    ).toEqual('_¿Ḓḗşḗȧ ȧƥŀīƈȧř şŭş ƈȧḿƀīǿş ḓḗ ƈȧḿƥǿ?_');
  });

  it(`when requested language is zh-CN, current language is set to zh-Hans`, async () => {
    // Arrange
    lfLocalizationService = new LfLocalizationService();

    // Act
    lfLocalizationService.setLanguage('zh-CN');
    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);

    // Assert
    expect(lfLocalizationService.currentResource?.language).toEqual('zh-Hans');
  });

  it(`when requested language is zh-TW, current language is set to zh-Hant`, async () => {
    // Arrange
    lfLocalizationService = new LfLocalizationService();

    // Act
    lfLocalizationService.setLanguage('zh-TW');
    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);

    // Assert
    expect(lfLocalizationService.currentResource?.language).toEqual('zh-Hant');
  });

  it(`when requested language is zh-TW with custom JSON, current language is set to zh-Hant`, async () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['zh-Hans', { TEST_STRING: 'chinese simplified test' }],
      ['zh-Hant', { TEST_STRING: 'chinese traditional test' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act
    lfLocalizationService.setLanguage('zh-TW');

    // Assert
    expect(lfLocalizationService.currentResource?.language).toEqual('zh-Hant');
  });

  it(`when requested language is zh-CN with custom JSON, current language is set to zh-Hans`, async () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['zh-Hans', { TEST_STRING: 'chinese simplified test' }],
      ['zh-Hant', { TEST_STRING: 'chinese traditional test' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act
    lfLocalizationService.setLanguage('zh-CN');

    // Assert
    expect(lfLocalizationService.currentResource?.language).toEqual('zh-Hans');
  });

  it('should be able to set custom json, fr-XX will default to fr-CA', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['fr-CA', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('fr-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, ar-XX will default to ar-EG', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['ar-EG', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('ar-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it(`when requested language is en, current language is set to en-US`, async () => {
    // Arrange
    lfLocalizationService = new LfLocalizationService();

    // Act
    lfLocalizationService.setLanguage('');
    await lfLocalizationService.initResourcesFromUrlAsync(resourcesFolder);

    // Assert
    expect(lfLocalizationService.currentResource?.language).toEqual('en-US');
  });

  it('should be able to set custom json, en-XX will default to en-US', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');
  });

  it('should be able to set custom json, es-XX will default to es-MX', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['es-MX', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('es-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, it-XX will default to it-IT', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['it-IT', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('it-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, pt-XX will default to pt-BR', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['pt-BR', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('pt-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, th-XX will default to th-TH', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['th-TH', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('th-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, cs-XX will default to cs-CZ', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['cs-CZ', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('cs-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, el-XX will default to el-GR', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['el-GR', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('el-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, de-XX will default to de-DE', () => {
    // Arrange

    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['de-DE', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('de-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, id-XX will default to id-ID', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['id-ID', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('id-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, ja-XX will default to ja-JP', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['ja-JP', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('ja-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, ko-XX will default to ko-KR', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['ko-KR', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('ko-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, ms-XX will default to ms-MY', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['ms-MY', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('ms-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, nl-XX will default to nl-NL', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['nl-NL', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('nl-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, ro-XX will default to ro-RO', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['ro-RO', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('ro-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, sr-XX will default to sr-Latn', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['sr-Latn', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('sr-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, tr-XX will default to tr-TR', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['tr-TR', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('tr-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });

  it('should be able to set custom json, vi-XX will default to vi-VN', () => {
    // Arrange
    const resources: Map<string, object> = new Map([
      ['en-US', { TEST_STRING: 'test res' }],
      ['vi-VN', { TEST_STRING: 'fallback result' }],
    ]);
    lfLocalizationService = new LfLocalizationService(resources);

    // Act and Assert
    let localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('test res');

    lfLocalizationService.setLanguage('vi-XX');
    localizedString = lfLocalizationService.getString('TEST_STRING');
    expect(localizedString).toEqual('fallback result');
  });
});
