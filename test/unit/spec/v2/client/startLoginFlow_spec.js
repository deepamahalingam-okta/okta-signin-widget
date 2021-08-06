import Settings from 'models/Settings';
import { startLoginFlow } from 'v2/client/startLoginFlow';
import sessionStorageHelper from 'v2/client/sessionStorageHelper';

jest.mock('v2/client/interact', () => {
  return {
    interact: () => { }
  };
});
jest.mock('v2/client/introspect', () => {
  return {
    introspect: () => { }
  };
});
jest.mock('v2/client/emailVerifyCallback', () => {
  return {
    emailVerifyCallback: () => { }
  };
});
const mocked = {
  introspect: require('v2/client/introspect'),
  interact: require('v2/client/interact'),
  emailVerifyCallback: require('v2/client/emailVerifyCallback')
};

describe('v2/client/startLoginFlow', () => {
  let testContext;

  beforeEach(() => {
    jest.spyOn(mocked.emailVerifyCallback, 'emailVerifyCallback')
      .mockResolvedValue('fake emailVerifyCallback response');
    const interact = jest.fn().mockResolvedValue({
      interactionHandle: 'fake_interaction_handle'
    });
    const introspect = jest.fn().mockResolvedValue({
      fake: 'first introspect response'
    });
    const settings = new Settings({
      baseUrl: 'localhost:1234',
      stateToken: 'a test state token from settings',
    });
    const authClient = {
      idx: {
        interact,
        introspect
      }
    };
    settings.authClient = authClient;
    testContext = {
      interact,
      introspect,
      authClient,
      settings
    };
  });

  it('shall use "proxyIdxResponse" if exists', async () => {
    const { settings, interact, introspect } = testContext;
    const proxyIdxResponse = {
      'messages': {
        'type': 'array',
        'value': [
          {
            'message': 'You do not have permission to perform the requested action.',
            'i18n': {
              'key': 'security.access_denied'
            },
            'class': 'ERROR'
          }
        ]
      }
    };
    settings.set({ proxyIdxResponse });
    const result = await startLoginFlow(settings);
    expect(result).toEqual({
      rawIdxState: proxyIdxResponse,
      context: proxyIdxResponse,
      neededToProceed: [],
    });
    expect(interact).not.toHaveBeenCalled();
    expect(introspect).not.toHaveBeenCalled();
  });

  it('shall do email verify callback when "stateTokenExternalId" is defined', async () => {
    const { settings } = testContext;
    settings.set('useInteractionCodeFlow', true);
    settings.set('stateTokenExternalId', 'abc');
    const result = await startLoginFlow(testContext.settings);
    expect(result).toEqual('fake emailVerifyCallback response');

    expect(mocked.emailVerifyCallback.emailVerifyCallback).toHaveBeenCalledWith(testContext.settings);
    expect(mocked.emailVerifyCallback.emailVerifyCallback).toHaveBeenCalledTimes(1);
    expect(mocked.introspect.introspect).not.toHaveBeenCalled();
    expect(mocked.interact.interact).not.toHaveBeenCalled();
  });

  it('shall run interaction flow when "useInteractionCodeFlow" is on', async () => {
    const { settings, interact, introspect } = testContext;
    settings.set('useInteractionCodeFlow', true);
    const result = await startLoginFlow(settings);
    expect(result).toEqual({
      fake: 'first introspect response'
    });

    expect(interact).toHaveBeenCalledTimes(1);
    expect(introspect).toHaveBeenCalledWith({
      interactionHandle:'fake_interaction_handle'
    });
  });

  it('shall introspect on "settings.stateToken"', async () => {
    const { settings, interact, introspect } = testContext;
    const result = await startLoginFlow(settings);
    expect(result).toEqual({
      fake: 'first introspect response'
    });

    expect(interact).not.toHaveBeenCalled();
    expect(introspect).toHaveBeenCalledTimes(1);
    expect(introspect).toHaveBeenCalledWith({
      stateHandle: 'a test state token from settings',
    });
    expect(settings.get('stateToken')).toBe('a test state token from settings');
  });

  it('shall introspect on "settings.stateToken" when overrideExistingStateToken is true', async () => {
    const { settings, interact, introspect } = testContext;
    sessionStorageHelper.setStateHandle('fake state handle from session storage');
    settings.set('overrideExistingStateToken', 'true');
    const result = await startLoginFlow(settings);
    expect(result).toEqual({
      fake: 'first introspect response'
    });

    expect(interact).not.toHaveBeenCalled();
    expect(introspect).toHaveBeenCalledTimes(1);
    expect(introspect).toHaveBeenCalledWith({
      stateHandle: 'a test state token from settings',
    });
    expect(settings.get('stateToken')).toBe('a test state token from settings');
  });

  it('shall introspect on "sessionStorage.stateToken"', async () => {
    const { settings, interact, introspect } = testContext;
    sessionStorageHelper.setStateHandle('fake state handle from session storage');
    const result = await startLoginFlow(settings);
    expect(result).toEqual({
      fake: 'first introspect response'
    });

    expect(interact).not.toHaveBeenCalled();
    expect(introspect).toHaveBeenCalledTimes(1);
    expect(introspect).toHaveBeenCalledWith({
      stateHandle: 'fake state handle from session storage',
    });
    expect(settings.get('stateToken'))
      .toBe('fake state handle from session storage');
  });

  it('shall introspect on "settings.stateToken" when "sessionStorage.stateToken" is invalid', async () => {
    const { settings, interact, introspect } = testContext;
    introspect.mockReset();
    introspect
      .mockRejectedValueOnce({
        fake: 'ERROR - introspect response'
      })
      .mockResolvedValueOnce({
        fake: 'another introspect response'
      });

    sessionStorageHelper.setStateHandle('fake state handle from session storage');
    const result = await startLoginFlow(settings);
    expect(result).toEqual({
      fake: 'another introspect response'
    });

    expect(interact).not.toHaveBeenCalled();
    expect(introspect).toHaveBeenCalledTimes(2);
    expect(introspect.mock.calls[0][0])
      .toEqual({
        stateHandle: 'fake state handle from session storage'
      });
    expect(introspect.mock.calls[1][0])
      .toEqual({
        stateHandle: 'a test state token from settings'
      });

    expect(settings.get('stateToken')).toBe('a test state token from settings');
  });

  it('shall throw error when no valid config', async () => {
    const { settings } = testContext;
    settings.unset('stateToken');

    try {
      await startLoginFlow(settings);
      expect(false).toBe(true);
    } catch (e) {
      expect(e.name).toBe('CONFIG_ERROR');
      expect(e.message).toBe(
        'Set "useInteractionCodeFlow" to true in configuration to enable the ' +
        'interaction_code" flow for self-hosted widget.');
    }
  });
});
