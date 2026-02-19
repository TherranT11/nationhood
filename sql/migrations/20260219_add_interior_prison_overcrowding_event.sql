-- Migration: Add "Prison Overcrowding Crisis" ministry event template
-- Ministry: Interior | Gov Type: Democracy | Priority: Urgent
-- Event Key: interior_dem_prison_overcrowding

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
    'interior_dem_prison_overcrowding',
    'Prisons at 140% Capacity — Warden Council Requests Emergency Meeting',
    'National Corrections Authority',
    'interior',
    'urgent',
    3,
    12,
    true,
    ARRAY['Democracy'],
    'crime_rate',
    '>',
    45,
    '{
        "titles": [
            "Prisons at 140% Capacity — Warden Council Requests Emergency Meeting",
            "Corrections Authority Warns of Imminent Prison Crisis"
        ],
        "weight_conditions": [
            { "stat": "crime_rate", "op": ">", "value": 45 },
            { "stat": "happiness", "op": "<", "value": 45 }
        ],
        "Democracy": {
            "bodies": [
                "Minister, the national prison system has reached a breaking point. Facilities designed for 30,000 inmates are holding over 42,000. Conditions are deteriorating — violence between inmates is rising, medical care is collapsing, and correctional officers are resigning faster than we can hire. The Warden Council is warning that a major incident is inevitable unless action is taken. The opposition will frame any response as either \u2018soft on crime\u2019 or \u2018inhumane\u2019 depending on what you do."
            ],
            "options": [
                {
                    "label": "Emergency Early Release Program",
                    "ap": 2,
                    "money": 6000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 35,
                            "label": "Smooth Transition",
                            "message": "Eight thousand low-risk, non-violent offenders have been released under supervised parole. The prison system is breathing again, conditions have stabilized, and the recidivism rate so far is within acceptable bounds. Civil liberties groups are praising the decision.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": 2, "target": "nation" },
                                { "stat_key": "happiness", "change": 3, "target": "nation" },
                                { "stat_key": "freedom_index", "change": 2, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 2, "target": "minister" },
                                { "stat_key": "international_reputation", "change": 1, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Early Release Program Eases Prison Crisis in {nation}",
                            "civic_event_text": "The Interior Ministry\u2019s emergency early release program has successfully reduced prison overcrowding by releasing thousands of non-violent offenders under supervised parole. Civil liberties organizations have praised the measure."
                        },
                        {
                            "chance": 40,
                            "label": "Recidivism Spike",
                            "message": "The early release program reduced overcrowding, but within weeks, crime in urban areas has spiked noticeably. Several released inmates have been rearrested for serious offenses. The opposition is running attack ads.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": 6, "target": "nation" },
                                { "stat_key": "happiness", "change": -2, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" },
                                { "stat_key": "freedom_index", "change": 1, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Crime Spike Follows Controversial Early Release Program in {nation}",
                            "civic_event_text": "A surge in criminal activity has been linked to the Interior Ministry\u2019s early release program, with several former inmates rearrested for violent offenses. Opposition lawmakers have called the program \u2018reckless.\u2019"
                        },
                        {
                            "chance": 25,
                            "label": "High-Profile Incident",
                            "message": "A released inmate committed a violent crime that has dominated the news cycle for days. The victim\u2019s family is speaking to every camera available. The entire early release program is now politically radioactive.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": 4, "target": "nation" },
                                { "stat_key": "happiness", "change": -5, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -7, "target": "minister" },
                                { "stat_key": "freedom_index", "change": 1, "target": "nation" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Violent Crime by Released Inmate Sparks Outrage Over {nation}\u2019s Early Release Policy",
                            "civic_event_text": "A violent offense committed by a recently released prisoner has ignited a firestorm of criticism against {nation}\u2019s early release program. The victim\u2019s family has called for the Interior Minister\u2019s resignation."
                        }
                    ]
                },
                {
                    "label": "Emergency Funding for New Facilities",
                    "ap": 2,
                    "money": 25000,
                    "money_scaling_stat": "crime_rate",
                    "outcomes": [
                        {
                            "chance": 45,
                            "label": "Construction Underway, Situation Stabilizes",
                            "message": "Emergency contracts have been issued for three temporary detention facilities and the expansion of two existing prisons. It\u2019s expensive and the opposition is questioning the cost, but conditions are improving and the wardens are cooperating.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": -1, "target": "nation" },
                                { "stat_key": "happiness", "change": 1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" },
                                { "stat_key": "gdp_growth", "change": -1, "target": "nation" }
                            ]
                        },
                        {
                            "chance": 35,
                            "label": "Corruption in Construction Contracts",
                            "message": "The rushed procurement process attracted contractors more interested in profit than quality. Facilities are behind schedule, over budget, and inspectors have flagged structural concerns. Someone in the procurement chain is getting rich.",
                            "effects": [
                                { "stat_key": "corruption", "change": 3, "target": "nation" },
                                { "stat_key": "crime_rate", "change": -1, "target": "nation" },
                                { "stat_key": "happiness", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -3, "target": "minister" },
                                { "stat_key": "gdp_growth", "change": -2, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Prison Construction Contracts Under Scrutiny in {nation}",
                            "civic_event_text": "An emergency prison expansion program in {nation} has come under fire after reports of inflated costs and substandard construction. Opposition lawmakers are demanding an audit of the Interior Ministry\u2019s procurement process."
                        },
                        {
                            "chance": 20,
                            "label": "Public Backlash — \"Building Prisons, Not Schools\"",
                            "message": "The massive spending on prison construction has become a lightning rod. Opposition parties, teachers\u2019 unions, and healthcare advocates have united around the message that the government\u2019s priorities are fundamentally wrong.",
                            "effects": [
                                { "stat_key": "happiness", "change": -4, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -5, "target": "minister" },
                                { "stat_key": "gdp_growth", "change": -1, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Critics Slam {nation} Government for Prioritizing Prisons Over Public Services",
                            "civic_event_text": "A coalition of opposition parties and public service unions has condemned the government\u2019s emergency prison spending, arguing the funds would be better spent on education and healthcare."
                        }
                    ]
                },
                {
                    "label": "Sentencing Reform — Reduce Intake",
                    "ap": 1,
                    "money": 3000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 40,
                            "label": "Gradual Improvement",
                            "message": "New sentencing guidelines reducing mandatory minimums for non-violent offenses have begun to slow the flow of inmates into the system. It\u2019s not a quick fix, but the trajectory has shifted. Legal experts are broadly supportive.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": 1, "target": "nation" },
                                { "stat_key": "freedom_index", "change": 3, "target": "nation" },
                                { "stat_key": "happiness", "change": 1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 35,
                            "label": "\"Soft on Crime\" Narrative Takes Hold",
                            "message": "The opposition has successfully framed sentencing reform as weakness. Polls show a majority of citizens believe the government is prioritizing criminals over victims. The policy may be sound, but the politics are toxic.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": 1, "target": "nation" },
                                { "stat_key": "freedom_index", "change": 2, "target": "nation" },
                                { "stat_key": "happiness", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" },
                                { "stat_key": "civil_unrest", "change": 1, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Opposition Blasts Sentencing Reform as \u2018Soft on Crime\u2019 in {nation}",
                            "civic_event_text": "Opposition parties in {nation} have launched a coordinated campaign against the Interior Ministry\u2019s sentencing reform initiative, arguing it prioritizes offender comfort over public safety."
                        },
                        {
                            "chance": 25,
                            "label": "Judges Resist the Guidelines",
                            "message": "The judiciary has pushed back, with several senior judges publicly declaring they will not be bound by \u2018political interference in sentencing.\u2019 The reform is stalled in a constitutional battle that makes everyone look bad.",
                            "effects": [
                                { "stat_key": "freedom_index", "change": 1, "target": "nation" },
                                { "stat_key": "happiness", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -3, "target": "minister" },
                                { "stat_key": "civil_unrest", "change": 2, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Judiciary Clashes With Government Over Sentencing Reform in {nation}",
                            "civic_event_text": "Senior judges in {nation} have publicly rejected new sentencing guidelines issued by the Interior Ministry, calling them an overreach of executive authority. The standoff has raised questions about separation of powers."
                        }
                    ]
                }
            ]
        }
    }'::jsonb
);
