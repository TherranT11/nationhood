-- Migration: Add "Police Brutality Scandal" ministry event template
-- Ministry: Interior | Gov Type: Democracy | Priority: Urgent
-- Event Key: interior_dem_police_brutality

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
    'interior_dem_police_brutality',
    'Video of Police Beating Goes Viral — Internal Review Requested',
    'Office of Internal Oversight',
    'interior',
    'urgent',
    2,
    8,
    true,
    ARRAY['Democracy'],
    'freedom_index',
    '>',
    30,
    $${
        "titles": [
            "Video of Police Beating Goes Viral — Internal Review Requested",
            "Urgent: Use-of-Force Incident Generating National Attention"
        ],
        "weight_conditions": [
            { "stat": "freedom_index", "op": ">", "value": 30 },
            { "stat": "civil_unrest", "op": ">", "value": 25 }
        ],
        "Democracy": {
            "bodies": [
                "Minister, a bystander\u2019s video showing police officers beating an unarmed man during a routine traffic stop has gone viral. The footage is unambiguous — the use of force was grossly disproportionate. Protests are forming outside the local precinct. The officers\u2019 union is already circling the wagons. The victim\u2019s family has retained legal counsel. Every hour you wait, the story grows."
            ],
            "options": [
                {
                    "label": "Immediate Suspension and Public Investigation",
                    "ap": 2,
                    "money": 8000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 45,
                            "label": "Accountability Wins Praise",
                            "message": "The officers involved have been suspended pending a full investigation. Your public statement condemning the use of force was direct and unequivocal. Civil liberties groups and most media outlets are praising the swift response. The protests have largely dispersed.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": -3, "target": "nation" },
                                { "stat_key": "freedom_index", "change": 2, "target": "nation" },
                                { "stat_key": "happiness", "change": 2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 3, "target": "minister" },
                                { "stat_key": "international_reputation", "change": 1, "target": "nation" },
                                { "stat_key": "crime_rate", "change": 1, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "{nation} Interior Minister Orders Investigation After Police Brutality Video",
                            "civic_event_text": "Interior Minister {minister} has ordered the immediate suspension and investigation of officers involved in a use-of-force incident captured on video. Civil liberties organizations have praised the swift response."
                        },
                        {
                            "chance": 35,
                            "label": "Police Union Revolt",
                            "message": "The officers\u2019 union is furious. Work slowdowns have begun in precincts across the country — officers are responding to calls but doing the bare minimum. Crime is ticking up and the union president is doing media rounds painting you as anti-police.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": 4, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 2, "target": "nation" },
                                { "stat_key": "freedom_index", "change": 1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -3, "target": "minister" },
                                { "stat_key": "happiness", "change": -1, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Police Slowdowns Reported Across {nation} After Officers Suspended",
                            "civic_event_text": "Police unions in {nation} have responded to the suspension of officers involved in a brutality incident with apparent work slowdowns. Crime response times have reportedly increased in major cities."
                        },
                        {
                            "chance": 20,
                            "label": "Investigation Reveals Systemic Problems",
                            "message": "The investigation didn\u2019t just find misconduct by these officers — it uncovered a pattern of abuse across the entire department. Dozens of complaints had been filed and ignored. The scandal has metastasized far beyond one video.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 4, "target": "nation" },
                                { "stat_key": "freedom_index", "change": 2, "target": "nation" },
                                { "stat_key": "corruption", "change": 2, "target": "nation" },
                                { "stat_key": "happiness", "change": -3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Investigation Reveals Widespread Abuse in {nation} Police Department",
                            "civic_event_text": "An investigation triggered by a viral brutality video has uncovered what officials describe as \u2018systemic failures\u2019 in police oversight across {nation}. Dozens of prior complaints were reportedly filed and ignored."
                        }
                    ]
                },
                {
                    "label": "Defend the Officers — Back the Police",
                    "ap": 1,
                    "money": 3000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 30,
                            "label": "Law-and-Order Base Rallies",
                            "message": "Your statement supporting the officers and emphasizing the dangers of policing has energized the law-and-order voter bloc. Police morale is high. But the protests haven\u2019t stopped, and the victim\u2019s family is now suing the state.",
                            "effects": [
                                { "stat_key": "crime_rate", "change": -2, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -3, "target": "nation" },
                                { "stat_key": "happiness", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 45,
                            "label": "Protests Escalate",
                            "message": "Your defense of the officers has poured fuel on the fire. Protests have spread to the capital and five major cities. Counter-protests by police supporters have created volatile confrontations. The situation is spinning out of control.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 6, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -2, "target": "nation" },
                                { "stat_key": "happiness", "change": -4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -3, "target": "minister" },
                                { "stat_key": "international_reputation", "change": -3, "target": "nation" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Protests Spread Across {nation} After Interior Minister Defends Officers",
                            "civic_event_text": "Demonstrations have erupted in cities across {nation} after Interior Minister {minister} publicly defended police officers seen on video beating an unarmed citizen. Counter-protests have led to violent clashes in several locations."
                        },
                        {
                            "chance": 25,
                            "label": "International Condemnation",
                            "message": "Human rights organizations and foreign governments have publicly criticized your response. The video is being played on international news with your quote defending the officers shown alongside it. It\u2019s a PR disaster.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 4, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -5, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -5, "target": "minister" },
                                { "stat_key": "happiness", "change": -3, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "International Human Rights Groups Condemn {nation}\u2019s Response to Police Violence",
                            "civic_event_text": "Multiple international human rights organizations have issued statements criticizing {nation}\u2019s Interior Minister for defending officers involved in a widely viewed incident of police brutality."
                        }
                    ]
                },
                {
                    "label": "Announce a Police Reform Commission",
                    "ap": 1,
                    "money": 5000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 35,
                            "label": "Buys Time, Calms Tensions",
                            "message": "The announcement of an independent commission staffed by judges, community leaders, and police veterans has satisfied most parties for now. The protests are winding down. The hard work of actual reform lies ahead, but the immediate crisis has passed.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": -2, "target": "nation" },
                                { "stat_key": "freedom_index", "change": 1, "target": "nation" },
                                { "stat_key": "happiness", "change": 1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 40,
                            "label": "Seen as Stalling",
                            "message": "Protest leaders dismissed the commission as \u2018another committee designed to produce a report no one will read.\u2019 They\u2019re demanding immediate action, not a study group. The announcement has bought you days, not weeks.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -2, "target": "minister" },
                                { "stat_key": "happiness", "change": -1, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Protesters Dismiss {nation} Police Reform Commission as \u2018Stalling Tactic\u2019",
                            "civic_event_text": "Organizers behind ongoing demonstrations against police brutality in {nation} have rejected the Interior Ministry\u2019s announcement of a reform commission, calling it a delay tactic designed to wait out public anger."
                        },
                        {
                            "chance": 25,
                            "label": "Commission Findings Embarrass the Government",
                            "message": "The commission took its mandate seriously — perhaps too seriously. Their preliminary findings paint a damning picture of police training, oversight, and accountability. The report is now public and the demands for action are louder than ever.",
                            "effects": [
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" },
                                { "stat_key": "freedom_index", "change": 2, "target": "nation" },
                                { "stat_key": "corruption", "change": 1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" },
                                { "stat_key": "happiness", "change": -2, "target": "nation" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Reform Commission Report Exposes \u2018Deep Failures\u2019 in {nation} Policing",
                            "civic_event_text": "A government-appointed police reform commission has published preliminary findings describing \u2018deep systemic failures\u2019 in officer training, oversight, and accountability across {nation}\u2019s law enforcement agencies."
                        }
                    ]
                }
            ]
        }
    }$$::jsonb
);
