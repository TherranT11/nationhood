-- Migration: Add "Secret Police Overreach" ministry event template
-- Ministry: Interior | Gov Type: Autocracy | Priority: Urgent
-- Event Key: interior_auto_secret_police_overreach

INSERT INTO ministry_event_templates (
    event_key,
    title,
    sender,
    ministry_key,
    priority,
    deadline_ticks,
    cooldown_ticks,
    is_active,
    gov_types,
    weight_stat,
    weight_operator,
    weight_value,
    variants
) VALUES (
    'interior_auto_secret_police_overreach',
    'State Security Agents Implicated in Unauthorized Operations',
    'Internal Affairs Review',
    'interior',
    'urgent',
    4,
    10,
    true,
    ARRAY['Autocracy'],
    'freedom_index',
    '<',
    35,
    '{
        "titles": [
            "State Security Agents Implicated in Unauthorized Operations",
            "Internal Report: Security Services Operating Beyond Mandate"
        ],
        "weight_conditions": [
            { "stat": "freedom_index", "op": "<", "value": 35 },
            { "stat": "corruption", "op": ">", "value": 45 }
        ],
        "Autocracy": {
            "bodies": [
                "Minister, an internal review has uncovered evidence that state security agents have been conducting unauthorized operations \u2014 extorting business owners, running protection rackets, and detaining citizens without filing reports. They\u2019ve built a shadow operation inside your security apparatus. The agents involved are effective, loyal to the regime, and extremely well-connected. Exposing them strengthens your institutions but weakens your enforcement arm. Ignoring it lets the rot deepen."
            ],
            "options": [
                {
                    "label": "Purge the Rogue Agents",
                    "ap": 2,
                    "money": 10000,
                    "money_scaling_stat": "corruption",
                    "outcomes": [
                        {
                            "chance": 40,
                            "label": "Clean Sweep",
                            "message": "Eighteen agents have been dismissed, six arrested. The internal affairs investigation was thorough and the security apparatus, while shaken, is cleaner. Business owners in affected districts are cautiously optimistic.",
                            "effects": [
                                { "stat_key": "corruption", "change": -4, "target": "nation" },
                                { "stat_key": "crime_rate", "change": -1, "target": "nation" },
                                { "stat_key": "freedom_index", "change": 2, "target": "nation" },
                                { "stat_key": "legitimacy", "change": 3, "target": "nation" },
                                { "stat_key": "happiness", "change": 2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 2, "target": "minister" },
                                { "stat_key": "civil_unrest", "change": 1, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "{nation} Interior Ministry Purges Rogue Security Agents",
                            "civic_event_text": "In a rare move, the Interior Ministry of {nation} has arrested and dismissed nearly two dozen state security personnel accused of extortion and unauthorized detentions. Minister {minister} described the action as necessary to maintain institutional integrity."
                        },
                        {
                            "chance": 35,
                            "label": "Partial Purge, Loyalist Backlash",
                            "message": "You removed the worst offenders, but their patrons within the security establishment are furious. Cooperation from intelligence operatives has dropped noticeably \u2014 they\u2019re worried they\u2019re next.",
                            "effects": [
                                { "stat_key": "corruption", "change": -2, "target": "nation" },
                                { "stat_key": "legitimacy", "change": 1, "target": "nation" },
                                { "stat_key": "efficiency", "change": -3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -2, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 25,
                            "label": "The Rot Goes Higher",
                            "message": "The investigation turned up connections to senior government officials. Pursuing this further means implicating people very close to power. You\u2019ve opened a door you may wish you hadn\u2019t.",
                            "effects": [
                                { "stat_key": "corruption", "change": -1, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -3, "target": "minister" },
                                { "stat_key": "civil_unrest", "change": 2, "target": "nation" }
                            ]
                        }
                    ]
                },
                {
                    "label": "Bring Them to Heel \u2014 Formalize Their Operation",
                    "ap": 1,
                    "money": 6000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 45,
                            "label": "Controlled Thugs",
                            "message": "The rogue agents have been read in under a new off-the-books directive. Their extortion rackets are now \u2018security fees\u2019 flowing into a slush fund you control. The corruption remains, but at least it\u2019s your corruption now.",
                            "effects": [
                                { "stat_key": "corruption", "change": 3, "target": "nation" },
                                { "stat_key": "crime_rate", "change": -2, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": -2, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -4, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 35,
                            "label": "Uneasy Compliance",
                            "message": "The agents agreed to report to you but are clearly resentful of oversight. They\u2019ve scaled back their operations but you\u2019re not confident they won\u2019t resume once attention shifts.",
                            "effects": [
                                { "stat_key": "corruption", "change": 1, "target": "nation" },
                                { "stat_key": "crime_rate", "change": -1, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -2, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -1, "target": "nation" }
                            ]
                        },
                        {
                            "chance": 20,
                            "label": "They Answer to Someone Else",
                            "message": "The agents smiled, nodded, and continued exactly as before. It turns out their real patron isn\u2019t you \u2014 it\u2019s someone in the military establishment. You\u2019ve just learned something dangerous about the power structure.",
                            "effects": [
                                { "stat_key": "corruption", "change": 2, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" }
                            ]
                        }
                    ]
                },
                {
                    "label": "Bury the Report",
                    "ap": 0,
                    "money": 0,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 30,
                            "label": "Stays Buried",
                            "message": "The internal affairs officer who wrote the report has been reassigned. The agents continue their operations undisturbed. For now, stability is maintained.",
                            "effects": [
                                { "stat_key": "corruption", "change": 2, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -2, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -1, "target": "nation" }
                            ]
                        },
                        {
                            "chance": 40,
                            "label": "Report Leaks Domestically",
                            "message": "Someone in internal affairs kept a copy. The report is now circulating among civil servants and opposition networks. Your decision to suppress it is part of the story.",
                            "effects": [
                                { "stat_key": "corruption", "change": 3, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -4, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -3, "target": "minister" },
                                { "stat_key": "freedom_index", "change": -3, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Leaked Report Alleges State Security Corruption in {nation}",
                            "civic_event_text": "A suppressed internal document detailing alleged extortion and abuse by state security agents in {nation} has been leaked to opposition groups. The Interior Ministry has denied the document\u2019s authenticity."
                        },
                        {
                            "chance": 30,
                            "label": "Report Leaks Internationally",
                            "message": "The report didn\u2019t just leak \u2014 it was smuggled to foreign journalists. It\u2019s now headline news abroad, complete with names, dates, and victim testimonies. International sanctions discussions are reportedly underway.",
                            "effects": [
                                { "stat_key": "corruption", "change": 3, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -5, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -8, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -5, "target": "minister" },
                                { "stat_key": "civil_unrest", "change": 4, "target": "nation" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Foreign Media Publishes Explosive Report on State Abuse in {nation}",
                            "civic_event_text": "International news outlets have published what they describe as an internal {nation} government document revealing systematic extortion and unlawful detention by state security forces. Several foreign governments have called for an independent investigation."
                        }
                    ]
                }
            ]
        }
    }'::jsonb
);
