-- Migration: Add "Governor Defiance" ministry event template
-- Ministry: Interior | Gov Type: Autocracy | Priority: Critical
-- Event Key: interior_auto_governor_defiance

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
    'interior_auto_governor_defiance',
    'Provincial Governor Refuses to Implement Decree',
    'Office of Provincial Administration',
    'interior',
    'critical',
    3,
    14,
    true,
    ARRAY['Autocracy'],
    'legitimacy',
    '<',
    50,
    '{
        "titles": [
            "Provincial Governor Refuses to Implement Decree",
            "Open Defiance from Governor of the Eastern Province"
        ],
        "weight_conditions": [
            { "stat": "legitimacy", "op": "<", "value": 50 },
            { "stat": "corruption", "op": ">", "value": 40 }
        ],
        "Autocracy": {
            "bodies": [
                "Minister, the Governor of the Eastern Province has publicly refused to implement the central government\u2019s latest directive, calling it \u2018illegitimate overreach.\u2019 He has the loyalty of the provincial police and significant popular support in the region. Other governors are watching closely. If this goes unanswered, it sets a precedent. If it\u2019s handled clumsily, it could trigger a broader crisis."
            ],
            "options": [
                {
                    "label": "Remove the Governor by Force",
                    "ap": 3,
                    "money": 20000,
                    "money_scaling_stat": "civil_unrest",
                    "outcomes": [
                        {
                            "chance": 35,
                            "label": "Swift Removal, Order Restored",
                            "message": "Security forces entered the provincial capital at dawn. The governor was detained without incident \u2014 his police force stood down when they saw the numbers. A loyalist replacement has been installed. The other governors have gone very quiet.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": -3, "target": "nation" },
                                { "stat_key": "legitimacy", "change": 2, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -6, "target": "nation" },
                                { "stat_key": "happiness", "change": -4, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 3, "target": "minister" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Eastern Governor Removed From Office by Central Authorities",
                            "civic_event_text": "The Governor of {nation}\u2019s Eastern Province was removed from office by security forces after publicly refusing to implement government directives. A replacement has been appointed by the Interior Ministry."
                        },
                        {
                            "chance": 40,
                            "label": "Removal Succeeds, Resistance Follows",
                            "message": "The governor is gone, but his supporters have taken to the streets. Protests are spreading across the eastern province and there are reports of civil servants refusing to cooperate with the new appointee. You\u2019ve won the battle but started a longer fight.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 5, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -5, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -2, "target": "nation" },
                                { "stat_key": "happiness", "change": -6, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -5, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Protests Erupt After Governor\u2019s Removal in {nation}",
                            "civic_event_text": "Thousands have taken to the streets in {nation}\u2019s eastern provinces following the forced removal of a popular governor. Demonstrators are calling the action an abuse of central authority."
                        },
                        {
                            "chance": 25,
                            "label": "Provincial Police Resist",
                            "message": "The governor\u2019s provincial police force refused to stand down. A brief armed standoff ended without bloodshed, but only because our forces withdrew to avoid an incident. The governor remains in power and is now a national symbol of resistance.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 8, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -8, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -6, "target": "minister" },
                                { "stat_key": "international_reputation", "change": -3, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -3, "target": "nation" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Armed Standoff in Eastern Province as Governor Defies {nation} Central Government",
                            "civic_event_text": "An attempt to remove the defiant Governor of the Eastern Province ended in a humiliating withdrawal for central security forces after provincial police refused to cooperate. The incident has shaken confidence in the government\u2019s authority."
                        }
                    ]
                },
                {
                    "label": "Negotiate Privately \u2014 Offer a Deal",
                    "ap": 1,
                    "money": 8000,
                    "money_scaling_stat": "corruption",
                    "outcomes": [
                        {
                            "chance": 40,
                            "label": "Governor Backs Down Quietly",
                            "message": "After private negotiations, the governor agreed to implement the directive in exchange for greater autonomy on provincial taxation. Publicly, both sides declare the matter resolved through \u2018productive dialogue.\u2019 Face saved on both sides.",
                            "effects": [
                                { "stat_key": "legitimacy", "change": 1, "target": "nation" },
                                { "stat_key": "corruption", "change": 2, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 35,
                            "label": "Uneasy Truce",
                            "message": "The governor agreed to partial compliance but made clear this was a one-time courtesy. He\u2019s still in place, still popular, and still independently minded. You\u2019ve bought time, not a solution.",
                            "effects": [
                                { "stat_key": "corruption", "change": 1, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 25,
                            "label": "Governor Leaks the Negotiation",
                            "message": "The governor recorded the negotiation and leaked it to foreign media, framing it as proof that the central government knows its own decrees are illegitimate. The propaganda damage is severe.",
                            "effects": [
                                { "stat_key": "legitimacy", "change": -6, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -5, "target": "minister" },
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Leaked Recording Reveals {nation} Government Attempted Backroom Deal With Defiant Governor",
                            "civic_event_text": "An audio recording purportedly capturing private negotiations between the Interior Ministry and the Governor of the Eastern Province has surfaced in international media. The recording appears to show the government offering concessions to secure compliance with its own directives."
                        }
                    ]
                },
                {
                    "label": "Strangle His Funding \u2014 Slow Squeeze",
                    "ap": 1,
                    "money": 5000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 45,
                            "label": "Governor Capitulates",
                            "message": "With provincial budgets frozen, infrastructure projects halted, and civil servant paychecks delayed, the governor\u2019s popular support eroded within weeks. He quietly implemented the directive and requested a meeting. Power is leverage.",
                            "effects": [
                                { "stat_key": "corruption", "change": 1, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": -2, "target": "nation" },
                                { "stat_key": "legitimacy", "change": 1, "target": "nation" },
                                { "stat_key": "happiness", "change": -4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 2, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 35,
                            "label": "Province Suffers, Governor Holds",
                            "message": "The budget freeze is devastating the eastern province \u2014 hospitals are short-staffed, roads are crumbling \u2014 but the governor has framed it as punishment from a tyrannical central government. His approval has actually risen. Yours hasn\u2019t.",
                            "effects": [
                                { "stat_key": "happiness", "change": -6, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -2, "target": "minister" },
                                { "stat_key": "international_reputation", "change": -2, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Eastern Province Faces Humanitarian Concerns Amid Budget Dispute with {nation} Central Government",
                            "civic_event_text": "Hospitals and public services in {nation}\u2019s Eastern Province are reportedly deteriorating as a result of frozen central government transfers. Aid organizations have expressed concern about the impact on vulnerable populations."
                        },
                        {
                            "chance": 20,
                            "label": "Other Governors Rally Behind Him",
                            "message": "Three additional governors have jointly condemned the budget freeze and are threatening solidarity action. What was one defiant governor is now a coalition of four. The squeeze backfired catastrophically.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 6, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -6, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -5, "target": "minister" },
                                { "stat_key": "happiness", "change": -3, "target": "nation" },
                                { "stat_key": "corruption", "change": 2, "target": "nation" }
                            ]
                        }
                    ]
                }
            ]
        }
    }'::jsonb
);
