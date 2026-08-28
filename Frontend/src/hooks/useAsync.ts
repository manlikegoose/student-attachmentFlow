import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../types/api';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

/**
 * Data fetching for a service call. Returns loading / error / data plus a refetch,
 * which is what every list and detail screen in the product is built on.
 */
export function useAsync<T>(
fetcher: () => Promise<T>,
deps: unknown[] = [])
: AsyncState<T> & {refetch: () => void;setData: (data: T) => void;} {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const [nonce, setNonce] = useState(0);
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcherRef.
    current().
    then((data) => {
      if (!cancelled && mounted.current) setState({ data, loading: false, error: null });
    }).
    catch((error: unknown) => {
      if (!cancelled && mounted.current) {
        setState((s) => ({ data: s.data, loading: false, error: errorMessage(error) }));
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback((data: T) => setState({ data, loading: false, error: null }), []);

  return useMemo(() => ({ ...state, refetch, setData }), [state, refetch, setData]);
}

/**
 * Mutation helper: tracks in-flight state and unpacks DRF field errors so forms can
 * render server-side validation without each screen re-implementing it.
 */
export function useMutation<TArgs extends unknown[], TResult>(
action: (...args: TArgs) => Promise<TResult>)
{
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setSubmitting(true);
      setError(null);
      setErrorCode(null);
      setFieldErrors({});
      try {
        return await action(...args);
      } catch (e) {
        if (e instanceof ApiError) {
          setFieldErrors(e.fieldErrors);
          setError(e.body.detail ?? (Object.keys(e.fieldErrors).length ? null : e.message));
          setErrorCode(typeof e.body.code === 'string' ? e.body.code : null);
        } else {
          setError(errorMessage(e));
        }
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [action]
  );

  const reset = useCallback(() => {
    setError(null);
    setErrorCode(null);
    setFieldErrors({});
  }, []);

  return { run, submitting, error, errorCode, fieldErrors, reset };
}