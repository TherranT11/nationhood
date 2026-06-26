// The coalition / agenda term catalogue: the label for each term type and a
// one-line human summary of a term's {type, params}. ONE source for the negotiate
// page (live term cards) and the government page (the inherited agenda list).
// The negotiate page keeps its own field/editing config; only the wording lives
// here so the two screens always describe a term the same way.

export const TERM_LABELS = {
  legislation: 'Pass Flagship Legislation',
  ministry:    'Promise a Ministry',
  policy:      'Support Policies',
  treaty:      'Sign / Cancel a Foreign Agreement',
  threshold:   'Change the Electoral Threshold',
  regime:      'Shift the Regime',
};

export function summarizeTerm(type, p) {
  p = p || {};
  switch (type) {
    case 'legislation': return 'Pass flagship legislation' + (p.text ? ': “' + p.text + '”' : ' (unspecified)');
    case 'ministry':    return 'Hand over the ' + (p.ministry || '…') + ' Ministry' + (p.to_party_name ? ' to ' + p.to_party_name : '');
    case 'policy':      return 'Support' + (p.text ? ': ' + p.text : ' their policy agenda');
    case 'treaty':      return (p.act || 'Sign') + ' ' + (p.text ? '“' + p.text + '” ' : 'an ') + 'agreement with ' + (p.nation || '…');
    case 'threshold':   return 'Set the electoral threshold to ' + (p.pct || '…');
    case 'regime':      return (p.dir || 'Increase') + ' the Regime by ' + (p.by || 1) + ' (toward ' + ((p.dir || 'Increase') === 'Increase' ? 'more open' : 'more closed') + ')';
    default:            return type;
  }
}
