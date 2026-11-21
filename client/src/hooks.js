import { useState, useEffect, useCallback, useRef } from 'react';

// Loads data when the component mounts or `deps` change. Returns { data, loading, error, reload }.
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const seq = useRef(0);
  const run = useCallback(async () => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await fn();
      if (id === seq.current) setState({ data, loading: false, error: '' });
    } catch (e) {
      if (id === seq.current) setState({ data: null, loading: false, error: e.message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
}
