-- Migration: Add "Loyalty Test — Civil Service Purge" ministry event template
-- Ministry: Interior | Gov Type: Autocracy | Priority: Routine
-- Event Key: interior_auto_loyalty_test

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
    'interior_auto_loyalty_test',
    'Civil Service Loyalty Assessment Complete',
    'Bureau of Personnel & Loyalty',
    'interior',
    'routine',
    5,
    18,
    true,
    ARRAY['Autocracy'],
    'corruption',
    '>',
    35,
    '{
        "titles": [
            "Civil Service Loyalty Assessment Complete",
            "Bureau Recommends Action on Disloyal Personnel"
        ],
        "weight_conditions": [
            { "stat": "corruption", "op": ">", "value": 35 },
            { "stat": "legitimacy", "op": "<", "value": 55 }
        ],
        "Autocracy": {
            "bodies": [
                "Minister, the Bureau of Personnel has completed its annual loyalty assessment of senior civil servants. The results are concerning: 14% of assessed officials show \u2018questionable loyalty indicators\u2019 \u2014 attending opposition social events, maintaining foreign contacts, making private remarks critical of government policy. The Bureau recommends a purge. However, many of the flagged individuals are highly competent administrators. Removing them will hurt efficiency. Keeping them risks infiltration."
            ],
            "options": [
                {
                    "label": "Full Purge \u2014 Loyalty Over Competence",
                    "ap": 2,
                    "money": 10000,
                    "money_scaling_stat": "efficiency",
                    "outcomes": [
                        {
                            "chance": 40,
                            "label": "Loyalist Apparatus",
                            "message": "Eighty-six officials have been dismissed and replaced with party loyalists. The bureaucracy is leaner, meaner, and entirely yours. Efficiency has taken a hit, but no one in government will dare question a directive again.",
                            "effects": [
                                { "stat_key": "corruption", "change": -2, "target": "nation" },
                                { "stat_key": "efficiency", "change": -6, "target": "nation" },
                                { "stat_key": "legitimacy", "change": 2, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -4, "target": "nation" },
                                { "stat_key": "happiness", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 2, "target": "minister" },
                                { "stat_key": "civil_unrest", "change": 1, "target": "nation" }
                            ]
                        },
                        {
                            "chance": 35,
                            "label": "Brain Drain",
                            "message": "The purge went too deep. Entire departments have lost their institutional knowledge. Permit processing has ground to a halt, tax collection is delayed, and provincial administration is in chaos. Loyalty is high. Competence is not.",
                            "effects": [
                                { "stat_key": "efficiency", "change": -10, "target": "nation" },
                                { "stat_key": "corruption", "change": -1, "target": "nation" },
                                { "stat_key": "gdp_growth", "change": -3, "target": "nation" },
                                { "stat_key": "legitimacy", "change": 1, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -4, "target": "nation" },
                                { "stat_key": "happiness", "change": -4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -2, "target": "minister" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Government Services Disrupted Amid Major Personnel Changes in {nation}",
                            "civic_event_text": "Citizens across {nation} report significant delays in government services following what sources describe as a large-scale dismissal of senior civil servants. The Interior Ministry has attributed the disruptions to \u2018routine administrative restructuring.\u2019"
                        },
                        {
                            "chance": 25,
                            "label": "Purged Officials Join Opposition",
                            "message": "The dismissed officials didn\u2019t quietly retire. Dozens have gone public with insider knowledge of government operations, joined exile opposition groups, or offered their expertise to foreign intelligence services. You\u2019ve created eighty-six enemies who know where the bodies are buried.",
                            "effects": [
                                { "stat_key": "efficiency", "change": -5, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -4, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -3, "target": "nation" },
                                { "stat_key": "corruption", "change": 2, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" }
                            ]
                        }
                    ]
                },
                {
                    "label": "Targeted Removal \u2014 Only the Worst Cases",
                    "ap": 1,
                    "money": 4000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 50,
                            "label": "Surgical and Effective",
                            "message": "Twelve officials with the most damning files were quietly removed. The rest received a clear message without losing their positions. Efficiency is preserved and the civil service has been reminded who is in charge.",
                            "effects": [
                                { "stat_key": "corruption", "change": -1, "target": "nation" },
                                { "stat_key": "efficiency", "change": -1, "target": "nation" },
                                { "stat_key": "legitimacy", "change": 1, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 30,
                            "label": "Wrong People Targeted",
                            "message": "The Bureau\u2019s intelligence was flawed. Several of the removed officials were actually loyal \u2014 their \u2018suspicious contacts\u2019 were professional associations. Meanwhile, genuinely disloyal actors remain in place, now warned to be more careful.",
                            "effects": [
                                { "stat_key": "efficiency", "change": -3, "target": "nation" },
                                { "stat_key": "corruption", "change": 1, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -2, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 20,
                            "label": "Remaining Flagged Officials Organize",
                            "message": "The officials who survived the targeted purge have correctly concluded they\u2019re on a list. Rather than keep their heads down, they\u2019ve begun coordinating \u2014 sharing information, covering for each other, and building a quiet network of resistance within the bureaucracy.",
                            "effects": [
                                { "stat_key": "corruption", "change": 3, "target": "nation" },
                                { "stat_key": "efficiency", "change": -1, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -1, "target": "minister" }
                            ]
                        }
                    ]
                },
                {
                    "label": "Mandatory Loyalty Oath \u2014 Public Recommitment",
                    "ap": 1,
                    "money": 2000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 35,
                            "label": "Compliance Theater That Works",
                            "message": "Every civil servant publicly signed a loyalty oath in a televised ceremony. It\u2019s performative, everyone knows it\u2019s performative, but it has a chilling effect. The flagged officials are now on record \u2014 any future disloyalty carries the weight of a broken oath.",
                            "effects": [
                                { "stat_key": "legitimacy", "change": 1, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -3, "target": "nation" },
                                { "stat_key": "happiness", "change": -1, "target": "nation" },
                                { "stat_key": "corruption", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 45,
                            "label": "Meaningless Gesture",
                            "message": "Everyone signed. Nothing changed. The disloyal officials signed with the same pen as the loyal ones. The Bureau reports no change in behavior. You\u2019ve spent political capital on a piece of paper.",
                            "effects": [
                                { "stat_key": "legitimacy", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -1, "target": "minister" },
                                { "stat_key": "freedom_index", "change": -1, "target": "nation" }
                            ]
                        },
                        {
                            "chance": 20,
                            "label": "Refusals Create Martyrs",
                            "message": "Three senior officials publicly refused to sign, declaring the oath \u2018an insult to their professional integrity.\u2019 Their stand has been covered by international media and they\u2019ve become symbols of quiet resistance within the bureaucracy.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -4, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -3, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Senior Officials Refuse Loyalty Oath in {nation}, Spark Debate",
                            "civic_event_text": "Three prominent civil servants in {nation} have publicly refused to sign a government-mandated loyalty oath, calling it incompatible with professional governance. Their stand has drawn international attention and domestic admiration from opposition groups."
                        }
                    ]
                }
            ]
        }
    }'::jsonb
);
