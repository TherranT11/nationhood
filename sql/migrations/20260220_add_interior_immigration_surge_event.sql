-- Migration: Add "Immigration Surge at the Border" ministry event template
-- Ministry: Interior | Gov Type: Democracy | Priority: Urgent
-- Event Key: interior_dem_immigration_surge

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
    'interior_dem_immigration_surge',
    'Border Processing Centers Overwhelmed by Arrivals',
    'Border Administration Office',
    'interior',
    'urgent',
    3,
    10,
    true,
    ARRAY['Democracy'],
    'immigration',
    '>',
    55,
    $${
        "titles": [
            "Border Processing Centers Overwhelmed by Arrivals",
            "Immigration Surge Exceeds Processing Capacity"
        ],
        "weight_conditions": [
            { "stat": "immigration", "op": ">", "value": 55 },
            { "stat": "civil_unrest", "op": ">", "value": 25 }
        ],
        "Democracy": {
            "bodies": [
                "Minister, a sudden surge of migrants \u2014 driven by a regional crisis in a neighboring country \u2014 has overwhelmed our border processing centers. Thousands are waiting in makeshift camps with inadequate sanitation and food. Border officers are working triple shifts. Local communities near the border are split between those offering humanitarian aid and those demanding the border be sealed. International cameras are rolling."
            ],
            "options": [
                {
                    "label": "Emergency Processing \u2014 Fast-Track Asylum Claims",
                    "ap": 2,
                    "money": 12000,
                    "money_scaling_stat": "immigration",
                    "outcomes": [
                        {
                            "chance": 35,
                            "label": "Orderly Processing, Humanitarian Praise",
                            "message": "Emergency processing teams were deployed to the border, working through claims efficiently. Genuine refugees are being resettled, economic migrants are being processed, and the camps are emptying in an orderly fashion. International organizations are praising the response.",
                            "effects": [
                                { "stat_key": "immigration", "change": 4, "target": "nation" },
                                { "stat_key": "happiness", "change": 2, "target": "nation" },
                                { "stat_key": "international_reputation", "change": 4, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 2, "target": "minister" },
                                { "stat_key": "freedom_index", "change": 1, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "{nation} Wins International Praise for Humanitarian Border Response",
                            "civic_event_text": "The Interior Ministry\u2019s deployment of emergency processing teams to handle a surge of migrants at {nation}\u2019s border has been praised by international humanitarian organizations as a model response."
                        },
                        {
                            "chance": 40,
                            "label": "Processing Backlog Creates Chaos",
                            "message": "Despite the additional resources, the volume is simply too high. Processing is slow, the camps are growing, and frustration is building on all sides. Some migrants are bypassing the system entirely and crossing illegally.",
                            "effects": [
                                { "stat_key": "immigration", "change": 3, "target": "nation" },
                                { "stat_key": "illegal_immigration", "change": 3, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 4, "target": "nation" },
                                { "stat_key": "happiness", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -2, "target": "minister" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Border Processing Overwhelmed Despite Emergency Measures in {nation}",
                            "civic_event_text": "Emergency teams deployed to {nation}\u2019s border are struggling to keep pace with migrant arrivals. Reports indicate growing numbers are bypassing official processing entirely."
                        },
                        {
                            "chance": 25,
                            "label": "Fraud and Exploitation",
                            "message": "The fast-track process had inadequate vetting. Reports are emerging of fraudulent claims, criminal elements exploiting the system, and human trafficking networks using the chaos as cover. The program\u2019s credibility is destroyed.",
                            "effects": [
                                { "stat_key": "immigration", "change": 2, "target": "nation" },
                                { "stat_key": "illegal_immigration", "change": 5, "target": "nation" },
                                { "stat_key": "crime_rate", "change": 3, "target": "nation" },
                                { "stat_key": "corruption", "change": 2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -6, "target": "minister" },
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Fraud Allegations Plague {nation}\u2019s Emergency Immigration Program",
                            "civic_event_text": "An emergency asylum processing program at {nation}\u2019s border has been suspended after reports of widespread fraud and exploitation by criminal networks. The Interior Minister faces calls for resignation."
                        }
                    ]
                },
                {
                    "label": "Temporary Border Closure",
                    "ap": 2,
                    "money": 10000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 40,
                            "label": "Border Secured, Pressure Redirected",
                            "message": "The border has been closed to new arrivals while existing claims are processed. The camps are no longer growing. However, the images of soldiers turning away desperate families are being broadcast internationally.",
                            "effects": [
                                { "stat_key": "immigration", "change": -4, "target": "nation" },
                                { "stat_key": "illegal_immigration", "change": -1, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": -2, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -5, "target": "nation" },
                                { "stat_key": "happiness", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" },
                                { "stat_key": "freedom_index", "change": -2, "target": "nation" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "{nation} Closes Border Amid Migrant Surge; Humanitarian Groups Protest",
                            "civic_event_text": "The Interior Ministry has ordered a temporary closure of {nation}\u2019s southern border in response to a surge of migrants. International humanitarian organizations have condemned the decision."
                        },
                        {
                            "chance": 35,
                            "label": "Closure Fuels Illegal Crossings",
                            "message": "Closing the official border crossings hasn\u2019t stopped the flow \u2014 it\u2019s redirected it. Smuggling networks are thriving, migrants are taking dangerous routes through unmonitored terrain, and a body was found in the river this morning.",
                            "effects": [
                                { "stat_key": "immigration", "change": -2, "target": "nation" },
                                { "stat_key": "illegal_immigration", "change": 4, "target": "nation" },
                                { "stat_key": "crime_rate", "change": 2, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -6, "target": "nation" },
                                { "stat_key": "happiness", "change": -3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -3, "target": "minister" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Migrant Deaths Reported After {nation} Border Closure Forces Dangerous Crossings",
                            "civic_event_text": "At least one death has been reported as migrants attempt dangerous unofficial crossings following {nation}\u2019s border closure. Humanitarian groups warn the closure is creating a humanitarian crisis."
                        },
                        {
                            "chance": 25,
                            "label": "Diplomatic Fallout",
                            "message": "The neighboring country whose citizens you\u2019ve turned away has lodged a formal diplomatic protest and is threatening to retaliate by restricting trade. Regional allies are calling for a summit. The border closure has become a foreign policy crisis.",
                            "effects": [
                                { "stat_key": "immigration", "change": -3, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -7, "target": "nation" },
                                { "stat_key": "gdp_growth", "change": -2, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Diplomatic Tensions Rise Over {nation}\u2019s Border Closure",
                            "civic_event_text": "A neighboring government has lodged a formal protest against {nation}\u2019s border closure, threatening trade retaliation and calling the action \u2018hostile.\u2019 Regional diplomatic sources describe the situation as rapidly deteriorating."
                        }
                    ]
                },
                {
                    "label": "Humanitarian Corridor \u2014 Managed Intake",
                    "ap": 1,
                    "money": 8000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 40,
                            "label": "Balanced Approach",
                            "message": "A managed intake system with daily caps, proper screening, and designated transit centers has brought order to the chaos without fully closing the border. It satisfies no one completely, but it\u2019s working.",
                            "effects": [
                                { "stat_key": "immigration", "change": 2, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 1, "target": "nation" },
                                { "stat_key": "international_reputation", "change": 2, "target": "nation" },
                                { "stat_key": "happiness", "change": 1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 35,
                            "label": "Daily Caps Create Desperation",
                            "message": "The daily intake cap means thousands are still waiting in increasingly desperate conditions. Fights have broken out in the camps over queue positions. The humanitarian corridor is humane in theory but brutal in practice.",
                            "effects": [
                                { "stat_key": "immigration", "change": 1, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" },
                                { "stat_key": "happiness", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -2, "target": "minister" },
                                { "stat_key": "international_reputation", "change": -1, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Violence Erupts in Migrant Camps as {nation}\u2019s Daily Intake Caps Create Bottleneck",
                            "civic_event_text": "Fights have broken out in overcrowded migrant camps along {nation}\u2019s border as a daily intake cap leaves thousands waiting in deteriorating conditions."
                        },
                        {
                            "chance": 25,
                            "label": "System Gamed by Smugglers",
                            "message": "Smuggling networks have figured out the system. They\u2019re selling spots in the daily queue, forging documentation, and running a parallel economy around the humanitarian corridor. Your managed system is being managed by criminals.",
                            "effects": [
                                { "stat_key": "immigration", "change": 2, "target": "nation" },
                                { "stat_key": "illegal_immigration", "change": 3, "target": "nation" },
                                { "stat_key": "crime_rate", "change": 2, "target": "nation" },
                                { "stat_key": "corruption", "change": 2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" }
                            ]
                        }
                    ]
                }
            ]
        }
    }$$::jsonb
);
