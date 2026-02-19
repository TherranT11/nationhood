-- Migration: Add "Ethnic Minority Unrest" ministry event template
-- Ministry: Interior | Gov Type: Autocracy | Priority: Critical
-- Event Key: interior_auto_ethnic_unrest

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
    'interior_auto_ethnic_unrest',
    'Ethnic Tensions Escalating in Northern Territories',
    'Provincial Security Command',
    'interior',
    'critical',
    3,
    16,
    true,
    ARRAY['Autocracy'],
    'civil_unrest',
    '>',
    40,
    '{
        "titles": [
            "Ethnic Tensions Escalating in Northern Territories",
            "Security Alert: Minority Community Organizing in the North"
        ],
        "weight_conditions": [
            { "stat": "civil_unrest", "op": ">", "value": 40 },
            { "stat": "happiness", "op": "<", "value": 40 }
        ],
        "Autocracy": {
            "bodies": [
                "Minister, the ethnic minority population in the northern territories has begun organizing large-scale demonstrations demanding cultural autonomy and an end to what they call \u2018demographic engineering.\u2019 Local security forces report that the protests are peaceful but growing rapidly. Community leaders are requesting a meeting with central government. Regional military commanders are requesting permission to deploy. The international press is starting to arrive."
            ],
            "options": [
                {
                    "label": "Deploy Security Forces \u2014 Restore Order",
                    "ap": 3,
                    "money": 18000,
                    "money_scaling_stat": "civil_unrest",
                    "outcomes": [
                        {
                            "chance": 30,
                            "label": "Overwhelming Force, Protests Disperse",
                            "message": "The sheer size of the security deployment convinced most protesters to go home. Community leaders are in detention. The streets are quiet. International journalists were escorted out of the region before the deployment.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": -8, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -8, "target": "nation" },
                                { "stat_key": "happiness", "change": -6, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -3, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -6, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 2, "target": "minister" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Heavy Security Presence Ends Northern Protests in {nation}",
                            "civic_event_text": "Demonstrations in {nation}\u2019s northern territories ended abruptly following a major security deployment. International observers have been unable to independently verify conditions in the region as access has been restricted."
                        },
                        {
                            "chance": 40,
                            "label": "Violent Clashes",
                            "message": "Protesters refused to disperse. What followed was hours of street battles, tear gas, and mass arrests. Images are already circulating internationally. The UN has issued a statement of concern. The protests have stopped, but at what cost?",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": -2, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -10, "target": "nation" },
                                { "stat_key": "happiness", "change": -8, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -7, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -10, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -2, "target": "minister" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Violence Erupts as {nation} Forces Clash With Minority Protesters",
                            "civic_event_text": "Graphic footage has emerged showing security forces in {nation} firing tear gas and beating demonstrators during a crackdown on minority protests in the northern territories. The United Nations has called for restraint and an independent investigation."
                        },
                        {
                            "chance": 30,
                            "label": "Security Forces Refuse to Fire on Civilians",
                            "message": "Local police units, many of whom are from the minority community themselves, refused orders to disperse the crowd. Some joined the protesters. The chain of command has fractured in the north.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 10, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -10, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -8, "target": "minister" },
                                { "stat_key": "freedom_index", "change": -3, "target": "nation" }
                            ]
                        }
                    ]
                },
                {
                    "label": "Meet the Community Leaders \u2014 Controlled Dialogue",
                    "ap": 1,
                    "money": 5000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 35,
                            "label": "Productive Meeting, Tensions Ease",
                            "message": "The community leaders were brought to the capital under heavy escort. In private, they proved pragmatic \u2014 willing to accept symbolic cultural concessions in exchange for an end to certain security practices. The protests have scaled down. The hardliners on both sides are unhappy, but the crisis has cooled.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": -4, "target": "nation" },
                                { "stat_key": "happiness", "change": 2, "target": "nation" },
                                { "stat_key": "legitimacy", "change": 2, "target": "nation" },
                                { "stat_key": "freedom_index", "change": 1, "target": "nation" },
                                { "stat_key": "international_reputation", "change": 2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 40,
                            "label": "Dialogue Seen as Stalling",
                            "message": "The leaders attended the meeting but left unsatisfied, calling the government\u2019s offers \u2018empty gestures.\u2019 The protests have resumed with even greater numbers. However, the fact that you met with them has slightly improved your international image.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 2, "target": "nation" },
                                { "stat_key": "international_reputation", "change": 2, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -1, "target": "nation" },
                                { "stat_key": "happiness", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -2, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 25,
                            "label": "Hardliners Outflank the Moderates",
                            "message": "By engaging with moderate leaders, you\u2019ve made them targets within their own community. Younger, more radical organizers have seized control of the movement, dismissing the moderates as collaborators. The new leadership isn\u2019t interested in talking.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 6, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -3, "target": "nation" },
                                { "stat_key": "happiness", "change": -3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" }
                            ]
                        }
                    ]
                },
                {
                    "label": "Information Blackout \u2014 Control the Narrative",
                    "ap": 2,
                    "money": 8000,
                    "money_scaling_stat": "freedom_index",
                    "outcomes": [
                        {
                            "chance": 40,
                            "label": "Blackout Holds",
                            "message": "Internet and phone services in the northern territories have been cut. Foreign journalists have been expelled from the region. Domestically, state media reports the situation as a \u2018minor disturbance\u2019 now resolved. Internationally, the silence itself is the story \u2014 but without footage, it fades quickly.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": -2, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -8, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -4, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -1, "target": "nation" },
                                { "stat_key": "happiness", "change": -3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 35,
                            "label": "Footage Gets Out Anyway",
                            "message": "Despite the blackout, satellite phones and smuggled recordings have reached international media. The blackout itself has become the headline \u2014 proof that something worth hiding is happening. The Streisand effect in full force.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 1, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -8, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -8, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -3, "target": "minister" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Smuggled Footage Contradicts {nation} Government Claims About Northern Unrest",
                            "civic_event_text": "Despite a communications blackout imposed by authorities, video recordings from {nation}\u2019s northern territories have reached international broadcasters, showing large-scale protests and heavy security presence contradicting official claims of calm."
                        },
                        {
                            "chance": 25,
                            "label": "Blackout Causes Panic",
                            "message": "The sudden communications cutoff has caused panic not just in the north but nationally. Rumors are spreading \u2014 massacres, military coups, foreign invasion. You\u2019ve turned a regional protest into a national anxiety crisis.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 7, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -8, "target": "nation" },
                                { "stat_key": "happiness", "change": -6, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -5, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -5, "target": "minister" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Communications Blackout Sparks Nationwide Panic in {nation}",
                            "civic_event_text": "A government-imposed communications shutdown in the northern territories has triggered widespread fear and misinformation across {nation}. Citizens in the capital report being unable to reach family members in the affected region."
                        }
                    ]
                }
            ]
        }
    }'::jsonb
);
