export type EventProps = Record<string, string | number | boolean | null>;

/**
 * One analytics backend. Adapters live in `sinks/` and are the only files
 * allowed to import a vendor SDK, so swapping vendors is one new sink.
 */
export type AnalyticsSink = {
  name: string;
  track: (event: string, props: EventProps) => void;
  /** Called once at setup and whenever the parent toggles sharing. */
  setEnabled: (enabled: boolean) => void;
  flush: () => Promise<void>;
};
