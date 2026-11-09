import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const Input = ({
  name,
  handleChange,
  label,
  autoFocus,
  type,
  handleShowPassword,
  value,
  error,
  helperText,
  InputProps,
  inputProps,
  InputLabelProps,
  ...rest
}) => {
  const inputRef = useRef(null);
  const [autoFilled, setAutoFilled] = useState(false);

  const checkAutofill = useCallback((el) => {
    if (!el) return;
    try {
      const filled = el.matches(':-webkit-autofill') || el.matches(':autofill');
      setAutoFilled((prev) => (prev === filled ? prev : filled));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return undefined;
    checkAutofill(el);
    const timers = [100, 300, 700, 1500].map((ms) => setTimeout(() => checkAutofill(el), ms));
    return () => timers.forEach(clearTimeout);
  }, [checkAutofill, value, type]);

  const handleAnimationStart = (e) => {
    if (e.animationName === 'mui-auto-fill') {
      setAutoFilled(true);
    } else if (e.animationName === 'mui-auto-fill-cancel') {
      setAutoFilled(false);
    }
    if (inputProps && inputProps.onAnimationStart) inputProps.onAnimationStart(e);
  };

  const hasValue = value !== undefined && value !== null && `${value}` !== '';

  return (
    <TextField
      name={name}
      onChange={handleChange}
      variant="outlined"
      required
      fullWidth
      label={label}
      autoFocus={autoFocus}
      type={type}
      value={value}
      error={Boolean(error)}
      helperText={helperText}
      inputRef={inputRef}
      InputLabelProps={{
        shrink: autoFilled || hasValue || undefined,
        ...InputLabelProps,
      }}
      inputProps={{ onAnimationStart: handleAnimationStart, ...inputProps }}
      InputProps={
        handleShowPassword
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleShowPassword}
                    edge="end"
                    aria-label={type === 'password' ? 'Show password' : 'Hide password'}
                  >
                    {type === 'password' ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
              ...InputProps,
            }
          : InputProps
      }
      {...rest}
    />
  );
};

export default Input;
