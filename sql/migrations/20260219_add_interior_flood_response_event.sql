-- Migration: Add "Natural Disaster — Flood Response" ministry event template
-- Ministry: Interior | Gov Type: Democracy | Priority: Urgent
-- Event Key: interior_dem_flood_response

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
    'interior_dem_flood_response',
    'Catastrophic Flooding in the River Delta — Immediate Response Needed',
    'National Emergency Management Agency',
    'interior',
    'critical',
    2,
    14,
    true,
    ARRAY['Democracy'],
    'happiness',
    '<',
    55,
    $${
        "titles": [
            "Catastrophic Flooding in the River Delta — Immediate Response Needed",
            "Emergency: River Delta Floods Displacing Thousands"
        ],
        "weight_conditions": [
            { "stat": "happiness", "op": "<", "value": 55 },
            { "stat": "gdp_growth", "op": "<", "value": 55 }
        ],
        "Democracy": {
            "bodies": [
                "Minister, severe flooding along the river delta has displaced an estimated 50,000 people. Infrastructure damage is extensive — bridges destroyed, farmland submerged, two hospitals without power. Local emergency services are overwhelmed and requesting central government support. The response you mount in the next 48 hours will define public perception of this government's competence. Aid organizations are offering help. The military is requesting activation orders."
            ],
            "options": [
                {
                    "label": "Full Military Deployment — Spare No Expense",
                    "ap": 3,
                    "money": 30000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 50,
                            "label": "Heroic Response",
                            "message": "Military helicopters, engineering corps, and field hospitals were deployed within hours. The response was fast, visible, and effective. Lives were saved, evacuations were orderly, and the images of soldiers carrying children to safety are dominating the news.",
                            "effects": [
                                { "stat_key": "happiness", "change": 6, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 5, "target": "minister" },
                                { "stat_key": "civil_unrest", "change": -3, "target": "nation" },
                                { "stat_key": "legitimacy", "change": 3, "target": "nation" },
                                { "stat_key": "international_reputation", "change": 2, "target": "nation" },
                                { "stat_key": "gdp_growth", "change": -2, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Swift Military Response Saves Lives in {nation} Flood Disaster",
                            "civic_event_text": "A massive government response to catastrophic flooding in {nation}'s river delta has been widely praised. Military personnel deployed within hours, conducting evacuations and establishing emergency shelters for tens of thousands of displaced citizens."
                        },
                        {
                            "chance": 30,
                            "label": "Adequate but Costly",
                            "message": "The response saved lives but the cost is staggering. The treasury has taken a significant hit and opposition economists are already questioning whether the full military deployment was necessary. Some are calling it expensive PR.",
                            "effects": [
                                { "stat_key": "happiness", "change": 2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" },
                                { "stat_key": "gdp_growth", "change": -4, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": -1, "target": "nation" }
                            ]
                        },
                        {
                            "chance": 20,
                            "label": "Military Logistics Failure",
                            "message": "The deployment was ordered but execution was chaotic. Supply convoys got stuck on damaged roads, field hospitals arrived without critical equipment, and coordination between military and civilian agencies was abysmal. The effort was visible but ineffective.",
                            "effects": [
                                { "stat_key": "happiness", "change": -3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -5, "target": "minister" },
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" },
                                { "stat_key": "efficiency", "change": -3, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Flood Response Criticized as Chaotic Despite Massive Military Deployment in {nation}",
                            "civic_event_text": "Despite deploying thousands of military personnel to flood-stricken areas, {nation}'s emergency response has been criticized as poorly coordinated. Displaced residents report long waits for basic supplies and medical care."
                        }
                    ]
                },
                {
                    "label": "Coordinate Civilian Emergency Services",
                    "ap": 1,
                    "money": 10000,
                    "money_scaling_stat": "efficiency",
                    "outcomes": [
                        {
                            "chance": 40,
                            "label": "Efficient and Professional",
                            "message": "Civilian emergency services, supplemented by NGOs and volunteer organizations, mounted a well-coordinated response. It lacked the dramatic imagery of a military deployment, but the aid reached people efficiently and the cost was manageable.",
                            "effects": [
                                { "stat_key": "happiness", "change": 3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 2, "target": "minister" },
                                { "stat_key": "efficiency", "change": 2, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": -1, "target": "nation" }
                            ]
                        },
                        {
                            "chance": 40,
                            "label": "Underpowered Response",
                            "message": "Civilian services did their best but simply lacked the scale. Thousands remain in temporary shelters without adequate food or sanitation. The images from the camps are grim and the opposition is asking why the military wasn't called.",
                            "effects": [
                                { "stat_key": "happiness", "change": -3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -3, "target": "minister" },
                                { "stat_key": "civil_unrest", "change": 2, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Flood Victims Stranded as {nation} Government Response Falls Short",
                            "civic_event_text": "Thousands of flood-displaced citizens in {nation}'s river delta remain in inadequate temporary shelters as civilian emergency services struggle to cope with the scale of the disaster."
                        },
                        {
                            "chance": 20,
                            "label": "NGO Outperforms Government",
                            "message": "International aid organizations arrived faster, delivered more supplies, and organized better evacuations than your own emergency services. The government looks incompetent by comparison. The NGOs are getting the credit.",
                            "effects": [
                                { "stat_key": "happiness", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -5, "target": "minister" },
                                { "stat_key": "international_reputation", "change": 1, "target": "nation" },
                                { "stat_key": "efficiency", "change": -2, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "International Aid Groups Lead Flood Response as {nation} Government Struggles",
                            "civic_event_text": "International relief organizations have taken a leading role in responding to floods in {nation}'s river delta, filling gaps left by what critics call an inadequate government response."
                        }
                    ]
                },
                {
                    "label": "Accept International Aid and Declare Emergency",
                    "ap": 1,
                    "money": 5000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 45,
                            "label": "United Response",
                            "message": "Declaring a national emergency opened the door to international aid, military reserve activation, and emergency budget allocations simultaneously. The combined response has been effective. Citizens see a government that isn't too proud to ask for help.",
                            "effects": [
                                { "stat_key": "happiness", "change": 4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 3, "target": "minister" },
                                { "stat_key": "international_reputation", "change": 3, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": -2, "target": "nation" },
                                { "stat_key": "gdp_growth", "change": -1, "target": "nation" }
                            ]
                        },
                        {
                            "chance": 35,
                            "label": "Sovereignty Concerns",
                            "message": "The international aid is helping, but opposition politicians are framing the emergency declaration as an admission of failure and the foreign presence as an embarrassment. 'Can't even handle a flood without foreigners' is trending.",
                            "effects": [
                                { "stat_key": "happiness", "change": 1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -2, "target": "minister" },
                                { "stat_key": "international_reputation", "change": 2, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 2, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Opposition Questions {nation}'s Reliance on Foreign Aid in Flood Response",
                            "civic_event_text": "Opposition leaders have criticized the government's decision to invite international aid organizations into flood-stricken regions, calling it an admission of state failure."
                        },
                        {
                            "chance": 20,
                            "label": "Aid Conditions Attached",
                            "message": "Some of the international aid came with strings — demands for governance transparency, human rights reporting, and economic reform commitments. The help is real but you've given outside actors leverage they didn't have before.",
                            "effects": [
                                { "stat_key": "happiness", "change": 2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -3, "target": "minister" },
                                { "stat_key": "international_reputation", "change": 2, "target": "nation" },
                                { "stat_key": "freedom_index", "change": 2, "target": "nation" },
                                { "stat_key": "corruption", "change": -1, "target": "nation" }
                            ]
                        }
                    ]
                }
            ]
        }
    }$$::jsonb
);
