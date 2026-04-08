-- ==================== FIX VOSTIA PARTY LEADER NAMES ====================
-- One-time fix: Vostian parties were assigned Crucera (Spanish) fallback names
-- because createparty.html was missing Vostia from its NATION_NAMES lookup.
-- This script reassigns all Vostian party leaders to Serbian/Slavic names.

UPDATE factions f
SET leader_first_name = (ARRAY[
      'Dragan','Goran','Vuk','Zoran','Dušan','Nemanja','Bogdan','Slobodan',
      'Vlastimir','Milorad','Gvozden','Radomir','Branislav','Jovan','Dimitrije',
      'Ognjen','Lazar','Miodrag','Zdravko','Nebojša','Predrag','Stojan',
      'Vojislav','Darko','Borislav','Momčilo','Uroš','Radoš','Božidar',
      'Gavrilo','Vasilije','Đorđe','Radovan','Blagoje','Veljko','Živko',
      'Krsto','Miloš','Draško','Balša',
      'Dragana','Svetlana','Jelena','Milica','Danica','Zora','Radmila','Snežana','Vesna'
    ])[1 + floor(random() * 49)::int],
    leader_last_name = (ARRAY[
      'Jovanović','Petrović','Đorđević','Marković','Nikolić','Popović',
      'Stojanović','Ilić','Lukić','Babić','Ristić','Kostić','Vuković',
      'Lazarević','Kovačević','Simić','Milošević','Stevanović','Tomić',
      'Savić','Radović','Dimitrijević','Vasić','Bogdanović','Jović',
      'Krstić','Mladenović','Filipović','Gajić','Cvetković','Mitić',
      'Todorović','Milosavljević','Živković','Knežević','Pantić','Stanković',
      'Marić','Mihajlović','Tasić','Pavlović','Kuzmanović','Milanović'
    ])[1 + floor(random() * 43)::int]
FROM nations n
WHERE f.nation_id = n.id
  AND n.name = 'Vostia'
  AND f.faction_type = 'party';
