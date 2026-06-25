import { useState, useCallback, useRef } from "react";

export function useUndoRedo<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  const isUndoRedoActive = useRef(false);

  const setWithHistory = useCallback((newState: T | ((prev: T) => T)) => {
    setState((current) => {
      const resolved = typeof newState === 'function' ? (newState as Function)(current) : newState;
      if (JSON.stringify(resolved) !== JSON.stringify(current) && !isUndoRedoActive.current) {
        setPast((p) => [...p, current]);
        setFuture([]);
      }
      return resolved;
    });
  }, []);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    isUndoRedoActive.current = true;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, p.length - 1));
    setState((current) => {
      setFuture((f) => [current, ...f]);
      return previous;
    });
    setTimeout(() => { isUndoRedoActive.current = false; }, 0);
  }, [past]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    isUndoRedoActive.current = true;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setState((current) => {
      setPast((p) => [...p, current]);
      return next;
    });
    setTimeout(() => { isUndoRedoActive.current = false; }, 0);
  }, [future]);

  return { state, set: setWithHistory, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}
