import React from 'react';
import thunk from 'redux-thunk';
import { useLocation } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import { NetworkType } from '@metamask/controller-utils';
import { renderWithProvider } from '../../../../../test/jest';
import { domainInitialState } from '../../../../ducks/domains';
import { INITIAL_SEND_STATE_FOR_EXISTING_DRAFT } from '../../../../../test/jest/mocks';
import { GasEstimateTypes } from '../../../../../shared/constants/gas';
import { KeyringType } from '../../../../../shared/constants/keyring';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { startNewDraftTransaction } from '../../../../ducks/send';
import { SendPage } from '.';

jest.mock('@ethersproject/providers', () => {
  const originalModule = jest.requireActual('@ethersproject/providers');
  return {
    ...originalModule,
    Web3Provider: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

jest.mock('../../../../ducks/send/send', () => {
  const original = jest.requireActual('../../../../ducks/send/send');
  return {
    ...original,
    // We don't really need to start a draft transaction, and the mock store
    // does not update as a result of action calls so instead we just ensure
    // that the action WOULD be called.
    startNewDraftTransaction: jest.fn(() => ({
      type: 'TEST_START_NEW_DRAFT',
      payload: null,
    })),
  };
});

describe('SendPage', () => {
  describe('render and initialization', () => {
    const middleware = [thunk];

    const baseStore = {
      send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
      DNS: domainInitialState,
      gas: {
        customData: { limit: null, price: null },
      },
      history: { mostRecentOverviewPage: 'activity' },
      metamask: {
        transactions: [
          {
            id: 1,
            txParams: {
              value: 'oldTxValue',
            },
          },
        ],
        gasEstimateType: GasEstimateTypes.legacy,
        gasFeeEstimates: {
          low: '0',
          medium: '1',
          fast: '2',
        },
        selectedAddress: '0x0',
        keyrings: [
          {
            type: KeyringType.hdKeyTree,
            accounts: ['0x0'],
          },
        ],
        selectedNetworkClientId: NetworkType.mainnet,
        networksMetadata: {
          [NetworkType.mainnet]: {
            EIPS: {},
            status: 'available',
          },
        },
        tokens: [],
        preferences: {
          useNativeCurrencyAsPrimaryCurrency: false,
        },
        currentCurrency: 'USD',
        providerConfig: {
          chainId: CHAIN_IDS.GOERLI,
        },
        nativeCurrency: 'ETH',
        featureFlags: {
          sendHexData: false,
        },
        addressBook: {
          [CHAIN_IDS.GOERLI]: [],
        },
        cachedBalances: {
          [CHAIN_IDS.GOERLI]: {},
        },
        accounts: {
          '0x0': { balance: '0x0', address: '0x0', name: 'Account 1' },
        },
        identities: { '0x0': { address: '0x0' } },
        tokenAddress: '0x32e6c34cd57087abbd59b5a4aecc4cb495924356',
        tokenList: {
          '0x32e6c34cd57087abbd59b5a4aecc4cb495924356': {
            name: 'BitBase',
            symbol: 'BTBS',
            decimals: 18,
            address: '0x32E6C34Cd57087aBBD59B5A4AECC4cB495924356',
            iconUrl: 'BTBS.svg',
            occurrences: null,
          },
          '0x3fa400483487a489ec9b1db29c4129063eec4654': {
            name: 'Cryptokek.com',
            symbol: 'KEK',
            decimals: 18,
            address: '0x3fa400483487A489EC9b1dB29C4129063EEC4654',
            iconUrl: 'cryptokek.svg',
            occurrences: null,
          },
        },
      },
      appState: {
        sendInputCurrencySwitched: false,
      },
    };

    it('should initialize the ENS slice on render', () => {
      const store = configureMockStore(middleware)(baseStore);
      renderWithProvider(<SendPage />, store);
      const actions = store.getActions();
      expect(actions).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'DNS/enableDomainLookup',
          }),
        ]),
      );
    });

    it('should showQrScanner when location.search is ?scan=true', () => {
      useLocation.mockImplementation(() => ({ search: '?scan=true' }));
      const store = configureMockStore(middleware)(baseStore);
      renderWithProvider(<SendPage />, store);
      const actions = store.getActions();
      expect(actions).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'DNS/enableDomainLookup',
          }),
          expect.objectContaining({
            type: 'UI_MODAL_OPEN',
            payload: { name: 'QR_SCANNER' },
          }),
        ]),
      );
      useLocation.mockImplementation(() => ({ search: '' }));
    });

    it('should render correctly even when a draftTransaction does not exist', () => {
      const modifiedStore = {
        ...baseStore,
        send: {
          ...baseStore.send,
          currentTransactionUUID: null,
        },
      };
      const store = configureMockStore(middleware)(modifiedStore);
      const { container, getByTestId, getByPlaceholderText } =
        renderWithProvider(<SendPage />, store);

      // Ensure that the send flow renders on the add recipient screen when
      // there is no draft transaction.
      expect(
        getByPlaceholderText('Enter public address (0x) or ENS name'),
      ).toBeTruthy();

      expect(container).toMatchSnapshot();
      expect(getByTestId('send-page-network-picker')).toBeInTheDocument();
      expect(getByTestId('send-page-account-picker')).toBeInTheDocument();

      // Ensure we start a new draft transaction when its missing.
      expect(startNewDraftTransaction).toHaveBeenCalledTimes(1);
    });
  });
});
