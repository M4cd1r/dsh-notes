export const name = 'notes';
export function apply(ctx) {
  try {
    const log = ctx && ctx.log ? ctx.log : console;
    log.info('[dsh-notes] stub apply — full host lands in a later task');
  } catch { /* never throw outward */ }
}
