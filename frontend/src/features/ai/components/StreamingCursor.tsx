/** Blinking cursor shown at the end of a streaming AI message */
export function StreamingCursor() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-4 w-0.5 bg-primary align-middle animate-[blink_1s_step-end_infinite]"
      style={{
        animation: 'blink 1s step-end infinite',
      }}
    />
  )
}
