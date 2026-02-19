-- Migration: Add "Media Outlet Publishing Exposé" ministry event template
-- Ministry: Interior | Gov Type: Autocracy | Priority: Urgent
-- Event Key: interior_auto_media_expose

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
    'interior_auto_media_expose',
    'Independent Outlet Preparing Critical Report on Government',
    'State Media Monitoring Bureau',
    'interior',
    'urgent',
    2,
    8,
    true,
    ARRAY['Autocracy'],
    'freedom_index',
    '>',
    15,
    '{
        "titles": [
            "Independent Outlet Preparing Critical Report on Government",
            "Media Monitoring Flags Upcoming Hostile Publication"
        ],
        "weight_conditions": [
            { "stat": "freedom_index", "op": ">", "value": 15 },
            { "stat": "corruption", "op": ">", "value": 30 }
        ],
        "Autocracy": {
            "bodies": [
                "Minister, our media monitoring bureau has intercepted communications indicating that an independent news outlet is preparing to publish a major investigative report on government corruption. The report allegedly contains internal documents, financial records, and testimony from former officials. Publication is expected within days. We have the name of the editor, the outlet\u2019s address, and the identities of at least two sources. What are your orders?"
            ],
            "options": [
                {
                    "label": "Shut the Outlet Down",
                    "ap": 2,
                    "money": 8000,
                    "money_scaling_stat": "freedom_index",
                    "outcomes": [
                        {
                            "chance": 45,
                            "label": "Publication Prevented",
                            "message": "Security forces raided the outlet\u2019s offices, seized all equipment and documents, and detained the editorial staff. The story will never see print. Other independent outlets have gotten the message \u2014 self-censorship has increased noticeably.",
                            "effects": [
                                { "stat_key": "freedom_index", "change": -8, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -2, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -6, "target": "nation" },
                                { "stat_key": "happiness", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 1, "target": "minister" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Independent News Outlet Shut Down by Authorities in {nation}",
                            "civic_event_text": "Security forces in {nation} raided and closed an independent news organization, seizing equipment and detaining journalists. International press freedom organizations have condemned the action."
                        },
                        {
                            "chance": 30,
                            "label": "Story Published Anyway \u2014 Foreign Mirror",
                            "message": "The editor anticipated the raid and had already transmitted the full report to international partners. The story broke on foreign news services hours before your forces arrived. The raid itself became part of the story \u2014 proof the report was credible enough to suppress.",
                            "effects": [
                                { "stat_key": "corruption", "change": 2, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -6, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -6, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -8, "target": "nation" },
                                { "stat_key": "happiness", "change": -3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Suppressed Corruption Report Published Internationally After {nation} Raids Newsroom",
                            "civic_event_text": "A major investigative report on government corruption in {nation} has been published by international news partners after the original outlet was raided by security forces. Press freedom advocates say the raid itself validates the report\u2019s findings."
                        },
                        {
                            "chance": 25,
                            "label": "Journalist Killed During Raid",
                            "message": "An agent acted without authorization during the raid and a journalist was killed. The death has become an international incident. Sanctions are being discussed. Domestically, even regime loyalists are shaken.",
                            "effects": [
                                { "stat_key": "freedom_index", "change": -10, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -8, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -12, "target": "nation" },
                                { "stat_key": "happiness", "change": -6, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 6, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -6, "target": "minister" }
                            ],
                            "civic_event_category": "Security",
                            "civic_event_name": "Journalist Killed During Government Raid in {nation}; International Condemnation Follows",
                            "civic_event_text": "A journalist was killed during a security raid on an independent news outlet in {nation}. The death has triggered widespread international condemnation, with multiple governments calling for sanctions and an independent investigation."
                        }
                    ]
                },
                {
                    "label": "Discredit the Story Before Publication",
                    "ap": 1,
                    "money": 12000,
                    "money_scaling_stat": "corruption",
                    "outcomes": [
                        {
                            "chance": 35,
                            "label": "Narrative Controlled",
                            "message": "State media launched a preemptive campaign questioning the outlet\u2019s funding sources, the editor\u2019s personal life, and the credibility of the alleged sources. By the time the story published, the public narrative was already poisoned. Most citizens dismissed it as propaganda.",
                            "effects": [
                                { "stat_key": "corruption", "change": 1, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -3, "target": "nation" },
                                { "stat_key": "legitimacy", "change": 1, "target": "nation" },
                                { "stat_key": "happiness", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 2, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 40,
                            "label": "Streisand Effect",
                            "message": "The preemptive attack drew more attention to the upcoming story, not less. Citizens who would never have read an independent outlet are now seeking it out. The story\u2019s reach has multiplied.",
                            "effects": [
                                { "stat_key": "corruption", "change": 3, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 3, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -4, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -3, "target": "minister" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Government Attacks on Independent Media Backfire as Corruption Report Goes Viral in {nation}",
                            "civic_event_text": "A government campaign to discredit an independent news outlet in {nation} appears to have drawn unprecedented public attention to allegations of official corruption."
                        },
                        {
                            "chance": 25,
                            "label": "Sources Come Forward Publicly",
                            "message": "Your attack on the outlet\u2019s credibility prompted the anonymous sources to go public with their identities, declaring they\u2019re willing to testify. The story just became much harder to dismiss.",
                            "effects": [
                                { "stat_key": "corruption", "change": 5, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -6, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 4, "target": "nation" },
                                { "stat_key": "international_reputation", "change": -3, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -5, "target": "minister" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Former Officials Go Public With Corruption Allegations Against {nation} Government",
                            "civic_event_text": "Two former government officials in {nation} have publicly identified themselves as sources behind a corruption investigation, offering to testify before any independent inquiry. The move dramatically escalates a story the government had attempted to suppress."
                        }
                    ]
                },
                {
                    "label": "Get Ahead of It \u2014 Controlled Admission",
                    "ap": 1,
                    "money": 5000,
                    "money_scaling_stat": "",
                    "outcomes": [
                        {
                            "chance": 30,
                            "label": "Masterful Spin",
                            "message": "You leaked a sanitized version of the story to state media first, framing it as \u2018the government\u2019s own anti-corruption investigation.\u2019 When the independent outlet published, their story looked like old news. Brilliant.",
                            "effects": [
                                { "stat_key": "corruption", "change": -1, "target": "nation" },
                                { "stat_key": "legitimacy", "change": 2, "target": "nation" },
                                { "stat_key": "freedom_index", "change": -1, "target": "nation" },
                                { "stat_key": "minister_approval", "change": 3, "target": "minister" }
                            ]
                        },
                        {
                            "chance": 45,
                            "label": "Partial Credit",
                            "message": "The state media version got out first but the independent report contained far more damaging details that the government\u2019s version conveniently omitted. Citizens are comparing the two and the gaps are obvious.",
                            "effects": [
                                { "stat_key": "corruption", "change": 2, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -2, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -1, "target": "minister" }
                            ],
                            "civic_event_category": "General",
                            "civic_event_name": "Independent Report Contradicts Government\u2019s Own Corruption Narrative in {nation}",
                            "civic_event_text": "An independent investigation has revealed corruption allegations significantly more extensive than those acknowledged in a recent government statement. Critics accuse the Interior Ministry of attempting to control the narrative through selective disclosure."
                        },
                        {
                            "chance": 25,
                            "label": "Admission Used Against You",
                            "message": "Opposition networks are using your own admission as proof of guilt, stripping away the spin and presenting only the confession. \u2018Even the government admits it\u2019 has become a rallying cry.",
                            "effects": [
                                { "stat_key": "corruption", "change": 3, "target": "nation" },
                                { "stat_key": "legitimacy", "change": -5, "target": "nation" },
                                { "stat_key": "civil_unrest", "change": 4, "target": "nation" },
                                { "stat_key": "minister_approval", "change": -4, "target": "minister" }
                            ]
                        }
                    ]
                }
            ]
        }
    }'::jsonb
);
