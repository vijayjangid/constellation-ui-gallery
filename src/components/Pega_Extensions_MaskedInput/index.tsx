import { useEffect, useState, useRef, type MouseEvent } from 'react';
import { Input, FieldValueList, Text, Configuration } from '@pega/cosmos-react-core';
import IMask, { type FactoryArg, type InputMaskElement } from 'imask';

export type MaskedInputProps = {
  getPConnect?: any;
  label: string;
  mask: string;
  value?: string;
  helperText?: string;
  placeholder?: string;
  validatemessage?: string;
  hideLabel?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  testId?: string;
  fieldMetadata?: any;
  additionalProps?: any;
  displayMode?: string;
  variant?: any;
  hasSuggestions?: boolean;
};

// props passed in combination of props from property panel (config.json) and run time props from Constellation
// any default values in config.pros should be set in defaultProps at bottom of this file
const PegaExtensionsMaskedInput = (props: MaskedInputProps) => {
  const {
    getPConnect,
    placeholder,
    validatemessage = '',
    label,
    mask,
    value,
    hideLabel = false,
    helperText = '',
    testId = '',
    fieldMetadata,
    additionalProps,
    displayMode,
    variant,
    hasSuggestions
  } = props;
  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = pConn.getStateProps().value;
  const maxLength = fieldMetadata?.maxLength;
  const hasValueChange = useRef(false);
  const [maskObj, setMask] = useState<any>(null);
  const ref = useRef<InputMaskElement>(null);

  let { readOnly, required, disabled } = props;
  [readOnly, required, disabled] = [readOnly, required, disabled].map(
    prop => prop === true || (typeof prop === 'string' && prop === 'true')
  );

  const [inputValue, setInputValue] = useState(value);
  const [status, setStatus] = useState(hasSuggestions ? 'pending' : undefined);

  useEffect(() => setInputValue(value), [value]);

  useEffect(() => {
    if (ref?.current && !disabled && !readOnly) {
      const maskOptions: FactoryArg = {
        mask,
        definitions: {
          // defaults are '0', 'a', '*'
          // You can extend by adding other characters
          A: /[A-Z]/
        }
      };
      if (maskObj) {
        maskObj.updateOptions(maskOptions);
      } else {
        setMask(IMask(ref.current, maskOptions));
      }
    }
  }, [ref, mask]);

  useEffect(() => {
    if (validatemessage !== '') {
      setStatus('error');
    }
    if (hasSuggestions) {
      setStatus('pending');
    } else if (!hasSuggestions && status !== 'success') {
      setStatus(validatemessage !== '' ? 'error' : undefined);
    }
  }, [validatemessage, hasSuggestions]);

  const displayComp = value || '';
  if (displayMode === 'DISPLAY_ONLY') {
    return (
      <Configuration>
        <Text>{displayComp}</Text>
      </Configuration>
    );
  } else if (displayMode === 'LABELS_LEFT') {
    return (
      <Configuration>
        <FieldValueList
          variant={hideLabel ? 'stacked' : variant}
          data-testid={testId}
          fields={[{ id: '1', name: hideLabel ? '' : label, value: displayComp }]}
        />
      </Configuration>
    );
  } else if (displayMode === 'STACKED_LARGE_VAL') {
    return (
      <Configuration>
        <Text variant='h1' as='span'>
          {displayComp}
        </Text>
      </Configuration>
    );
  }

  return (
    <Configuration>
      <Input
        {...additionalProps}
        ref={ref}
        label={label}
        labelHidden={hideLabel}
        info={validatemessage || helperText || mask}
        data-testid={testId}
        value={inputValue}
        status={status}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        maxLength={maxLength}
        onChange={(e: MouseEvent<HTMLInputElement>) => {
          if (hasSuggestions) {
            setStatus(undefined);
          }
          setInputValue(e.currentTarget.value);
          if (value !== e.currentTarget.value) {
            actions.updateFieldValue(propName, e.currentTarget.value);
            hasValueChange.current = true;
          }
        }}
        onBlur={(e: MouseEvent<HTMLInputElement>) => {
          if ((!value || hasValueChange.current) && !readOnly) {
            actions.triggerFieldChange(propName, e.currentTarget.value);
            if (hasSuggestions) {
              pConn.ignoreSuggestion();
            }
            hasValueChange.current = false;
          }
        }}
      />
    </Configuration>
  );
};

export default PegaExtensionsMaskedInput;
