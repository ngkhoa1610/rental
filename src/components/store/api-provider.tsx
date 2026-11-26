"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ApiError,
  type Input,
  type OperationName,
  type Output,
  type RentalApi,
  type Session,
} from "@/lib/api/contracts";
import { createHttpApi } from "@/lib/api/http";
import { actionSuccess } from "@/lib/action-feedback";
import { ActionNotice } from "./action-notice";

function createRuntime(scope: "customer" | "admin") {
  let csrfToken: string | null = null;
  return {
    api: createHttpApi({ scope, getCsrfToken: () => csrfToken }),
    setCsrf: (value: string | null) => {
      csrfToken = value;
    },
  };
}
type Runtime = ReturnType<typeof createRuntime>;
interface ApiContextValue {
  api: RentalApi;
  session: Session;
  ready: boolean;
  sessionError: string;
  refreshSession: (requireProfile?: boolean) => Promise<boolean>;
  notify: (message: string) => void;
  draft: { pickupDate: string; returnDate: string; notes: string };
  setDraft: React.Dispatch<React.SetStateAction<ApiContextValue["draft"]>>;
}
const ApiContext = createContext<ApiContextValue | null>(null);
export function ApiProvider({
  children,
  runtime: supplied,
  scope = "customer",
}: {
  children: React.ReactNode;
  runtime?: Runtime;
  scope?: "customer" | "admin";
}) {
  const [runtime] = useState(() => supplied ?? createRuntime(scope));
  const [notice, setNotice] = useState({ message: "", sequence: 0 });
  const notify = useCallback(
    (message: string) =>
      setNotice((previous) => ({ message, sequence: previous.sequence + 1 })),
    [],
  );
  const [session, setSession] = useState<Session>({
    profile: null,
    csrfToken: null,
  });
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [draft, setDraft] = useState({
    pickupDate: "",
    returnDate: "",
    notes: "",
  });
  const loadVersion = useRef(0);
  const refreshSession = useCallback(
    async (requireProfile = false) => {
      const version = ++loadVersion.current;
      try {
        const value = await runtime.api.call("session.get", undefined);
        if (version !== loadVersion.current) return false;
        runtime.setCsrf(value.csrfToken);
        setSession(value);
        setSessionError("");
        return !requireProfile || Boolean(value.profile);
      } catch (error) {
        if (version !== loadVersion.current) return false;
        runtime.setCsrf(null);
        setSession({ profile: null, csrfToken: null });
        setSessionError(
          error instanceof Error ? error.message : "Unable to load session.",
        );
        return false;
      } finally {
        if (version === loadVersion.current) setReady(true);
      }
    },
    [runtime],
  );
  useEffect(() => {
    // Session hydration begins asynchronously after mount, never during SSR.
    let active = true;
    queueMicrotask(() => {
      if (active) void refreshSession();
    });
    const onFocus = () => {
      void refreshSession();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      active = false;
      loadVersion.current += 1;
    };
  }, [refreshSession, scope]);
  const [api] = useState<RentalApi>(() => ({
    async call<K extends OperationName>(
      operation: K,
      input: Input<K>,
      options?: { signal?: AbortSignal },
    ): Promise<Output<K>> {
      if (actionSuccess[operation]) notify("");
      try {
        const value = await runtime.api.call(operation, input, options);
        const message = actionSuccess[operation];
        if (message) notify(message);
        return value;
      } catch (error) {
        if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
          runtime.setCsrf(null);
          setSession({ profile: null, csrfToken: null });
        }
        if (error instanceof ApiError && error.code === "FORBIDDEN")
          await refreshSession();
        throw error;
      }
    },
  }));
  return (
    <ApiContext
      value={{
        api,
        session,
        ready,
        sessionError,
        refreshSession,
        notify,
        draft,
        setDraft,
      }}
    >
      {children}
      <ActionNotice
        message={notice.message}
        sequence={notice.sequence}
        scope={scope}
        onDismiss={() =>
          setNotice((previous) => ({ ...previous, message: "" }))
        }
      />
    </ApiContext>
  );
}
export function useRentalApi() {
  const value = useContext(ApiContext);
  if (!value) throw new Error("useRentalApi requires ApiProvider.");
  return value;
}

export function useApiAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function run(work: () => Promise<unknown>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (failure) {
      if (mounted.current)
        setError(failure instanceof Error ? failure.message : "Please retry.");
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return { busy, error, run, clearError: () => setError("") };
}

/** Retain the same key for an unchanged request after a timeout or double click. */
export function useRequestKey() {
  const last = useRef({ fingerprint: "", key: "" });
  return (input: unknown) => {
    const fingerprint = JSON.stringify(input);
    if (last.current.fingerprint !== fingerprint)
      last.current = { fingerprint, key: crypto.randomUUID() };
    return last.current.key;
  };
}
