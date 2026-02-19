-- Migration: Add "Border Region Warlord" ministry event template
-- Ministry: Interior | Gov Type: Autocracy | Priority: Critical
-- Event Key: interior_auto_border_warlord

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
    'interior_auto_border_warlord',
    'Armed Group Consolidating Control in Border Region',
    'Provincial Military Command',
    'interior',
    'critical',
    4,
    20,
    true,
    ARRAY['Autocracy'],
    'crime_rate',
    '>',
    50,
    '{
        "titles": [
            "Armed Group Consolidating Control in Border Region",
            "Local Strongman Building Parallel Authority in the South"
        ],
        "weight_conditions": [
            { "stat": "crime_rate", "op": ">", "value": 50 },
            { "stat": "legitimacy", "op": "<", "value": 45 }
        ],
        "Autocracy": {
            "bodies": [
                "Minister, a former military officer has established de facto control over a remote southern border district. He commands roughly 200 armed men, collects taxes from local businesses, runs the border crossing, and has the loyalty of the population \u2014 largely because he provides security and services the central government never did. He hasn\u2019t declared independence or opposition to the regime. He simply acts as if the government doesn\u2019t exist. If we leave him, others will copy the model. If we move against him, we risk a fight we might not win cleanly in terrain that favors him."
            ],
            "options": [
                {
                    "label": "Military Operation \u2014 Reassert Sovereignty",
                    "ap": 3,
                    "money": 25000,
                    "money_scaling_stat": "crime_rate",
                    "outcomes": [
                        {
                            "chance": 30,
                            "label": "Decisive Victory",
                            "message": "A combined security operation overwhelmed the warlord\u2019s forces within 48 hours. He was captured alive, which is important \u2014 a dead martyr is worse than a live prisoner. Central authority has been restored and a garrison established.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": -5, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": -2, "target": "nation" },
                                { "stat_key": "legitimacy", "change": 4, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -3, "target": "nation" },
                                { "stat_key": "happiness", "change": -2, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 4, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 40,
                            "label": "Pyrrhic Victory",
                            "message": "We took the district, but it cost us. The fighting destroyed local infrastructure, civilians were caught in crossfire, and the warlord escaped into the mountains. We control rubble and resentment.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": -2, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 5, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -1, "target": "nation" },
                                { "stat_key": "happiness", "change": -6, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -5, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -1, "target": "minister" },
                                { "stat_key": "gdp_growth", "change": -2, "target": "nation" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Civilian Casualties Reported as {nation} Forces Retake Southern District",
                            "civic_event_text": "Military operations to reassert central authority in a remote southern border district have resulted in significant civilian displacement and infrastructure damage. The targeted militia leader reportedly escaped capture."
                        },
                        {
                            "chance": 30,
                            "label": "Stalemate",
                            "message": "The warlord\u2019s forces melted into the terrain and are waging a guerrilla campaign. Our forces control the district center but the countryside is hostile. We\u2019re now committed to an open-ended occupation that\u2019s bleeding resources.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": 2, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 4, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -4, "target": "nation" },
                                { "stat_key": "happiness", "change": -4, "target": "nation" },
                                { "stat_key": "gdp_growth", "change": -3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -5, "target": "minister" },
                                { "stat_key": "international_reputation", "change": -3, "target": "nation" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Military Operation Stalls in {nation}\u2019s Southern Border Region",
                            "civic_event_text": "What was described as a swift operation to restore order in {nation}\u2019s southern territories has devolved into a prolonged standoff. Security forces report ongoing resistance from armed groups operating in difficult terrain."
                        }
                    ]
                },
                {
                    "label": "Co-opt Him \u2014 Make Him Official",
                    "ap": 1,
                    "money": 8000,
                    "money_scaling_stat": "corruption",
                    "outcomes": [
                        {
                            "chance": 45,
                            "label": "Useful Vassal",
                            "message": "The warlord has been appointed \u2018Special Provincial Security Coordinator\u2019 with a government salary and a mandate to maintain order. Nothing has changed on the ground except that he now flies your flag.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": -3, "target": "nation" },
                                { "stat_key": "corruption", "change": 4, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -2, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 35,
                            "label": "He Takes the Title, Ignores the Terms",
                            "message": "He accepted the appointment and the salary, then continued operating exactly as before. Government inspectors who visit the district report being politely escorted to curated tours. He\u2019s using your legitimacy to strengthen his own position.",
                            "effects": [
                                { "stat_key": "corruption", "change": 3, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -2, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 20,
                            "label": "Empowered and Emboldened",
                            "message": "With official government backing, the warlord has expanded his territory into two additional districts. Other opportunists are now approaching the government for similar arrangements. You\u2019ve legitimized feudalism.",
                            "effects": [
                                { "stat_key": "corruption", "change": 5, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -6, "target": "nation" },
                                { "stat_key": "crime_rate", "change": 3, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Government-Backed Strongman Expands Control in {nation}\u2019s South",
                            "civic_event_text": "A local militia leader recently granted official authority by {nation}\u2019s central government has reportedly expanded his area of operations well beyond the original agreement. Critics say the arrangement has set a dangerous precedent."
                        }
                    ]
                },
                {
                    "label": "Siege Economics \u2014 Cut His Supply Lines",
                    "ap": 2,
                    "money": 10000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 35,
                            "label": "Slow Strangulation Works",
                            "message": "Over several months, checkpoints on all roads leading to the district have choked off supplies. The warlord\u2019s ability to pay his men is collapsing. Defections have begun. He\u2019s sent envoys asking for terms.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": -3, "target": "nation" },
                                { "stat_key": "legitimacy", "change": 2, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": -1, "target": "nation" },
                                { "stat_key": "happiness", "change": -4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 2, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 40,
                            "label": "He Adapts",
                            "message": "The warlord shifted to smuggling routes through the mountains to resupply. The siege has hurt the civilian population more than his forces. International aid organizations are asking uncomfortable questions about the humanitarian situation.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": 1, "target": "nation" },
                                { "stat_key": "happiness", "change": -6, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -4, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -2, "target": "minister" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Aid Groups Warn of Humanitarian Crisis in {nation}\u2019s Blockaded Southern District",
                            "civic_event_text": "International aid organizations have raised alarms about food and medical supply shortages in a southern border district of {nation} subject to a government blockade. The Interior Ministry has described the situation as a \u2018necessary security measure.\u2019"
                        },
                        {
                            "chance": 25,
                            "label": "Siege Breaks \u2014 He Attacks",
                            "message": "Desperate and cornered, the warlord launched a surprise attack on the nearest government checkpoint, killing twelve soldiers and seizing their weapons and supplies. The siege has become a war.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": 6, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 8, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -6, "target": "nation" },
                                { "stat_key": "happiness", "change": -4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -6, "target": "minister" }
                            ]
                        }
                    ]
                }
            ]
        }
    }'::jsonb
);
