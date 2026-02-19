-- Migration: Add "Succession Anxiety" ministry event template
-- Ministry: Interior | Gov Type: Autocracy | Priority: Urgent
-- Event Key: interior_auto_succession_anxiety

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
    'interior_auto_succession_anxiety',
    'Senior Officials Positioning for Potential Transition',
    'Office of the Leader''s Security Detail',
    'interior',
    'urgent',
    4,
    24,
    true,
    ARRAY['Autocracy'],
    'legitimacy',
    '<',
    40,
    '{
        "titles": [
            "Senior Officials Positioning for Potential Transition",
            "Security Detail Reports Unusual Activity Among Inner Circle"
        ],
        "weight_conditions": [
            { "stat": "legitimacy", "op": "<", "value": 40 },
            { "stat": "corruption", "op": ">", "value": 50 }
        ],
        "Autocracy": {
            "bodies": [
                "Minister, the leader\u2019s personal security detail has flagged concerning activity within the inner circle. Senior officials are holding private meetings, cultivating military contacts, and \u2014 most tellingly \u2014 moving personal assets abroad. No one is plotting a coup. Not yet. But everyone is positioning for what comes next, as if the current order\u2019s permanence is no longer assumed. The regime\u2019s inner circle is hedging its bets. If this perception spreads beyond the elite, it becomes a self-fulfilling prophecy. Confidence in the regime\u2019s durability is itself a form of power."
            ],
            "options": [
                {
                    "label": "Show of Strength \u2014 Public Loyalty Rally",
                    "ap": 2,
                    "money": 15000,
                    "money_scaling_stat": "legitimacy",
                    "outcomes": [
                        {
                            "chance": 35,
                            "label": "Confidence Restored",
                            "message": "A massive public rally drew hundreds of thousands \u2014 partly genuine support, partly organized attendance, but the images are powerful. Senior officials who were hedging have renewed their public loyalty pledges. The perception of permanence has been reinforced.",
                            "effects": [
                                { "stat_key": "legitimacy", "change": 5, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": -2, "target": "nation" },
                                { "stat_key": "happiness", "change": 1, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 3, "target": "minister" },
                                { "stat_key": "international_reputation", "change": -1, "target": "nation" }
                            ]
                        },
                        {
                            "chance": 40,
                            "label": "Hollow Spectacle",
                            "message": "The rally was large but transparently staged. Foreign media focused on the bused-in crowds and mandatory attendance from civil servants. Domestically, the people who matter \u2014 the generals, the oligarchs \u2014 were polite but unmoved. They\u2019ve seen rallies before.",
                            "effects": [
                                { "stat_key": "legitimacy", "change": 1, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -2, "target": "nation" },
                                { "stat_key": "happiness", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 25,
                            "label": "Rally Disrupted",
                            "message": "A protest group infiltrated the rally and unfurled banners visible to international cameras before being dragged away. The footage of regime supporters attacking protesters at a \u2018unity rally\u2019 is devastating. The event meant to project strength has projected fragility.",
                            "effects": [
                                { "stat_key": "legitimacy", "change": -4, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 5, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -5, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -5, "target": "minister" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Pro-Government Rally in {nation} Marred by Protest and Violent Response",
                            "civic_event_text": "A major government-organized rally in {nation}\u2019s capital descended into chaos when demonstrators disrupted proceedings. Footage of security personnel and rally attendees beating protesters has drawn sharp international criticism."
                        }
                    ]
                },
                {
                    "label": "Private Purge \u2014 Remove the Hedgers",
                    "ap": 2,
                    "money": 12000,
                    "money_scaling_stat": "corruption",
                    "outcomes": [
                        {
                            "chance": 30,
                            "label": "Inner Circle Tightened",
                            "message": "Three senior officials have been quietly removed from their positions, their assets frozen, their military contacts reassigned. The remaining inner circle understands: loyalty is not optional. The asset flights have stopped.",
                            "effects": [
                                { "stat_key": "corruption", "change": -2, "target": "nation" },
                                { "stat_key": "legitimacy", "change": 3, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -4, "target": "nation" },
                                { "stat_key": "efficiency", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 2, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 40,
                            "label": "Fear, Not Loyalty",
                            "message": "The purge worked \u2014 the hedging has stopped. But so has honest counsel. Your inner circle now tells you only what you want to hear. Decisions are being made in an information vacuum. The regime is more stable and more blind.",
                            "effects": [
                                { "stat_key": "legitimacy", "change": 2, "target": "nation" },
                                { "stat_key": "corruption", "change": 2, "target": "nation" },
                                { "stat_key": "efficiency", "change": -4, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -5, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 30,
                            "label": "Purge Target Flees, Goes Public",
                            "message": "One of the officials you moved against escaped the country with a trove of documents. He\u2019s now giving interviews from exile, describing the regime\u2019s internal dysfunction in devastating detail. The hedge has become a defection.",
                            "effects": [
                                { "stat_key": "legitimacy", "change": -6, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -6, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 4, "target": "nation" },
                                { "stat_key": "corruption", "change": 2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -5, "target": "minister" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Exiled {nation} Official Reveals Inner Circle Turmoil",
                            "civic_event_text": "A former senior official who recently fled {nation} has given a series of interviews to international media describing what he calls a \u2018regime consumed by paranoia and internal rivalry.\u2019 The Interior Ministry has dismissed the claims as fabrications by a disgraced individual."
                        }
                    ]
                },
                {
                    "label": "Embrace It \u2014 Announce a Formal Succession Framework",
                    "ap": 1,
                    "money": 3000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 25,
                            "label": "Stabilizing Masterstroke",
                            "message": "By publicly establishing a succession process, you\u2019ve done what most autocracies cannot \u2014 acknowledged that the leader is mortal without implying weakness. The inner circle has clear rules of engagement. International observers are cautiously impressed. The hedging has been channeled into legitimate competition.",
                            "effects": [
                                { "stat_key": "legitimacy", "change": 6, "target": "nation" },
                                { "stat_key": "international_reputation", "change": 4, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": -2, "target": "nation" },
                                { "stat_key": "happiness", "change": 1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 3, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 40,
                            "label": "Opens Pandora\u2019s Box",
                            "message": "The succession framework was supposed to reduce competition. Instead, it formalized it. The inner circle is now openly campaigning for position within the framework, forming factions, and courting military support. You\u2019ve replaced quiet hedging with loud jockeying.",
                            "effects": [
                                { "stat_key": "legitimacy", "change": 1, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" },
                                { "stat_key": "corruption", "change": 3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -2, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 35,
                            "label": "Interpreted as Weakness",
                            "message": "Domestically and internationally, the announcement is being read as a sign the leader is preparing to step down \u2014 or is being forced out. Markets have dipped, military commanders are requesting \u2018clarification meetings,\u2019 and the opposition smells blood.",
                            "effects": [
                                { "stat_key": "legitimacy", "change": -5, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 5, "target": "nation" },
                                { "stat_key": "gdp_growth", "change": -2, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" },
                                { "stat_key": "corruption", "change": 2, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Succession Announcement Sparks Uncertainty Over {nation}\u2019s Future",
                            "civic_event_text": "A surprise announcement establishing a formal succession framework in {nation} has been interpreted by analysts as a sign of instability within the ruling regime. Financial markets and diplomatic circles have reacted with concern."
                        }
                    ]
                }
            ]
        }
    }'::jsonb
);
