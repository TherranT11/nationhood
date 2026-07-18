// nationverse.js — shared constants for the new universe. ONE source for the nation stat set, used by
// the /backend Nation Creator + List of Nations AND the player-facing /nations chooser, so the stats
// (keys, labels, order) can never drift between authoring and display. Each entry: [key, label, description].
export const NV_STATS = [
  ['budget', 'Budget', 'Government finances and fiscal flexibility'],
  ['economic_growth', 'Economic Growth', 'Expansion or contraction of the economy'],
  ['inflation', 'Inflation', 'Rate at which prices rise and money loses purchasing power'],
  ['standard_of_living', 'Standard of Living', 'Average quality of life for citizens'],
  ['unrest', 'Unrest', 'Active protests, strikes, riots, insurgency, and instability'],
  ['legitimacy', 'Legitimacy', 'Public acceptance of the government and political system'],
  ['corruption', 'Corruption', 'Misuse of public office and institutional integrity'],
  ['state_capacity', 'State Capacity', 'Government ability to enforce laws, collect taxes, and implement policy'],
  ['civic_liberties', 'Civic Liberties', 'Freedom of speech, assembly, religion, and protection of individual rights from state overreach'],
  ['social_cohesion', 'Social Cohesion', 'Unity between ethnic, religious, regional, and class groups'],
  ['power_projection', 'Power Projection', 'Ability to influence events beyond national borders'],
  ['military_readiness', 'Military Readiness', 'Training, equipment, logistics, morale, and combat preparedness of the armed forces'],
  ['media_freedom', 'Media Freedom', 'Independence of the press and public access to information'],
  ['business_climate', 'Business Climate', 'Attractiveness of the country for investment and private enterprise'],
];
