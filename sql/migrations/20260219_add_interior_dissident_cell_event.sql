-- Migration: Add "Dissident Cell Discovered" ministry event template
-- Ministry: Interior | Gov Type: Autocracy | Priority: Urgent
-- Event Key: interior_auto_dissident_cell

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
    'interior_auto_dissident_cell',
    'Underground Dissident Network Identified',
    'State Security Directorate',
    'interior',
    'urgent',
    3,
    60,
    true,
    ARRAY['Autocracy'],
    'freedom_index',
    '<',
    40,
    '{
        "titles": [
            "Underground Dissident Network Identified",
            "State Security Reports Organized Resistance Cell"
        ],
        "weight_conditions": [
            { "stat": "freedom_index", "op": "<", "value": 40 },
            { "stat": "civil_unrest", "op": ">", "value": 30 }
        ],
        "Autocracy": {
            "bodies": [
                "Minister, state security operatives have identified an underground network of political dissidents operating across three provinces. They are distributing pamphlets, organizing secret meetings, and — most concerning — have contacts within the civil service. The network is still small, but it is growing. We have names and addresses. How you respond will send a message — both to the dissidents and to everyone watching."
            ],
            "options": [
                {
                    "label": "Mass Arrests — Crush Them",
                    "ap": 2,
                    "money": 12000,
                    "money_scaling_stat": "civil_unrest",
                    "outcomes": [
                        {
                            "chance": 40,
                            "label": "Network Destroyed",
                            "message": "Security forces conducted predawn raids across all three provinces simultaneously. The entire network — 47 individuals — has been detained. Documents seized reveal the full extent of their operations. The message is clear: resistance is futile.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": -6, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -5, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -4, "target": "nation" },
                                { "stat_key": "happiness", "change": -3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 2, "target": "minister" },
                                { "stat_key": "international_reputation", "change": -3, "target": "nation" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Authorities Dismantle Subversive Network in {nation}",
                            "civic_event_text": "State security forces in {nation} arrested dozens of individuals accused of organizing against the government. Interior Minister {minister} described the operation as a necessary defense of national stability."
                        },
                        {
                            "chance": 35,
                            "label": "Crackdown Sparks Sympathy",
                            "message": "The raids succeeded in dismantling the cell, but images of families being dragged from their homes at dawn leaked to foreign media. Domestically, some citizens who never supported the dissidents now quietly sympathize with them.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": -3, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -6, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -6, "target": "nation" },
                                { "stat_key": "happiness", "change": -5, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -5, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "International Outcry Over Mass Arrests in {nation}",
                            "civic_event_text": "Foreign governments have condemned the arrest of dozens of political dissidents in {nation}. Leaked footage of the raids has circulated widely on international media, drawing comparisons to authoritarian crackdowns of the past."
                        },
                        {
                            "chance": 25,
                            "label": "Incomplete Sweep — Leaders Escape",
                            "message": "The raids netted foot soldiers but the core leadership had already fled. Worse, the botched operation has made them martyrs. Underground pamphlets are now calling them \u2018The Forty-Seven\u2019 and recruitment has spiked.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -4, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -5, "target": "nation" },
                                { "stat_key": "corruption", "change": 1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -3, "target": "minister" },
                                { "stat_key": "international_reputation", "change": -2, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Fugitive Dissidents Become Underground Symbols in {nation}",
                            "civic_event_text": "Escaped leaders of a banned political network have become folk heroes in parts of {nation}, with underground literature celebrating their resistance. The Interior Ministry has declined to comment on reports that the operation failed to capture key figures."
                        }
                    ]
                },
                {
                    "label": "Infiltrate and Turn — Make Them Ours",
                    "ap": 2,
                    "money": 10000,
                    "money_scaling_stat": "corruption",
                    "outcomes": [
                        {
                            "chance": 30,
                            "label": "Total Subversion",
                            "message": "Our agents successfully infiltrated the network\u2019s leadership. Over the next several months, the organization will be quietly redirected — its energy channeled into harmless activism, its intelligence funneled directly to us. The dissidents believe they are winning. They are our puppet.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": -2, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -3, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 3, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 45,
                            "label": "Partial Infiltration",
                            "message": "We placed two agents inside the network but their access is limited. We\u2019re getting useful intelligence on membership and plans, but we don\u2019t control the organization. It\u2019s a surveillance asset, not a weapon.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": -1, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -2, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 25,
                            "label": "Agent Exposed",
                            "message": "One of our infiltrators was identified. The dissidents executed him and published his state security credentials online. The network has gone fully underground, hardened and more paranoid — and now they know exactly how we operate.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 4, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -3, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" },
                                { "stat_key": "freedom_index", "change": -2, "target": "nation" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Alleged State Agent Found Dead; Dissident Network Claims Responsibility",
                            "civic_event_text": "A body identified as a state security operative was discovered in {nation}\u2019s capital, accompanied by documents alleging government infiltration of political opposition groups. The incident has drawn sharp international criticism."
                        }
                    ]
                },
                {
                    "label": "Containment — Monitor, Don\u2019t Touch",
                    "ap": 1,
                    "money": 3000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 35,
                            "label": "Intelligence Dividend",
                            "message": "By leaving the network operational under surveillance, we\u2019ve mapped their entire support structure — donors, sympathizers, civil servants feeding them information. When we eventually move, the sweep will be total.",
                            "effects": [
                                { "stat_key": "corruption", "change": -1, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 40,
                            "label": "Network Grows Beyond Control",
                            "message": "The hands-off approach gave the dissidents room to breathe. Their membership has doubled and they\u2019ve established connections with exile communities abroad. What was a manageable problem is now a movement.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 4, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -1, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -3, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 25,
                            "label": "Hardliners Furious",
                            "message": "Word reached the security establishment that you knew about the dissidents and chose not to act. Senior officers are questioning your resolve. Loyalty within the security apparatus is wavering.",
                            "effects": [
                                { "stat_key": "legitimacy", "change": -4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -5, "target": "minister" },
                                { "stat_key": "civil_unrest", "change": 2, "target": "nation" },
                                { "stat_key": "corruption", "change": 2, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Rumors of Rift Within {nation}\u2019s Security Leadership",
                            "civic_event_text": "Unconfirmed reports suggest tension within {nation}\u2019s Interior Ministry over the handling of internal security matters. Anonymous officials have described a \u2018crisis of confidence\u2019 in current leadership."
                        }
                    ]
                }
            ]
        }
    }'::jsonb
);
