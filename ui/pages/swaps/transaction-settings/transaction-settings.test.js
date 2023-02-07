import React from 'react';

import { renderWithProvider, fireEvent } from '../../../../test/jest';
import { Slippage } from '../../../../shared/constants/swaps';
import TransactionSettings from './transaction-settings';

const createProps = (customProps = {}) => {
  return {
    onSelect: jest.fn(),
    maxAllowedSlippage: 15,
    currentSlippage: Slippage.high,
    smartTransactionsEnabled: false,
    ...customProps,
  };
};

describe('TransactionSettings', () => {
  it('renders the component with initial props', () => {
    const { getByText, queryByText, getByTestId } = renderWithProvider(
      <TransactionSettings {...createProps()} />,
    );
    expect(getByText('2%')).toBeInTheDocument();
    expect(getByText('3%')).toBeInTheDocument();
    expect(getByText('custom')).toBeInTheDocument();
    expect(getByText('Advanced options')).toBeInTheDocument();
    expect(
      document.querySelector('.transaction-settings__header'),
    ).toMatchSnapshot();
    expect(
      document.querySelector('.transaction-settings__button-group'),
    ).toMatchSnapshot();
    expect(queryByText('Smart transaction')).not.toBeInTheDocument();
    expect(getByTestId('button-group__button1')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('renders the component with the smart transaction opt-in button available, opt into STX', () => {
    const setSmartTransactionsOptInStatus = jest.fn();
    const { getByText } = renderWithProvider(
      <TransactionSettings
        {...createProps({
          smartTransactionsEnabled: true,
          setSmartTransactionsOptInStatus,
        })}
      />,
    );
    expect(getByText('2%')).toBeInTheDocument();
    expect(getByText('3%')).toBeInTheDocument();
    expect(getByText('custom')).toBeInTheDocument();
    expect(getByText('Advanced options')).toBeInTheDocument();
    expect(
      document.querySelector('.transaction-settings__header'),
    ).toMatchSnapshot();
    expect(
      document.querySelector('.transaction-settings__button-group'),
    ).toMatchSnapshot();
    expect(getByText('Smart transaction')).toBeInTheDocument();
    expect(document.querySelector('.toggle-button--off')).toBeInTheDocument();
    fireEvent.click(document.querySelector('.toggle-button'));
    expect(setSmartTransactionsOptInStatus).toHaveBeenCalledWith(true, false);
  });

  it('renders slippage with a custom value', () => {
    const { getByText } = renderWithProvider(
      <TransactionSettings {...createProps({ currentSlippage: 2.5 })} />,
    );
    expect(getByText('2.5')).toBeInTheDocument();
  });

  it('renders the default slippage with Advanced options hidden', () => {
    const { getByText, queryByText } = renderWithProvider(
      <TransactionSettings
        {...createProps({ currentSlippage: Slippage.default })}
      />,
    );
    expect(getByText('Advanced options')).toBeInTheDocument();
    expect(document.querySelector('.fa-angle-down')).toBeInTheDocument();
    expect(queryByText('2%')).not.toBeInTheDocument();
  });

  it('opens the Advanced options section and sets a default slippage', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <TransactionSettings
        {...createProps({ currentSlippage: Slippage.default })}
      />,
    );
    fireEvent.click(getByText('Advanced options'));
    fireEvent.click(getByTestId('button-group__button0'));
    expect(getByTestId('button-group__button0')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('opens the Advanced options section and sets a high slippage', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <TransactionSettings
        {...createProps({ currentSlippage: Slippage.default })}
      />,
    );
    fireEvent.click(getByText('Advanced options'));
    fireEvent.click(getByTestId('button-group__button1'));
    expect(getByTestId('button-group__button1')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('sets a custom slippage value', () => {
    const { getByTestId } = renderWithProvider(
      <TransactionSettings {...createProps()} />,
    );
    fireEvent.click(getByTestId('button-group__button2'));
    expect(getByTestId('button-group__button2')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    const input = getByTestId('transaction-settings__custom-slippage');
    fireEvent.change(input, { target: { value: 5 } });
    fireEvent.click(document);
    expect(input).toHaveAttribute('value', '5');
  });
});
